openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone, base){
    
    var Operator = dashboard.models('Operator'),
        _super = Backbone.Collection.prototype;
    
    var Operators = Backbone.Collection.extend({
        
        model: Operator,
        
        byName: function(name){
            return _(this.models).findWhere({ name: name });
        },
    
        initialize: function(){
            var _t = base._t;
    
            this.add([
                 // general
                new Operator('not', _t('not'), '!'),
                new Operator('|', _t('or'), '|'),
                new Operator('&', _t('and'), '&'),
                new Operator('(', '('),
                new Operator(')', ')'),
        
                // boolean
                new Operator('true', _t('is true'), '=', {
                    value: function(){ return true; }
                }),
                new Operator('false', _t('is false'), '=', {
                    value: function(){ return false; }
                }),
               
                // numeric
                new Operator('e', _t('is equal to'), '=' ),
                new Operator('ne', _t('is not equal to'), '!=' ),
                new Operator('gt', _t('is higher than'), '>' ),
                new Operator('gte', _t('is higher or equal to'), '>=' ),
                new Operator('lt', _t('is lower than'), '<' ),
                new Operator('lte', _t('is lower or equal to'), '<=' ),

                // string
                new Operator('contains', _t('contains'), 'ilike', {
                }),
                new Operator('n_contains', _t('doesn\'t contains'), 'ilike', {
                    not: true
                }),

                // set operator
                new Operator('is', _t('is set'), 'is'),
                new Operator('ins', _t('is not set'), 'ins'),

                // date
                new Operator('day', _t('of day'), '=', {
                    string: function(val){ return moment().lang()._weekdays[val] },
                    field: function(field){ return 'extract("dow" from ' + field + ')'; },
                    widget: 'day' 
                }),
                new Operator('month', _t('of month'), '=', {
                    string: function(val){ return moment().lang()._months[val - 1] },
                    field: function(field){ return 'extract("month" from ' + field + ')'; },
                    widget: 'month' 
                }),
                new Operator('year', _t('of year'), '=', {
                    field: function(field){ return 'extract("year" from ' + field + ')'; },
                    widget: 'year' 
                }),
                new Operator('quarter', _t('of quarter'), '=', {
                    string: function(val){ return numeral(val).format('0o'); },
                    field: function(field){ return 'extract("quarter" from ' + field + ')'; },
                    widget: 'quarter'
                })
            ]);                 
            
        }
    });
    
    dashboard.collections('Operators', Operators);
});