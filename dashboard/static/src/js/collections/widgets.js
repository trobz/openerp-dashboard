openerp.unleashed.module('dashboard', function(dashboard, _, Backbone, base){
    
    
    var Widget = dashboard.models('Widget'),
        BaseCollection = base.collections('BaseCollection'),
        _super = BaseCollection.prototype;
    
    
    var Widgets = BaseCollection.extend({
        
        model_name: 'dashboard.widget',
        model: Widget,
        
        comparator: 'sequence'
    });

    dashboard.collections('Widgets', Widgets);
});