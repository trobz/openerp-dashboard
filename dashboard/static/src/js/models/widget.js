openerp.unleashed.module('dashboard', function(dashboard, _, Backbone, base){
    
    var SearchModel = dashboard.models('Search');

    var Metrics = dashboard.collections('Metrics');
            
    var BaseModel = base.models('BaseModel'),
        _super = BaseModel.prototype;
    
    var PagerController = base.collections('Pager'),
        _superPager = PagerController.prototype;
    
    var PagerModel = PagerController.extend(_super);
    
    var Widget = PagerModel.extend({
        
        model_name: 'dashboard.widget',
        
        initialize: function(data, options){
            options = options || {};
        
            this.metrics = new Metrics();
            this.previousOptions = {};
            
            var metrics = [];
            if('metrics' in data){
                metrics = data.metrics;
                delete data.metrics;
            }
         
            this.metrics.reset(metrics);
        
            
            this.searchModel = new SearchModel({}, {
                fields: this.metrics.fields
            });
            
            _superPager.initialize.apply(this, [options]);
            
            this.pager.limit = data.limit ? parseInt(data.limit) : 'all';
        
            _super.initialize.apply(this, [data, options]);
        },
        
    
        count: function(options){
            var def = $.Deferred();
            var params = _.extend(options, {
                method: 'count'
            });
            
            this._execute(params).done(function(result){
                def.resolve(result.count);
            });
            
            return def.promise();
        },
    
        update: function(){
            return this._execute(this.previousOptions);
        },
        
        execute: function(options){
            var self = this, def = $.Deferred();
            if(this.hasPager()){
                this.load(options).done(function(){
                    self._execute(options).then(
                        function(){
                            def.resolve.apply(def, arguments);
                        },
                        function(){
                            def.reject.apply(def, arguments);
                        });
                });
            }
            else {
                def = this._execute(options);
            }
            
            return def.promise();
        },
        
        _execute: function(options){
            var def = $.Deferred(), search = {};
            
            if(this.hasPager()){
                search = _superPager.search.apply(this, arguments);
            }
            
            options = _.defaults(search, options || {}, {
                period: {},
                domain: [], 
                group: [],
                order: [],
                limit: 'ALL',
                offset: 0,
                method: this.get('method'),
                //warning: only for testing propose, never use it for something else !
                security_test: false
            });
            
            // force security_test to false if not in debug mode !
            options.security_test = !options.debug ? false : options.security_test; 
            
            var metrics = this.metrics, self = this, count = null, method = this.get('method'), option_method = options.method;
            
            var promise = this.sync('call', { model_name: this.model_name }, {
                method: options.method,
                args: [[this.get('id')], options.period, options.domain, options.group, options.order, options.limit, options.offset, options.debug, options.security_test]
            });      
            
            promise.done(function(results){
                var debug = {};    
                if(option_method == method){
                    _(results).each(function(metric_data, widget_id){
                    
                        debug = self.resultDebug(options, widget_id, metric_data);
                        
                        _(metric_data).each(function(result, metric_id){
                            var results = metrics.get(metric_id).results;
                            results.reset(results.parse(result));
                            count = result['results'].length;
                        });
                    });
                    
                    metrics.trigger('results:updated', this);
                }
                self.set('updated_at', moment());
                def.resolve(results, debug);
            });
            
            promise.fail(function(){
                def.reject.apply(def, _.toArray(arguments));
            });
            
            this.previousOptions = options;
            delete this.previousOptions.limit;
            delete this.previousOptions.offset;
            delete this.previousOptions.method;
            
            return def.promise();
        },
        
        resultDebug: function(options, widget_id, metric_data){
            var debug = {};
            if(options.debug && _.isObject(metric_data) && 'debug' in metric_data){
                if('queries' in metric_data.debug){
                    console.group(metric_data.debug.message);
                    _.each(metric_data.debug.queries, function(query_info){
                        console.groupCollapsed(query_info.message);
                        console.debug(query_info.query);
                        if(query_info.warning && query_info.warning.length > 0){
                            console.groupCollapsed('warnings');
                            _(query_info.warning).each(function(warning){console.warn(warning);});   
                            console.groupEnd();    
                        }
                        console.groupEnd();    
                    });
                    console.groupEnd();    
                }
                
                else {
                    console.group(metric_data.debug.message);
                    console.groupEnd();    
                }
                debug[widget_id] = metric_data.debug; 
                delete metric_data.debug;
            }
            return debug;
        },
        
        hasPager: function(){
            var limit = this.get('limit');
            return limit && $.isNumeric(limit)
                && _(['list', 'graph']).contains(this.get('type'))
                && this.get('method') == 'execute';
        }       
        
    });

    dashboard.models('Widget', Widget);
});