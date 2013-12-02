openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){


    var RowView = Backbone.Marionette.ItemView.extend({
        tagName : "tr",
        template : "Dashboard.widget.display.list.body",
        initialize: function(options){
            this.options = $.extend({
                format: '0,0',
                thresholders: {}
            }, options);
        },

        serializeData : function() {
            var row_data = this.model.toJSON(),
                data = [],
                process_value = function (value, options) {
                    return numeral(parseFloat(value)).format(options.format);
                }

            for (var key in row_data) {
                var className = 'oe_list_field_cell oe_list_field_char oe_readonly'
                if (typeof row_data[key] == 'number') {
                    row_data[key] = process_value(row_data[key], this.options)
                    className = 'oe_list_field_cell oe_list_field_float oe_number oe_readonly'
                }
                data.push({
                    'name': key,
                    'value': row_data[key],
                    'className': className
                })
            }
            return { 'data': data}
        }
    });


    var default_limit = null;

    var Pager = base.views('Pager'),
        Composite = Backbone.Marionette.CompositeView,
        _super = Composite.prototype; 

    var DisplayList = Composite.extend({
        itemView : RowView,

        // specify a jQuery selector to put the itemView instances in to
        itemViewContainer : 'tbody',

        events: {
            'click .sortable': 'orderBy',
            'click .oe_group_header': 'toggleGroup'
        },

        template : "Dashboard.widget.display.list",

        initialize: function(options){
            this.search = options.search;
            this.collection = this.model.results;
            
            var group = this.search.get('group');
            this.group_by = group.length > 0 ? {field: group[0]} : {};
        
            default_limit = !default_limit ? options.limit || 100 : default_limit;
                
            this.listenTo(this.search, 'change:group', this.groupChanged, this);
        },
        
        groupChanged: function(search, group){
            if(group.length > 0){
                var field = group[0]; 
                this.group_by = {
                    field: field 
                };
            }    
        },
        
        renderModel: function(){
            if('field' in this.group_by){
                this.group_by.groups = _.uniq(this.collection.pluck(this.group_by.field.get('reference')));
                if(_(this.group_by.groups).contains(null)){
                    this.group_by.groups = _(this.group_by.groups).without(null);
                    this.group_by.groups.push('undefined');    
                }
            }
        
            return _super.renderModel.apply(this, arguments);
        },

        render: function(){
            _super.render.apply(this, arguments);
            
            if('field' in this.group_by){
                this.$('tbody.group').each(function(index, group){
                    var $group = $(group),
                        $label = $group.prev().find('.group_label'),
                        $items = $group.find('tr');
                        
                   $label.text($label.text() + ' (' + $items.length + ')');     
                });
            }
        },
        
        appendHtml: function(collectionView, itemView, index){
            var $el = this.$('tbody'), item = itemView.model;
            if('field' in this.group_by){
                var reference = this.group_by.field.get('reference');
                $el = this.$('tbody.group[group-name="' + (item.get(reference) || 'undefined') + '"]');
            }
            $el.append(itemView.el);
        },

        toggleGroup: function(e){
            e.preventDefault();
            
            var $group = $(e.currentTarget),
                $data = $group.parent().next(),
                $icon = $group.find('.ui-icon');
            
            if($data.hasClass('hidden')){
                $data.removeClass('hidden');
                $icon.attr('class', 'ui-icon ui-icon-triangle-1-s');
            }
            else {
                $data.addClass('hidden');
                $icon.attr('class', 'ui-icon ui-icon-triangle-1-e');
            }
        },
        
        orderBy: function(e){
            e.preventDefault();
            
            var $column = $(e.currentTarget),
                field = this.model.fields.oneByRef($column.attr('data-id')),
                type = $column.is('.asc') ? 'ASC' : 'DESC';
            
            if(field){
                this.search.addOrder(field, type);
            }
        },

        serializeData : function() {
            var orders = this.search.get('order'),
                reorder = {};
            _(orders).each(function(order){
                var type = order.type == 'ASC' ? 'DESC' : (order.type == 'DESC' ? 'ASC' : '');
                reorder[order.field.get('reference')] = (type).toLowerCase();
            });

            return {
                'groups': 'groups' in this.group_by ? this.group_by.groups : [],
                'columns': this.model.fields.types('output').toArray(),
                'reorder': reorder
            };
        },
        
        remove: function(){
            return _super.remove.apply(this, arguments);
        }
    }); 

    dashboard.views('DisplayList', DisplayList);
});