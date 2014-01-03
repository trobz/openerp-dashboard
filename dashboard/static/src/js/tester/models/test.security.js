openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
    
    var TestBase = dashboard.models('TestBase'),
        _super = TestBase.prototype;
    
    var CODES = _super.codes;
    
    var TestSecurity = TestBase.extend({
         
        label: 'test metric security rules', 
        
        execute: function(domain){
            return this.model.execute({
                domain: domain,
                period: {
                    start: '2010-01-01 00:00:00',
                    end: '2010-01-02 00:00:00',
                },
                debug: true,
                security_test: true
            });
        },
        
        run: function(){
            var domain = [],
                fields = this.model.metrics.fields.types('domain');
            
            fields.each(function(field){
                domain.push([field.get('reference'), '=', this.fieldValue(field)])
            }, this);
            
            return this.execute(domain).then(
                $.proxy(this.success, this),
                $.proxy(this.error, this)
            );
        },
        
        fieldValue: function(field){
            var type = field.get('field_description').type;
            var val = '';

            val = type == 'many2one' ? 1 : val;
            val = type == 'char' ? 'a' : val;
            val = type == 'int' ? '1' : val;
            val = type == 'date' ? '2010-01-01' : val;
            val = type == 'datetime' ? '2010-01-01 00:00:00' : val;
            val = type == 'boolean' ? true : val;
            return val; 
        },
        
        success: function(result, debug){
            var info = [], warn = [], widget_id = this.model.get('id');
            
            if(widget_id in debug){
                _(debug[widget_id]['queries']).each(function(metric){
                    if('warning' in metric && metric.warning.length > 0){
                        _(metric.warning).each(function(msg){
                            warn.push({
                                message: msg,
                            })    
                        });
                    }
                    if('security_info' in metric && metric.security_info.length > 0){
                        _(metric.security_info).each(function(msg){
                            info.push({
                                message: msg,
                            })    
                        });
                    }
                    
                });
            }
            
            if(warn.length <= 0){
                _super.success.apply(this, [info]);    
            }
            else {
                _super.warning.apply(this, [warn]);    
            }
        },
        
        error: function(error){
            var info = [];
            
            info.push({
                message: 'server error',
                code: 'data' in error && 'fault_code' in error.data  ? error.data.fault_code : null,
                trace: 'data' in error && 'debug' in error.data  ? error.data.debug : null
            })
            
            _super.error.apply(this, [info]);
        }
    });      

    dashboard.models('TestSecurity', TestSecurity);

});