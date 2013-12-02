openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
    
    var TestBaseFields = dashboard.models('TestBaseFields'),
        _super = TestBaseFields.prototype;
    
    var CODES = _super.codes;
    
    var TestDomains = TestBaseFields.extend({
         
        label: 'test metric fields: domain', 
        
        type: 'domain',
        
        execute: function(field){
            return this.model.execute({
                domain: [
                    [field.get('reference'), '=', this.fieldValue(field)]
                ],
                period: {
                    start: '2010-01-01 00:00:00',
                    end: '2010-01-02 00:00:00',
                },
                debug: true
            });
        },
        
        fieldValue: function(field){
            var type = field.get('field_description').type;
            var val = '';
            
            val = type == 'char' ? 'a' : val;
            val = type == 'int' ? '1' : val;
            val = type == 'date' ? '2010-01-01' : val;
            val = type == 'datetime' ? '2010-01-01 00:00:00' : val;
            val = type == 'boolean' ? true : val;
           
            return val; 
        }
    });      

    dashboard.models('TestDomains', TestDomains);

});