openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){

    var Panel = base.views('Panel'),
        _super = Panel.prototype;

    var DashboardPanel = Panel.extend({
        regions: {
            dashboard: '#board'
        }
    });

    dashboard.views('Panel', DashboardPanel);
});