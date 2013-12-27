openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){

    var Region = base.views('Region');

    var Layout = Backbone.Marionette.Layout,
        _super = Layout.prototype;


    var Board = Layout.extend({

        template: 'Dashboard.panel',

        regionType: Region,


        getTemplate: function(){
            return this.options.template
        },

        initialize: function(options){

            this.options = _.extend({
                template: this.template,

                Toolbar: 'Toolbar',
                Widgets: 'Widgets'

            }, options);


            var WidgetsView = dashboard.views(this.options.Widgets),
                Toolbar = dashboard.views(this.options.Toolbar);

            var toolbar = new Toolbar({
                    model: this.model
                }),
                widgets = new WidgetsView({
                    model: this.model,
                    collection: this.model.widgets,
                    // allow Widget View overrides
                    itemView: dashboard.views('Widget'),
                    period: this.model.period,
                    global_search: this.model.global.search,
                    debug: options.debug || false
                });

            this.views = { toolbar: toolbar, widgets: widgets };

        },

        onRender: function(){
            this.$el.addClass('list');
            this.toolbar.directShow(this.views.toolbar);
            this.widgets.directShow(this.views.widgets);
        },

        refresh: function(){
            this.views.widgets.render();
        },

        switchMode: function(type){
            var $el = this.$el;
            $el.removeClass('list').removeClass('sliding');
            $el.addClass(type);
            this.views.widgets.mode(type);
        },

        refreshMode: function(){
            var widgets = this.views.widgets;
            if(widgets.type == 'sliding'){
                console.log('fullscreen changed');
                //force refresh
                this.startAnim(this.anim_duration || 10000);
            }
            widgets.mode(this.previousMode);

        },

        startAnim: function(duration){
            this.anim_duration = duration;
            this.views.widgets.animate(duration);
        },

        stopAnim: function(){
            this.views.widgets.stopAnimate();
        },

        stopSliding: function(){
            this.views.toolbar.stopSliding();
        },

        resetSliding: function(){
            this.views.widgets.resetSliding();
        },

        goToWidget: function(direction){
            var widgets = this.views.widgets;
            if(widgets.type == 'sliding'){
                this.views.toolbar.stopSliding();
                if(direction == 'next'){
                    widgets.next();
                }
                else {
                    widgets.previous();
                }
            }
        },


        regions: {
            toolbar: '#toolbar',
            widgets: '#widgets'
        }
    });

    dashboard.views('Board', Board);
});