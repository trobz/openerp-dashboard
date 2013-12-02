openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone, base){
    
    var Field = dashboard.models('Field'),
        BaseCollection = base.collections('BaseCollection'),
        _super = BaseCollection.prototype;
    
    var Fields = BaseCollection.extend({
        
        model_name: 'dashboard.field',
        model: Field,
        
        comparator: 'sequence',
        
        oneByRef: function(reference){
            return this.findWhere({'reference': reference});
        },
        
        oneBySQLName: function(sql_name){
            return this.findWhere({'sql_name': sql_name});
        },
        
        types: function(){
            var types = _.toArray(arguments), Constructor = this.constructor;
            var result = this.filter(function(field){
                return _.intersection(types, field.get('type_names')).length > 0;
            });
            return new Constructor(result);
        },
        
        notTypes: function(){
            var types = _.toArray(arguments), Constructor = this.constructor;
            var result = this.filter(function(field){
                return _.intersection(types, field.get('type_names')).length == 0;
            });
            return new Constructor(result);
        }
    });

    dashboard.collections('Fields', Fields);
});