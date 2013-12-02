openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){


    var Renderer = Marionette.Renderer,
        View = Marionette.ItemView,
        _super = View.prototype;

    var WidgetStatus = View.extend({
        
        template: 'Dashboard.widget.status',
        
        events: {
            'click .metric': 'openMetric'
        },
        
        modelEvents: {
            'change:updated_at': 'render'
        },
        
        initialize: function(options){
            this.search = options.search;
        },
        
        render: function(){
            var updated_at = this.model.get('updated_at');
            var html = Renderer.render(this.template, {
                metrics: this.collection.toArray(),
                updated_at: updated_at ? updated_at.format('LT') : base._t('not updated yet')
            });
            
            this.$el.empty();
            this.$el.html(html);    
        },
        
        // UI Events
        
        openMetric: function(e){
            e.preventDefault();
            var $clicked = $(e.currentTarget),
            	metric = this.collection.get($clicked.attr('metric-id'));

            dashboard.trigger('open open:list', metric, this.search);
        }
    });

    dashboard.views('WidgetStatus', WidgetStatus);

});