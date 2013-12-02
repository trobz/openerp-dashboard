openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
 
    var Layout = Marionette.Layout,
        _super = Layout.prototype;

    var PanelLayout = Layout.extend({
        template: 'Dashboard.panel',
        
        regions: {
            toolbar: '#toolbar',
            widgets: '#widgets'
        }
    });

    dashboard.views('PanelLayout', PanelLayout);

});