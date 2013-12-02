openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
 
    var Layout = Marionette.Layout,
        _super = Layout.prototype;

    var Toolbar = Layout.extend({
        
        template: 'Dashboard.toolbar.print',
        
        events: {
            'click .board_action .print_action': 'print',
            'click .board_action .back_action': 'back',
            
        },
        
        print: function(e){
            e.preventDefault();
            window.print();        
        },
        
        back: function(e){
            e.preventDefault();
            dashboard.trigger('print:close');    
        }
    });

    dashboard.views('PrintToolbar', Toolbar);

});