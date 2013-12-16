openerp.unleashed.module('dashboard').ready(function(instance, dashboard, _, Backbone, base){



    var UnleashedView = base.views('Unleashed');

    instance.web.views.add('dashboard', 'instance.dashboard.DashboardView');
    instance.dashboard.DashboardView = UnleashedView.extend({
        
        display_name: base._lt('Dashboard'),
        template: "Dashboard",
        view_type: 'dashboard',

        Panel: dashboard.views('Panel'),
        State: dashboard.models('State'),

        init: function(parent, dataset, view_id, options) {
            this.previousMode = 'list';
            this.board_id = dataset.ids[0] || null;
            this._super(parent, dataset, view_id, options);
            this.context = dataset.get_context();
        },

        stateConfig: function(){
            this.state.link({
                board: this.models.board
            });
        },

        start: function(){

            if(!this.board_id){
                throw new Error("Dashboard view can not be initialized with a 'res_id' configured in the action.");
            }    

            //models
            var Board = dashboard.models('Board');

            var board = new Board({
                id: this.board_id
            });

            this.models = { board: board };



            return this._super()
        },


        ready: function(){

            //views, instantiated after state processing (widgets views require fetched models)
            var Board = dashboard.views('Board');

            var board = new Board({
                model: this.models.board,
                debug: this.session.debug
            });

            this.views = { board: board };

            //display views
            this.panel.dashboard.directShow(this.views.board);

            this.bind();
        },


        bind: function(){
            //listen module events
            dashboard.on('open:list',this.openList,this);
            dashboard.on('fullscreen', this.fullscreen, this);
            dashboard.on('print', this.print, this);
            dashboard.on('print:close', this.closePrint, this);

            dashboard.on('mode', this.views.board.switchMode, this.views.board);

            dashboard.on('animate:start', this.views.board.startAnim, this.views.board);
            dashboard.on('animate:stop', this.views.board.stopAnim, this.views.board);

            dashboard.on('widgets:go', this.views.board.goToWidget, this.views.board);
            
            this.$el.parent().bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', $.proxy(this.refreshMode, this));
            
            //bind the state changes with the URL
            this.state.on('change', this.stateChanged, this);
            
            //global search changes
            this.models.board.global.search.on('set:domain', this.setGlobalDomain, this);
            this.models.board.global.search.on('remove:domain', this.removeGlobalDomain, this);
        },
        
        setGlobalDomain: function(field, operator, value){
            this.models.board.widgets.each(function(widget){
                widget.searchModel.addDomain(field, operator, value, {global: true});
            });
        },
        
        removeGlobalDomain: function(field, operator, value){
            this.models.board.widgets.each(function(widget){
                widget.searchModel.removeDomain(field, operator, value, {global: true});
            });
        },

        print: function(){

            var Board = dashboard.views('Board');

            var printBoard = new Board({
                    model: this.models.board,
                    Toolbar: 'PrintToolbar'
                }),
                $openerp = $('.openerp'),
                html = base.render('Dashboard.print');
            
            this.views.board.stopSliding();
            this.views.board.resetSliding();

            $openerp.find('table.oe_webclient').hide();

            $openerp.append(html);
            
            var print_region = this.printRegion = new Marionette.Region({
                el: '#print-dashboard'
            });

            print_region.show(printBoard);

            printBoard.views.widgets.mode('list');
            printBoard.views.widgets.removable(true);
            printBoard.views.widgets.printable(true);


            /*
            window.print();
            */
        },
        
        closePrint: function(){
            var $openerp = $('.openerp');
        
            if(this.printRegion){
                this.printRegion.close();
                this.printRegion.$el.remove();

                $openerp.find('table.oe_webclient').show();
                this.views.board.refresh();
            }
        },
        
        fullscreen: function(enter){
            var widgets = this.views.board.views.widgets;

            this.views.board.stopAnim();
            this.views.board.resetSliding();
            this.previousMode = widgets.type;

            if(enter){
                this.enterFullscreen();
            }
            else {
                this.exitFullscreen();
            }
        },
        
        enterFullscreen: function(){
            var element = this.$el.parent().get(0);
            if (element.requestFullScreen) {
                element.requestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            }
            
            this.$el.parent().addClass('fullscreen');
        },
        
        exitFullscreen: function(){
            if(document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if(document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if(document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }  
  
            this.$el.parent().removeClass('fullscreen');
        },

        openList: function(metric, search){
        	
        	var domain = search.get('domain'),
        	    has_domain = domain.length > 0,
            	groups = _(domain).groupBy(function(criterion){ 
                    return criterion.field.get('reference'); 
                }),
                period = this.models.board.period,
                period_field = metric.fields.types('period').at(0);
                
            if(period_field){
                var period_path = period_field.get('domain_field_path'),
                    orm_domain = search.domain('domain_field_path');
        	}
        	else {
        	    console.warn('no period field available for this metric');
            }
        	
        	
        	// add period to the domain
            if(period_path){
               orm_domain = orm_domain.concat([[period_path, '>=', period.start('s')] , [period_path, '<', period.end('s')]])
            }
            else {
                console.warn('period', period_field, 'does not have a', 'domain_field_path', 'attribute, the period will not be used in metric list view...');
            }
            
            var show = this.$el.show;
            this.$el.show = function(){
                $('.search.outside').remove();
                show.apply(this, arguments);
            };
            
        	
        	// We use this new ergonomy with a top bar instead of passing the domain in the context 
        	// because we allow the search on fields which are not directly on the main model
        	// For instance: order_id.partner_id.country_id.name
        	$('.oe_view_manager').before(
        		$('<div class="search outside">').html(
        		    base.render('Dashboard.metric_info', {
                        operators: search.operators,
                        group_size: _(groups).size(),
                        groups: groups,
                        has_domain: has_domain,
                        period: period.values('LL'),
                        period_field: period_field,
                        has_period: !!period_path
                    })
        		)
        	)
        	
        	
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: metric.get('model_details').model,  
                domain: orm_domain,
                name: metric.get('model_details').name,
                flags : {
                	new_window : true,
                	search_view: true,
                	display_title: true,
                	pager: true,
                	list: {selectable: true}
                },
                target: 'current',
                view_mode: 'list,form',
                views: [[false /*view id, false if none*/,'list'/*view type*/], [false, 'form']],
                context: this.context.eval(),
            });
        },

        on_show: function(){
        	$('.search.outside').remove();
        }
    });     
});