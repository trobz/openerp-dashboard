openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){

    var Renderer = Marionette.Renderer,
        View = Marionette.ItemView,
        _super = View.prototype;

    var SearchGroup = View.extend({
        
        className: 'metric_info',
    
        template: 'Dashboard.widget.search.group',
        
        templates: {
            'form': 'Dashboard.search.group.form',
        },
        
          events: {
            'click .search_action': 'renderForm',
            'click .add': 'addGroup',
            'click .remove': 'removeGroup',
            'click .cancel': 'render',
        },
        
        initialize: function(options){
            this.search = options.search;
            this.listenTo(this.search, 'change:group', this.render);
        },
        
        renderForm: function(e){
            if(this.$el.hasClass('edition')){
                this.render();
            }
            else {
                e.preventDefault();
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
        
        
        addGroup: function(e){
            e.preventDefault();
            
            var field = this.collection.get(this.$el.find('.field').val());
                  
            this.trigger('search:add', field);
              
            this.render();
        },
        
        removeGroup: function(e){
            e.preventDefault();
            var $remove = $(e.currentTarget),
                $criterion = $remove.parent(),
                field = $criterion.find('span.search_field').attr('field-id');
            
            field = this.collection.get(field);
            
            this.trigger('search:remove', field);
            
            this.render();
        },
        
        serializeData: function(){
            var groups = this.search.get('group');
            
            return {
              "is_default": this.search.isDefault('group'),
              "groups": groups,
              "has_group": groups.length > 0
            }
        }
        
    });

    dashboard.views('SearchGroup', SearchGroup);

});