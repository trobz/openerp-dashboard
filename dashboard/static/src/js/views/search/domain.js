openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){


    var Renderer = Marionette.Renderer,
        View = Marionette.ItemView,
        _super = View.prototype;

    var SearchDomain = View.extend({
    
        className: 'metric_info',
    
        template: 'Dashboard.search.domain.view',
    
        templates: {
            'form': 'Dashboard.search.domain.form',
            'char': 'Dashboard.search.domain.char',
            'selection': 'Dashboard.search.domain.selection',
            'number': 'Dashboard.search.domain.number',
            'date': 'Dashboard.search.domain.date',
            'datetime': 'Dashboard.search.domain.datetime',
            'boolean': 'Dashboard.search.domain.boolean',
            'not_supported': 'Dashboard.search.domain.not_supported'
        },
        
        ui: {
            modify: '.current'
        },
    
        events: {
            'click .search_action': 'renderForm',
            'click .add': 'addDomain',
            'click .remove': 'removeDomain',
            'click .cancel': 'render',
            'change .operator': 'changeOperator',
            'change .field': 'renderFieldForm',
            'keypress .condition': 'onKeyboard'
        },

        initialize: function(options){
            this.search = options.search;
            this.listenTo(this.search, 'change:domain', this.render);

            this.current_widget = null;

            var DomainWidgets = dashboard.utils('DomainWidgets');
            this.widgets = {
                'date': DomainWidgets.DateWidget,
                'datetime': DomainWidgets.DateTimeWidget,
                'quarter': DomainWidgets.QuarterWidget,
                'year': DomainWidgets.YearWidget,
                'month': DomainWidgets.MonthWidget,
                'week': DomainWidgets.WeekWidget,
                'day': DomainWidgets.DayWidget,
            };
        },

        renderForm: function(e){
            e.preventDefault();

            if(this.$el.hasClass('edition')){
                this.render();
            }
            else {
                if(this.collection.length > 0){
                    var fields = Renderer.render(this.templates.form, {
                        fields: this.collection.toArray()
                    });

                    this.$el.empty();
                    this.$el.html(fields);

                    this.renderCondition(this.collection.at(0));
                    this.$el.addClass('edition');
                }
            }
        },

        render: function(){
            _super.render.apply(this, arguments);
            this.$el.removeClass('edition');
        },

        renderFieldForm: function(e){
            e.preventDefault();

            var $select = $(e.currentTarget);
            this.renderCondition(this.collection.get($select.val()));
        },

        renderCondition: function(field){
            var $condition = this.$el.find('.condition'),
                description = field.get('field_description'),
                template = description.type in this.templates ? this.templates[description.type] : this.templates['not_supported'],
                condition = Renderer.render(template, {
                description: description,
                operators: this.search.operators
            });

            $condition.empty();
            $condition.html(condition);

            var $first_option = this.$el.find('select.operator option:first-child'),
                $target = this.$el.find('span.value');

            this.renderWidget(field, $target, $first_option.attr('widget'));
        },

        renderWidget: function(field, $target, widget_name){
            var Widget = widget_name in this.widgets ? this.widgets[widget_name] : null;
            if(this.current_widget != widget_name && Widget && $target.length > 0){
                var widget = new Widget({
                    name: field.get('reference')
                });
                $target.empty();
                $target.html(widget.render());
            }
            this.current_widget = widget_name in this.widgets ? widget_name : null;
        },

        changeOperator: function(e){
            var $select = $(e.currentTarget),
                widget_name = $select.find('option:selected').attr('widget'),
                field = this.collection.get(this.$el.find('select.field').val()),
                $target = $select.parent().find('span.value');
            var $value =  this.$el.find('.value')
            switch ($(e.target).val()) {
                case 'is':
                case 'ins':
                    $value.hide();
                    break;
                default:
                    $value.show();
            }
            this.renderWidget(field, $target, widget_name);
        },

        addDomain: function(e){
            e.preventDefault();
            var field = this.collection.get(this.$el.find('.field').val()),
                operator = this.$el.find('.operator').val() || 'e',
                value = this.$el.find('.value').val() || this.$el.find('select.value').val()
                    || this.$el.find('[name="' + field.get('reference') + '"]').val() || "";

            this.trigger('search:add', field, operator, value);
            
            this.render();
        },
        
        removeDomain: function(e){
            e.preventDefault();
            var $remove = $(e.currentTarget),
                $criterion = $remove.parent(),
                field = $criterion.find('span.search_field').attr('field-id'),
                operator = $criterion.find('span.search_operator').attr('operator'),
                value = $criterion.find('span.search_value').attr('value');
            
            field = this.collection.get(field);
            value = $.isNumeric(value) ? parseInt(value) : value;   
                
            this.trigger('search:remove', field, operator, value);
            
            this.render();
        },
        
        serializeData: function(){
            
            var domain = this.search.get('domain');
            
            var groups = _(domain).groupBy(function(criterion){ 
                return criterion.field.get('reference'); 
            });
            
            return {
              "operators": this.search.operators,
              "group_size": _(groups).size(),
              "groups": groups,
              "has_domain": domain.length > 0,
              "has_condition": this.collection.length > 0
            }
        },

        onKeyboard : function(e){
            if (e.keyCode == 13){
                this.addDomain(e)
            }
        }
    });

    dashboard.views('SearchDomain', SearchDomain);
});