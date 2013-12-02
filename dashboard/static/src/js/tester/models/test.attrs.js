openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
    
    var TestBase = dashboard.models('TestBase'),
        _super = TestBase.prototype;
    
    var CODES = _super.codes;
    
    var TestAttributes = TestBase.extend({
        
        label: 'test metrics attributes', 
        
        run: function(){
            var compatibilities = {
                numeric: ['numeric'],
                list:    ['list'],
                graph:   ['graph']  
            };               
            
            try {
                var metrics = this.model.metrics,
                    compat = _(compatibilities[this.model.get('type')]),
                    graph_compat = null;
                    
                    
                metrics.each(function(metric){
                    var type = metric.get('type');
                    if(type == 'graph'){
                        var graph_type = metric.get('options').type;
                        
                        graph_compat = !graph_compat ? ( _(['bar', 'line']).contains(graph_type) ? _(['bar', 'line']) : _(['pie']) ) : graph_compat;
                        
                        if(!graph_compat.contains(graph_type)) {
                           throw new Error('graph metric "' + metric.get('name') + '" with type "' + graph_type + '" is not compatible with types "' + graph_compat.join(', ') + '"'); 
                        } 
                    }
                    else if(!compat.contains(type)){
                       throw new Error('metric "' + metric.get('name') + '" with type "' + type + '" is not compatible with types "' + compat.join(', ') + '"'); 
                    }        
                    
                });
                   
                this.success('');    
            }
            catch(e){
                this.error(e.message);
            }
            // run has to return a deferrer
            return $.when();
        }
        
        
    });      

    dashboard.models('TestAttributes', TestAttributes);

});