openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
 
    var ItemView = Marionette.ItemView,
        _super = ItemView.prototype;

    var TimeBar = ItemView.extend({
        
        template: 'Dashboard.timebar',
        
        ui: { 
            type: '.period_type span',
            name: '.period_name select',
            daterange: '.daterange',
        }, 
        
        events: {
            'click .period_type span': 'changeType',
            'change .period_name select': 'changeName',
            'shown .daterange': 'openRangePicker',
        },
        
        modelEvents: {
            'change': 'refresh'
        },
        
        initialize: function(options){
            this.options = _.defaults(options, {
                dateformat: 'dddd, Do MMMM, YYYY' 
            });
            
            this.fullscreen = false;
        },
        
        changeType: function(e){
            e.preventDefault();
            var $type = $(e.currentTarget);
            this.model.set('type', $type.attr('data-type'));
        },
        
        changeName: function(e){
            e.preventDefault();
            var name = $(e.currentTarget).find('option:selected').val();
            this.model.set('name', name);
            if(name == 'custom' || name == 'year_to_date' ){
                this.$el.find('.section.period_type').hide()
                this.model.set('type', 'calendar');
            }
            else{
                this.$el.find('.section.period_type').show()
            }
        },
        
        openRangePicker: function(e){
            this.ui.daterangepicker.updateView();
            this.ui.daterangepicker.updateCalendars();
        },
        
        
        render: function(){
            _super.render.apply(this, arguments);
            
            var period = this.model;
            
            this.ui.daterange.daterangepicker(
                {
                    //FIXME: made to have the datepicker inside the element in fullscreen mode...
                    //       the lib has been customized to support it...
                    appendToElement: '#board',
                    startDate: this.model.start(),
                    endDate: this.model.end()
                },
                function(start, end){
                    if(start && end){
                        period.set({
                            start: start,
                            end: end
                        });
                    }
                }
            );
            this.ui.daterangepicker = this.ui.daterange.data('daterangepicker');
                
            this.refresh();
        },
        
        refresh: function(){
            this.ui.type.removeClass('selected');
            this.ui.type.filter('.' + this.model.get('type')).addClass('selected');
            
            this.ui.name.find('option:selected').attr('selected', false);
            this.ui.name.find('option[value="' + this.model.get('name') + '"]').attr('selected', true);
            
            this.ui.daterange.text(
                this.model.start().format(this.options.dateformat) + ' - ' +
                this.model.end().format(this.options.dateformat)
            );
            this.ui.daterangepicker.startDate = this.model.start();
            this.ui.daterangepicker.endDate = this.model.end();
        },
        
        serializeData: function(){
            return {
              "name": this.model.get('name'),
              "type": this.model.get('type'),
              "start": this.model.start().format('LL'),
              "end": this.model.end().format('LL'),
            }
        }
    });

    dashboard.views('TimeBar', TimeBar);

});