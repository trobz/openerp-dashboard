openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){
    
    var TestBaseFields = dashboard.models('TestBaseFields'),
        _super = TestBaseFields.prototype;
    
    var CODES = _super.codes;
    
    var TestGroups = TestBaseFields.extend({
         
        label: 'test metric fields: group', 
        
        type: 'group_by',
        
        execute: function(field){
            return this.model.execute({
                group: [ field.get('reference') ],
                period: {
                    start: '2010-01-01 00:00:00',
                    end: '2010-01-02 00:00:00',
                },
                debug: true
            });
        }
    });      

    dashboard.models('TestGroups', TestGroups);

});