openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){

    var Renderer = Marionette.Renderer,
        View = Marionette.ItemView,
        _super = View.prototype;

    var SearchOrder = View.extend({
        className: 'metric_info',
        
        template: 'TrobzDashboard.widget.search.order',
        
        
        templates: {
            'form': 'TrobzDashboard.search.order.form',
        },
        
          events: {
            'click .search_action': 'renderForm',
            'click .add': 'addOrder',
            'click .remove': 'removeOrder',
            'click .cancel': 'render',
        },
        
        initialize: function(options){
            this.search = options.search;
            this.listenTo(this.search, 'change:order', this.render);
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
                    this.$el.addClass('edition');
                }
            }
        },
        
        render: function(){
            _super.render.apply(this, arguments);
            this.$el.removeClass('edition');
        },
        
        addOrder: function(e){
            e.preventDefault();
            
            var field = this.collection.get(this.$el.find('.field').val()),
                type = this.$el.find('.type').val();
                    
            this.trigger('search:add', field, type);
        },
        
        removeOrder: function(e){
            e.preventDefault();
            var $remove = $(e.currentTarget),
                $criterion = $remove.parent(),
                field = $criterion.find('span.search_field').attr('field-id'),
                type = $criterion.find('span.search_value').attr('value');
            
            field = this.collection.get(field);
            
            this.trigger('search:remove', field, type);
        },
        
        serializeData: function(){
            var orders = this.search.get('order');
            
            return {
              "is_default": this.search.isDefault('order'),
              "orders": orders,
              "has_order": orders.length > 0
            }
        }
    });

    dashboard.views('SearchOrder', SearchOrder);

});