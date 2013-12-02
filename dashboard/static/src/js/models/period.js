openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone, base){
      
    //number of days used for the rolling period  
    var rolling = {
        day: 1,
        week: 7,
        month: 30,
        quarter: 30 * 3,
        semester: 30 * 4,
        year: 365,
    };
          
      
    //return the start and end date for each types 
    var calendar = {
        day: function(current){
            return { start: current, end: current };
        },
        
        week: function(current){
            var start = moment(current).subtract(((current.day() == 0 ? 6 : current.day() -1 )),'days');
            var end = moment(start).add(1, 'week');
            return { start: start, end: end };
        },
        
        month: function(current){
            var start = moment(current.format('YYYY-MM'));
            var end = moment(start).add(1, 'months');
            return { start: start, end: end };
        },
        
        quarter: function(current){
            var quarter = Math.floor(current.month() / 3);
            var start = moment(current.format('YYYY') + '-' + ((quarter * 3) + 1));
            var end = moment(start).add(3, 'months');
            return { start: start, end: end };
        },
        
        semester: function(current){
            var semester = Math.floor(current.month() / 4);
            var start = moment(current.format('YYYY') + '-' + ((semester * 4) + 1));
            var end = moment(start).add(4, 'months');
            return { start: start, end: end };
        },
        
        year: function(current){
            var start = moment(current.format('YYYY'));
            var end = moment(start).add(1, 'year');
            return { start: start, end: end };
        },

        year_to_date: function(current){
            var start = moment(current).month(0).date(1)
            var end = current
            return { start: start, end: end };
        }
    };   
    var last_period = {
        day: function(current){
            return { start: moment(current).subtract('days',1), end: moment(current).subtract('days',1) };
        },

        week: function(current){
            var end = moment(current).subtract(((current.day() == 0 ? 6 : current.day() -1 )),'days');
            var start = moment(end).subtract('weeks', 1);
            return { start: start, end: end };
        },

        month: function(current){
            var end = moment(current.format('YYYY-MM'));
            var start = moment(end).subtract(1, 'months');
            return { start: start, end: end };
        },

        quarter: function(current){
            var quarter = Math.floor(current.month() / 3);
            var end = moment(current.format('YYYY') + '-' + ((quarter * 3) + 1));
            var start = moment(end).subtract(3, 'months');
            return { start: start, end: end };
        },

        semester: function(current){
            var semester = Math.floor(current.month() / 4);
            var end = moment(current.format('YYYY') + '-' + ((semester * 4) + 1));
            var start = moment(end).subtract(4, 'months');
            return { start: start, end: end };
        },

        year: function(current){
            var end = moment(current.format('YYYY'));
            var start = moment(end).subtract(1, 'year');
            return { start: start, end: end };
        }
    };

    var current = moment(),
        Period = base.models('Period'),
        _super = Period.prototype;
    
    var BoardPeriod = Period.extend({
        
        defaults: {
            start: moment().subtract(30, 'days'),
            end: moment().subtract(1, 'days'),
            name: 'month',
            type: 'rolling',
        },
        
        calculated: function(){
            return this.get('name') != 'custom' && this.get('type') != 'none';  
        },
        
        set: function(key, val, options){
            var attrs, attr;
            if ( typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }
            
            var type = attrs.type || this.get('type'),
                name = attrs.name || this.get('name');
            
            if(name == 'custom'){
                attrs.type = 'none';    
            }
            else if(attrs.start && attrs.end && !attrs.type){
                attrs.name = 'custom';
                attrs.type = 'none';    
            }
            else if(((attrs.name && type) || (attrs.type && name))){
                type = attrs.type = type == 'none' ? 'calendar' : type;
                var period = this.getRelativePeriod(type, name);
                attrs.start = period.start;
                attrs.end = period.end;   
            }
        
            return _super.set.apply(this, [attrs, options]);
        },
        
        getRelativePeriod: function(type, name){
            var period = {
                start: null,
                end: null
            };
            if(type == 'calendar'){
                 period = calendar[name].apply(this, [current]);
            }
            else if(type == 'last_period' && name != 'year_to_date'){
                 period = last_period[name].apply(this, [current]);
            }
            else if (type == 'rolling' && name != 'year_to_date'){
                period.start = moment(current).subtract(rolling[name], 'days');                
                period.end = moment(current);                
            }
            else{
                period = calendar[name].apply(this, [current]);
            }
        
            return period;
        },
        
        values: function(format){
            format = format || 's';
            return {
                start: this.start(format),
                end: this.end(format)
            };
        },
        
    });

    dashboard.models('BoardPeriod', BoardPeriod);

});