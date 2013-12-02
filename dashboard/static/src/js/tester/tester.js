var debug;

openerp.unleashed.module('dashboard').ready(function(instance, dashboard, _, Backbone, base){
    
    var _t = instance.web._t,
        _lt = instance.web._lt;
    
    var Widgets = dashboard.collections('Widgets'),
        TestWidgets = dashboard.views('TestWidgets'),
        TestResults = dashboard.views('TestResults'),
        TestCollection = dashboard.collections('TestCollection');
   
   
    instance.web.views.add('dashboard_tester', 'instance.dashboard.DashboardTester');
    instance.dashboard.DashboardTester = instance.web.View.extend({
        
        display_name: _lt('Dashboard Tester'),
        template: "Dashboard.tester",
        view_type: 'form',
   
        start: function(){
            this.widgets = new Widgets();
            
            this.tester = new TestWidgets({
                collection: this.widgets,
                resultView: TestResults,
                testCollection: TestCollection,
            });
            
            this.region = new Marionette.Region({
                el: '#dashboard_tester'
            });
            
            //stay on the same action by pushing it to url hashes parameters
            this.do_push_state($.bbq.getState());
    
            //disable the crashmanager
            instance.client.crashmanager.active = false;
            
            return this._super();
        },
                   
        view_loading: function(data){
            this.region.show(this.tester);
            this.widgets.fetch();
        }
    });  
  
       
});