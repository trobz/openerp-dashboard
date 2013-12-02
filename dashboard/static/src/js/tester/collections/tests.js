openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){

    /*
     * Tests
     */

    var TestAttributes = dashboard.models('TestAttributes'),
        TestOrders = dashboard.models('TestOrders'),
        TestGroups = dashboard.models('TestGroups'),
        TestDomains = dashboard.models('TestDomains'),
        TestSecurity = dashboard.models('TestSecurity');

    var Collection = Backbone.Collection,
        _superCollection = Collection.prototype;


    var TestCollection = Collection.extend({
        
        constructor: function(data, options){
            options = options || {};
            
            var data = [
                new TestAttributes({}, options),
                new TestDomains({}, options),
                new TestSecurity({}, options)
            ];
            
            if(options.model.get('type') == 'graph'){
                data.push(new TestGroups({}, options));
            }
            
            if(_(['graph', 'list']).contains(options.model.get('type'))){
                data.push(new TestOrders({}, options));
            }
            
            Collection.apply(this, [data, options]);
        },
        
        run: function(){
            var defs = [];
            
            this.refresh();
            
            this.each(function(test){
                defs.push(test.run());
            });    
            return $.when.apply($, defs).then(
                $.proxy(this.success, this),
                $.proxy(this.error, this)
            );
        },
        
        refresh: function(){
            this.each(function(test){
                test.start();
            });    
            this.trigger('refresh', this, _.toArray(arguments));
        },
        
        success: function(){
            this.trigger('run run:success', this, _.toArray(arguments));
        },
        
        error: function(){
            this.trigger('run run:error', this, _.toArray(arguments));
        }
    });      

    dashboard.collections('TestCollection', TestCollection);
});