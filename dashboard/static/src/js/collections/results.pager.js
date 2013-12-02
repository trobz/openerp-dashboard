openerp.unleashed.module('dashboard', function(dashboard, _, Backbone, base){
    
    var Pager = base.collections('Pager'),
        Results = dashboard.collections('Results'),
        _superPager = Pager.prototype,
        _superResults = Results.prototype;
    
    var PagerResults = Pager.extend({
        
    });
    
    
    _.extend(PagerResults.prototype, Results.prototype);

    _.extend(PagerResults.prototype, {
        initialize: function(data, options){
            _superPager.initialize.apply(this, arguments);
            _superResults.initialize.apply(this, arguments);
            
            this.previousOptions = {};
        },
        
        refresh: function(){
            _superPager.refresh.apply(this, arguments);
            if('limit' in this.previousOptions){
                delete this.previousOptions.limit;
            }
            if('offset' in this.previousOptions){
                delete this.previousOptions.offset;
            }
            return this;
        },
        

        update: function(options){
            var options = options || this.previousOptions,
                pager = this.pager; 
            
        
            options = _.extend(this.previousOptions, options, {
                limit: this.pager.limit,
                offset: this.pager.page * this.pager.limit,
                reset: true
            });
        
            this.previousOptions = _.clone(options);
        
            var def = this.fetch(options), self = this;
            
            def.done(function(){
                console.log('pager refresh', self);
            });
            
            return def.promise();
        },
        
        count: function(options){
            var def = $.Deferred(), self = this;
            
            //TODO: we should not execute the full queries with all columns returned just to know 
            //      the number of results of this query... 
            this.execute(options).done(function(data){
                var response = self.getResponse(data);
                def.resolve(response.results.length);
            });
            
            return def.promise();
        }
 
    });

    dashboard.collections('PagerResults', PagerResults);
});