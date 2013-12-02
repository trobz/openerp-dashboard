openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone, base){
    
    var Fields = dashboard.collections('Fields'),
        Metric = dashboard.models('Metric');
        
    var BaseCollection = base.collections('BaseCollection'),
        _super = BaseCollection.prototype;
    
    
    var Metrics = BaseCollection.extend({
        model_name: 'dashboard.metric',
        
        model: Metric,

        comparator: 'position',

        initialize: function(data, options){

            this.on('reset', this.setup);
            this.fields = new Fields();
        },
        
        setup: function(){
            var fields = this.fields;
            this.each(function(metric){
                fields.add(metric.fields.models);
            });
        }
    });

    dashboard.collections('Metrics', Metrics);
});