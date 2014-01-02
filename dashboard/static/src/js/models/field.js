openerp.unleashed.module('dashboard', function(dashboard, _, Backbone, base){
    
    var BaseModel = base.models('BaseModel'),
        _super = BaseModel.prototype;
    
    var Field = BaseModel.extend({
        
        compatible: function(field){
            return this.has('reference') && this.get('reference') == field.get('reference');
        },
        
        has_type: function(type){
            return _(this.get('type_names')).contains(type);
        },
        
        format: function(name){
            var _t = base._t;
            var formatted = name, date = moment(name);
            if(date.isValid()){
                switch(this.get('period')){
                    case 'year':
                        formatted = date.format('YYYY');
                    break;
                    case 'quarter':
                        var quarter = Math.floor(date.month() / 3) + 1;
                        formatted = 'Q' + numeral(quarter).format('0') + ' ' + date.format('YYYY');
                    break;
                    case 'month':
                        formatted = date.format('MMM YYYY');
                    break;
                    case 'week':
                        formatted = _t('w') + '/' + date.format('w') + ' ' + moment(date).endOf('week').format('YYYY');
                    break;
                    case 'day':
                        formatted = date.format('D MMM YYYY');
                    break;
                }
            }
            return formatted;
        }
    });

    dashboard.models('Field', Field);
});