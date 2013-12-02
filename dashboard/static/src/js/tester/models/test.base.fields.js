openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
    
    var TestBase = dashboard.models('TestBase'),
        _super = TestBase.prototype;
    
    var CODES = _super.codes;
    
    var TestBaseFields = TestBase.extend({
         
        label: 'test fields execution (base)', 
        
        type: 'domain',
        
        execute: function(field){
            throw new Error('abstract object, please extend it...');
        },
        
        run: function(){
            var defs = [],
                fields = this.model.metrics.fields.types(this.type);
            
            fields.each(function(field){
                var def = $.Deferred();
                
                var promise = this.execute(field); 
                
                promise.done(function(a, b, c, d){
                    var args = _.toArray(arguments);
                    def.resolve.apply(def, ['success', field].concat(args));
                });
                
                promise.fail(function(){
                    var args = _.toArray(arguments);
                    def.reject.apply(def, ['error', field].concat(args));
                });
                
                
                defs.push(def);
            }, this);
            
            return $.whenAll.apply($, defs).then(
                $.proxy(this.success, this),
                $.proxy(this.error, this)
            );
        },
        
        success: function(){
            console.log('success', arguments);
            _super.success.apply(this, ['all fields are supported']);
            var results = _(arguments),
                info = [];
            results.each(function(result){
                if(result.length >= 2 && result[0] == 'success'){
                    info.push({
                        message: 'field "' + result[1].get('name') + '" is supported',
                    })
                }    
                else {
                    info = '';
                }
            });
            _super.success.apply(this, [info]);
        },
        
        error: function(){
            var results = _(arguments),
                info = [];
            results.each(function(result){
                if(result[0] == 'error'){
                    if(result.length >= 3){
                        console.log('error', result);
                        info.push({
                            message: 'field "' + result[1].get('name') + '" is not supported',
                            code: result.length >= 3 && 'data' in result[2] && 'fault_code' in result[2].data  ? result[2].data.fault_code : null,
                            trace: result.length >= 3 && 'data' in result[2] && 'debug' in result[2].data  ? result[2].data.debug : null
                        })
                    }    
                    else {
                        info = 'some unknown errors happen during widget executing...';
                    }
                }
            });
            _super.error.apply(this, [info]);
        },
    });      

    dashboard.models('TestBaseFields', TestBaseFields);

});