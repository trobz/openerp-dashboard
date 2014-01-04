openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){

    var SearchView = dashboard.views('Search');

    var Layout = Marionette.Layout,
        _super = Layout.prototype;

    var Widget = Layout.extend({
        
        className: 'widget',
        
        template: 'Dashboard.widget',
        
        events: {
            'click .toggle_search': 'toggleSearch',
            'click .remove_widget': 'hide',
            'mouseenter .icon-question-sign': 'toggleHelp',
            'mouseout .icon-question-sign': 'toggleHelp',
        },
        
        ui: {
            loader: '.loader',
            helper: '.widget_help',
            remove: '.remove_widget',
        },
        
        regions: {
            search: '.search',
            display: '.display',
            status: '.status',
            pager: '.pager'
        },
        
        bindSearch: {
            'numeric': ['domain', 'group'],
            'list':    ['domain', 'order'],
            'graph':   ['domain', 'order', 'group']
        },
        
        initialize: function(options){

            var Status = dashboard.views('WidgetStatus'),
                Display = dashboard.views('WidgetDisplay'),
                Pager = base.views('Pager');

            this.resize();
            
            this.is_removable = options.removable;
            this.is_printable = options.printable;
            this.debug = options.debug;
            this.type = this.model.get('type');
            
            
            this.models = {
                period: options.period 
            };

            this.views = {
                pager: new Pager({
                    model: this.model
                }),
                status: new Status({
                    collection: this.model.metrics,
                    search: this.model.searchModel,
                    model: this.model
                }),
                search: new SearchView({
                    collection: this.model.metrics.fields,
                    type: this.model.get('type'),
                    search: this.model.searchModel
                }),
                display: new Display({
                    collection: this.model.metrics,
                    type: this.model.get('type'),
                    search: this.model.searchModel,
                    printable: this.is_printable
                })
            };
        
            this.addDefaultsSearch();
            
            this.listenTo(this.models.period, 'change', this.doSearch);
            
            // set search attribute listened by the widget
            this.listen = this.type in this.bindSearch ? this.bindSearch[this.type] : []; 
            _(this.listen).each(function(attr){
                this.listenTo(this.model.searchModel, 'change:' + attr, this.doSearch);
            }, this);    
        },
        
        
        printable: function(state){
            this.is_printable = state;
            this.views.display.printable(state);
        },
        
        removable: function(state){
            this.is_removable = state;
            if(this.is_removable){
                this.ui.remove.show();
            }
            else {
                this.ui.remove.hide();
            }
        },
        
        hide: function(){
            this.$el.hide();    
        },
        
        resize: function(){
            this.$el.addClass('size' + this.model.get('width'));
            this.$el.attr('id', 'widget_' + this.model.get('id'));
        },
        
        doSearch: function(){
            var search = this.model.searchModel, 
                options = { debug: this.debug, period: this.models.period.values(), domain: [], order: [], group: [] };
       
            //pass only search attributes that the widget is listening to     
            _(options).each(function(def, attr){
                if(_(this.listen).contains(attr) && $.isFunction(search[attr])){
                    options[attr] = search[attr].call(search);
                }
            }, this);    
        
            
            promise = this.model.execute(options);

            this.bindUIElements();

            var $loader = this.ui.loader;

            $loader.attr('class', 'loader icon-refresh icon-spin');
            promise.done(function(){
                $loader.attr('class', 'loader invisible icon-refresh');
            });
            promise.fail(function(){
                var _t = base._t;
                $loader.attr({
                    'class': 'loader icon-warning-sign',
                    'title':  _t('Oops, error during widget loading, please check your search parameters again...')
                });
            });
            
            return promise;
        },
        
        
        onRender: function(){
            if(this.views.search.fields.domain.length == 0){
                this.$el.find('.toggle_search').hide()
            }
            this.status.show(this.views.status);
            this.search.show(this.views.search);
            this.display.show(this.views.display);

            
            if(this.model.hasPager()){
                this.pager.show(this.views.pager);
            }
            
            this.doSearch();
        },
        
        hide: function(){
            this.$el.hide();
        },
        
        show: function(){
            this.$el.show();
        },
        
        addDefaultsSearch: function(){
            var search_model = this.model.searchModel,
                search_view = this.views.search;
            
            this.model.metrics.each(function(metric){
                var defaults = metric.get('defaults'),
                    field, type, matches;
                    
                if('group_by' in defaults && defaults['group_by'].length > 0){
                    field = metric.fields.oneByRef(defaults['group_by'][0]);
                    if(field){
                        search_model.defaultGroup(field);
                        search_view.fields.order.add(field);
                    }
                }
                if('order_by' in defaults && defaults['order_by'].length > 0){
                    matches = defaults['order_by'][0].match(/(?:['"])?([a-z0-9_-]+)(?:['"])? (asc|desc)/i);
                    if(matches.length == 3){
                        field = metric.fields.oneByRef(matches[1]);
                        type = matches[2].toUpperCase();
                        if(field && type) {
                            search_model.defaultOrder(field, type);    
                        }
                    }
                }
            });
        
        },
        
        /*
         * UI Events
         */
        
        toggleSearch: function(e){
            e.preventDefault();
            
            if(this.search.$el.hasClass('hidden')){
                this.search.$el.removeClass('hidden');
            }
            else {
                this.search.$el.addClass('hidden');
            }
        },

        toggleHelp: function(e){
            e.preventDefault();
            
            if(this.ui.helper.hasClass('hidden')){
            	this.ui.helper.removeClass('hidden');
            }
            else {
            	this.ui.helper.addClass('hidden');
            }
        },
        
        serializeData: function(){                  	
            return {
              "removable": this.is_removable,
              "name": this.model.get('name'),
              'metrics': this.model.metrics.toArray(),
              'has_help': this.model.metrics.some(function(metric){return metric.get('help'); })
            }
        }
    });

    dashboard.views('Widget', Widget);

});