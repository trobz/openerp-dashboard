openerp.unleashed.module('dashboard', function(dashboard, _, Backbone, base){
    
    var BaseCollection = base.collections('BaseCollection'),
        _super = BaseCollection.prototype;
    
    var Results = BaseCollection.extend({
        
        initialize: function(data, options){
            this.columns = [];
            this.fields = options.fields;
        },
        
        parse: function(response){

            var results = response.results, columns = response.columns;
            
            // get column info
            var output_fields = this.fields.types('output'),
                output_columns = [], field;

            _(columns).each(function(column){
                field = output_fields.find(function(field){
                    var ref_name = field.get('reference'),
                        pattern = new RegExp(ref_name + '(?:_[0-9]+)?');

                    return pattern.test(column.name);
                });

                if(!field){
                    throw new Error('output field "' + column.name + '" can not be found in metric.fields, ' +
                                    'please define a field with the correct reference name and "output" type');
                }

                output_columns.push(field);
            });

            this.columns = output_columns;
            return results;
        }
    });

    dashboard.collections('Results', Results);
});