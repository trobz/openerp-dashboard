openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
 
    var TimeBar = dashboard.views('TimeBar'),
        SearchView = dashboard.views('Search');
 
    var Layout = Marionette.Layout,
        _super = Layout.prototype;

    var Toolbar = Layout.extend({
        
        regions: {
            timebar: '#timebar',
            searchbar: '#searchbar'
        },
        
        template: 'Dashboard.toolbar',
        
        events: {
            'click .board_action .print_action': 'print',
            'click .board_action .fullscreen_action': 'switchFullscreen',
            'click .board_action .sliding_action': 'slidingMode',
            'click .board_action .pause_sliding': 'pauseSliding',
            'click .board_action .list_action': 'listMode',
            'click .board_action .search_action': 'toggleSearch',
            
            'click .prev-widget': 'prevWidget',
            'click .next-widget': 'nextWidget',
            
            'change .sliding_timeout': 'changeSliding'
        },
        
        ui: { 
            mode: '.mode'
        }, 
        
        onRender: function(){
            this.views = {
                timebar: new TimeBar({
                    model: this.model.period
                }),
                searchbar: new SearchView({
                    collection: this.model.global.fields,
                    search: this.model.global.search,
                    type: 'global',
                    enabled: ['domain']
                })
            };
              
            this.timebar.show(this.views.timebar);
            
            this.views.searchbar.hide();
            this.searchbar.show(this.views.searchbar);
            if (this.views.searchbar.fields.domain.length == 0) {
                this.$el.find('.search_action').closest('.section.board_action.right').hide()
                this.$el.find('.section.board_action.right').css({float : 'left'})
            }

        },
        
        print: function(e){
            if(e) e.preventDefault();
            
            dashboard.trigger('print');        
        },
        
        
        prevWidget: function(e){
            if(e) e.preventDefault();
            dashboard.trigger('widgets:go', 'previous');
        },
        
        nextWidget: function(e){
            if(e) e.preventDefault();
            dashboard.trigger('widgets:go', 'next');
        },
        
        toggleSearch: function(e){
            if(e) e.preventDefault();
            
            this.views.searchbar.toggle();
        },
        
        switchFullscreen: function(e){
            if(e) e.preventDefault();
            
            var $icon = $(e.currentTarget).find('i');
        
            this.fullscreen = !this.fullscreen;
            dashboard.trigger('fullscreen', this.fullscreen);        
            $icon.attr('class', this.fullscreen ? 'icon-resize-small' : 'icon-resize-full');
        },
        
        changeSliding: function(e){
            var $time = $(e.currentTarget);
            dashboard.trigger('animate:start', $time.find('option:selected').val());        
        },
        
        slidingMode: function(e){
            if(e) e.preventDefault();
            
            var html = Marionette.Renderer.render('Dashboard.toolbar.sliding');
            this.ui.mode.empty().html(html);
        
            var $time = this.$el.find('.sliding_timeout');
            dashboard.trigger('mode', 'sliding');        
            dashboard.trigger('animate:start', $time.find('option:first-child').val());        
        },
        
        pauseSliding: function(e){
            if(e) e.preventDefault();
            
            var $button = $(e.currentTarget),
                $icon = $button.find('i');
            
            if($icon.is('.icon-pause')){
                this.stopSliding();
            }
            else {
                this.startSliding();
            }
        },
        
        stopSliding: function(){
            var $button = this.$el.find('.pause_sliding'),
                $icon = $button.find('i');
            
            $icon.attr('class', 'icon-play');
            dashboard.trigger('animate:stop');        
        
        },
        
        startSliding: function(){
            var $button = this.$el.find('.pause_sliding'),
                $time = $button.prevAll('select'),
                $icon = $button.find('i');
            
            $icon.attr('class', 'icon-pause');
            dashboard.trigger('animate:start', $time.find('option:selected').val());        
        },
        
        listMode: function(e){
            if(e) e.preventDefault();
            
            dashboard.trigger('mode', 'list');
            dashboard.trigger('animate:stop');        
            
            var html = Marionette.Renderer.render('Dashboard.toolbar.list');
            this.ui.mode.empty().html(html);
        },
        
    });

    dashboard.views('Toolbar', Toolbar);

});