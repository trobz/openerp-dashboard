openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){

    var Domain = dashboard.views('SearchDomain'),
        Order = dashboard.views('SearchOrder'),
        Group = dashboard.views('SearchGroup');
    
    var Layout = Marionette.Layout,
        _super = Layout.prototype;

    var Search = Layout.extend({
    
        className: 'search', 
    
        template: 'TrobzDashboard.search',
    
        regions: {
            domain: '.domain',
            order: '.order',
            group: '.group'
        },
        
        initialize: function(options){
            this.type = options.type;
            this.search = options.search;
            
            this.fields = {
                domain: this.collection.types('domain'),
                group: this.collection.types('group_by'),
                order: this.collection.notTypes('group_by').types('order_by'),
            };
            
            this.enabled_views = options.enabled || ['domain', 'group', 'order'];
            
            this.views = {
                domain: new Domain({
                    collection: this.fields.domain,
                    search: this.search
                }),
                
                group: new Group({
                    collection: this.fields.group,
                    search: this.search
                }),
                
                order: new Order({
                    collection: this.fields.order,
                    search: this.search
                })
            };
        },
        
        show: function(){
            this.$el.show();
        },
        
        hide: function(){
            this.$el.hide();
        },
        
        toggle: function(){
            if(this.$el.is(':visible')){
                this.hide();
            }
            else {
                this.show();
            }
        },
        
        enabled: function(name){
            return _(this.enabled_views).contains(name);
        },
        
        onRender: function(){
            if(this.enabled('domain') && this.fields.domain.length > 0){
                this.domain.show(this.views.domain);
                
                this.listenTo(this.views.domain, 'search:add', this.addDomain, this);
                this.listenTo(this.views.domain, 'search:remove', this.removeDomain, this);
            }
            
            if(this.enabled('order') && this.type == 'graph' && this.fields.order.length > 0){
                this.group.show(this.views.group);
            
                this.listenTo(this.views.group, 'search:add', this.addGroup, this);
                this.listenTo(this.views.group, 'search:remove', this.removeGroup, this);
            
                this.order.show(this.views.order);
                
                this.listenTo(this.views.order, 'search:add', this.addOrder, this);
                this.listenTo(this.views.order, 'search:remove', this.removeOrder, this);
            }
        },
        
        
        addDomain: function(field, operator, value){
            this.search.addDomain(field, operator, value);
        },
        
        removeDomain: function(field, operator, value){
            this.search.removeDomain(field, operator, value);
        },
        
        addOrder: function(field, type){
            this.search.addOrder(field, type);
        },
        
        removeOrder: function(field, type){
            this.search.removeOrder(field, type);
        },
        
        addGroup: function(field){
            var order_fields = this.fields.order,
                current_groups = order_fields.types('group_by').models,
                current_order_field = this.search.currentOrderField();
            
            order_fields.remove(current_groups);
            order_fields.add(field);
            
            if(!(current_order_field && _.isString(current_order_field.get('field_description')))){
                this.search.resetOrder({silent: true});    
            }
            
            this.views.order.render();
            this.search.addGroup(field);
        },
        
        removeGroup: function(field){
            var order_fields = this.fields.order,
                current_order_field = this.search.currentOrderField();
            
            order_fields.remove(field);
            if(!(current_order_field && _.isString(current_order_field.get('field_description')))){
                this.search.resetOrder({silent: true});
            }
            this.views.order.render();
            
            this.search.removeGroup(field);
            
            var current_group_field = this.search.currentGroupField();
            if(current_group_field){
                order_fields.add(current_group_field);   
            }
            
            
        }
        
    });

    dashboard.views('Search', Search);

});