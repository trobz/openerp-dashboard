openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone, base){
    
    var Model = Backbone.Model,
        _super = Model.prototype;
        
    var Operator = Model.extend({
        
        constructor: function(name, text, domain, options){
            Model.apply(this);
            
            this.name = name;
            this.text = text;
            this.domain = domain || null;
            
            options = options || {}; 
            
            this.not = options.not || false;
            this.field = options.field || function(field){ return field; };
            this.string = options.string || function(val){ return val; };
            this.value = options.value || function(val){ return val; };
            this.widget = options.widget || null;
        },
        
    });
    
    dashboard.models('Operator', Operator);
});