openerp.unleashed.module('dashboard').ready(function(instance, dashboard, _, Backbone, base){

    var dateWidgets = {
         on_picker_select: function(text, instance_) {
            var date = this.picker('getDate');
            this.$input
                .val(date ? moment(date).format('YYYY-MM-DD') : '')
                .change()
                .focus();
        },
        render: function($target){
            this.renderElement();
            this.start();
            return this.$el;
        }
    };
    
    var _superView = Backbone.Marionette.ItemView.prototype;
    var Widget = Backbone.Marionette.ItemView.extend({
        tagName: 'span', 
        template: 'Dashboard.search.domain.widget',
        render: function(){
            _superView.render.apply(this, arguments);
            return this.$el;
        },
        serializeData: function(){ 
            return { 'data': this.data() } 
        }
    });


    var DomainWidgets = {
        
        // based on OpenERP widgets
        DateWidget: instance.web.DateWidget.extend(dateWidgets),
        DateTimeWidget: instance.web.DateTimeWidget.extend(dateWidgets),
        
        // custom widgets
        YearWidget: Widget.extend({ 
            data: function(){
                var years = {};
                for(var i=1950 ; i<=2020 ; i++){
                    years[i] = i;
                }
                return years;
            }
        }),
        
        QuarterWidget: Widget.extend({ 
            data: function(){ 
                return { 1: numeral(1).format('0o'), 2: numeral(2).format('0o'), 3: numeral(3).format('0o'), 4: numeral(4).format('0o')};
            }
        }),
        
        WeekWidget: Widget.extend({ 
            data: function(){
                var weeks = {};
                for(var i=1 ; i<=52 ; i++){
                    weeks[i] = numeral(i).format('0o');
                }
                return weeks;
            }
        }),
        
        MonthWidget: Widget.extend({ 
            data: function(){
                var months = {}, names = moment().lang()._months;
                for(var i=1 ; i<=12 ; i++){
                    months[i] = names[i - 1];
                }
                return months;
            }
        }),
        
        DayWidget: Widget.extend({ 
            data: function(){
                var days = {}, names = moment().lang()._weekdays;
                for(var i=0 ; i<=6 ; i++){
                    days[i] = names[i];
                }
                return days;
            }
        })
    };

   dashboard.utils('DomainWidgets', DomainWidgets); 
});    