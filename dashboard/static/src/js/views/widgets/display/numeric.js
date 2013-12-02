openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){

    var Renderer = Marionette.Renderer;
    
    var ItemView = Marionette.ItemView,
        _superItem = ItemView.prototype;

    var Numeric = ItemView.extend({
    
        className: 'numeric', 
        template: 'TrobzDashboard.widget.display.numeric.item',

        initialize: function(options){
            this.options = $.extend({
                format: '0',
                thresholders: {}
            }, options);
            
            this.fields = options.fields;
        },
        
        serializeData: function(){
            
            var process_value = function(value, options){
                return numeral(parseFloat(value)).format(options.format);
            };
            
            var process_thresholders = function(value, options){
                value = parseInt(value);
                var classname = null, condition;
                for(condition in options.thresholders){
                    if(eval(value + condition)){
                        classname = options.thresholders[condition];
                    }
                }
                return classname;
            };
                
            //only one result for number type
            var name, field, data = []; 
        
            for(name in this.model.attributes){
                field = this.fields.types('output').oneBySQLName(name);
                value = this.model.get(name);
                data = {
                    label: field.get('name'),
                    value: process_value(value, this.options),
                    className: process_thresholders(value, this.options)
                };    
            }
            
            return  data;
        }
    });
    
    
    var DisplayNumeric = Backbone.Marionette.CompositeView.extend({

        itemView : Numeric,
        itemViewContainer : "dl",
        template : "TrobzDashboard.widget.display.numeric",

        initialize: function(options){
            this.collection = this.model.results;
        },

        itemViewOptions: function(result){
            return _.extend({
                fields: this.model.fields
            }, this.model.get('options'));
        }
    });

    dashboard.views('DisplayNumeric', DisplayNumeric);
});