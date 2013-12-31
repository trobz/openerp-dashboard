openerp.unleashed.module('dashboard', function(dashboard, _, Backbone, base){
    
    var Operators = dashboard.collections('Operators');
    
    var Model = Backbone.Model,
        _super = Model.prototype;
   
    var Search = Model.extend({
        
        initialize: function(){
            
            this.defaults = {
                domain: [],
                order: {},
                group: [],
            };
            
            this.set({
                domain: [],
                order: [],
                group: [],
            }, {silent: true});
        
            this.operators = new Operators();
        },


        /*
         * bind with an other search model
         */
        bind: function(search){
            if(!(search instanceof Search)){
                throw new Error('search model can only be binded with an other seach object.');
            }

            search.on('set:domain', this.addDomain, this);
            search.on('remove:domain', this.removeDomain, this);
            search.on('filter:domain', this.filterDomain, this);
            search.on('define:domain', this.defineDomain, this);
            search.on('set:group', this.addGroup, this);
            search.on('remove:group', this.removeGroup, this);
            search.on('reset:group', this.resetGroup, this);
            search.on('set:order', this.addOrder, this);
            search.on('remove:order', this.removeOrder, this);
            search.on('reset:group', this.resetOrder, this);

        },

        /*
         * Domain manipulation
         */

        addDomain: function(field, operator, value, options){
            if(this.getCriterion(field, operator, value) == null && (value || _(['true', 'false']).contains(operator))){
                var domain = this.get('domain').slice(0);    
                domain.push({
                    field: field, 
                    operator: operator, 
                    value: value,
                    options: options || {} 
                });
                this.set('domain', domain);
                this.trigger('set:domain', field, operator, value);
            }
        },
        
        removeDomain: function(field, operator, value){
            var index = this.getCriterion(field, operator, value);
            if(index != null){
                var domain = this.get('domain').slice(0);    
                domain.splice(index, 1);
                this.set('domain', domain);
                this.trigger('remove:domain', field, operator, value);
            }
        },

        filterDomain: function(field, options){
            var new_domain = [], domain = this.get('domain');
            for(var i=0 ; i< domain.length ; i++){
                if(_.size(domain[i]) < 3){
                    new_domain.push(domain[i]);
                }
                else if(domain[i].field.get('reference') != field.get('reference')){
                    new_domain.push(domain[i]);
                }
            }
            this.trigger('filter:domain', field, options);
            this.set('domain', new_domain, options)
        },


        defineDomain: function(domain, options){
            this.set('domain', domain, options);
            this.trigger('define:domain', domain);
        },

        getCriterion: function(field, operator, value){
            var domain = this.get('domain');
            for(var i=0 ; i< domain.length ; i++){
                if(
                    _.size(domain[i]) >= 3
                    && domain[i].field.get('reference') == field.get('reference')
                    && domain[i].operator == operator
                    && domain[i].value == value  
                )
                {
                    return i;
                }
            }
            return null;
        },
        
        domain: function(returnType){
        	returnType = returnType || 'reference'
            var domain = this.get('domain'),
                object = [];
        
            var gdomain = _(domain).groupBy(function(criterion){return criterion.field.get('reference'); });
            
            _(gdomain).each(function(criteria, group){
                
                _(criteria).each(function(criterion, i){
                    var operator = this.operators.byName(criterion.operator);
                
                    if((criteria.length - i) >= 2){
                        object.push(this.operators.byName('|').domain);
                    }
                    if(operator.not){
                        object.push(this.operators.byName('not').domain);
                    }
	                if (returnType =='reference'){
	                    field = criterion.field.get('reference');
                    } else {
                    	field = criterion.field.get('domain_field_path');
                    }
                    if(!field){
                        console.warn('domain can not be correctly retrieved', returnType, 'not found in', criterion.field);
                    }
                    else {
                        object.push([
                            operator.field(field),
                            operator.domain,
                            operator.value(criterion.value)
                        ]);
                    }
                	                   
                }, this);
                
            }, this);
            return object;
        },
        
        
        /*
         * Order manipulation
         */
        
        defaultOrder: function(field, type){
            this.defaults.order = { field: field, type: type };
            this.addOrder(this.defaults.order.field, this.defaults.order.type);
        },
        
        addOrder: function(field, type, options){
            if(type != 'ASC' && type != 'DESC'){
                throw new Error('order type has to be ASC or DESC');
            }
            this.set('order', [{ 'field': field, 'type': type }], options);
            this.trigger('set:order', field, type, options);
        },
        
        removeOrder: function(field, type, options){
            var order = this.get('order').slice(0),
                index = this.getOrderIndex(field, type);
            
            if(index != null){
                order.splice(index, 1);
                if(order.length == 0 && _.size(this.defaults.order) > 0){
                    this.addOrder(this.defaults.order.field, this.defaults.order.type, options);
                }
                else {
                    this.set('order', order, options);
                }
                this.trigger('remove:order', field, type, options);
            }
        },
        
        resetOrder: function(options){
            this.set('order', [], options);
            if(_.size(this.defaults.order) > 0){
                this.addOrder(this.defaults.order.field, this.defaults.order.type, options);
            }
            this.trigger('reset:order', options);
        },
        
        getOrderIndex: function(field){
            var index = null;
            _(this.get('order')).each(function(val, i){
                if(val.field.get('reference') == field.get('reference')){
                    index = i;
                } 
            });
            return index;
        },
        
        order: function(){
            var order = [];
            _(this.get('order')).each(function(val){
                order.push(val.field.get('reference') + ' ' + val.type);
            });
            return order;
        },
        
        currentOrderField: function(){
            return this.get('order').length > 0 ? this.get('order')[0].field : null;
        },
        
        /*
         * Group manipulation
         */
        
        defaultGroup: function(field){
            this.defaults.group = [field];
            this.addGroup(this.defaults.group[0]);
        },
        
        addGroup: function(field, options){
            this.set('group', [field], options);
            this.trigger('set:group', field, options);
        },
        
        removeGroup: function(field, options){
            var group = this.get('group').slice(0),
                index = this.getGroupIndex(field);
            
            if(index != null){
                group.splice(index, 1);
                if(group.length == 0 && this.defaults.group.length > 0){
                    this.addGroup(this.defaults.group[0], options);
                }
                else {
                    this.set('group', group, options);
                }
                this.trigger('remove:group', field, options);
            }
        },

        resetGroup: function(options){
            this.set('group', [], options);
            if(this.defaults.group.length > 0){
                this.addGroup(this.defaults.group[0], options);
            }
            this.trigger('reset:group', options);
        },

        getGroupIndex: function(field){
            var index = null;
            _(this.get('group')).each(function(gfield, gindex){
                if(field && field.get('reference') == gfield.get('reference')){
                    index = gindex;
                } 
            });
            return index;
        },
        
        group: function(){
            var group = [];
            _(this.get('group')).each(function(field){
                group.push(field.get('reference'));
            });
            return group;
        },
        
        currentGroupField: function(){
            return this.get('group').length > 0 ? this.get('group')[0] : null;
        },
        
        
        /* others */
       
       isDefault: function(type){
           var is_default = false, defaults, item, has_defaults = false, has_item = false,
               extra = true, field, default_field;
               
           if(type == 'order'){
               defaults = this.defaults.order;
               item = this.get('order');
               has_defaults = _.size(defaults) > 0;
               has_item = item.length > 0;
               
               field = has_item ? item[0].field : null;
               default_field = has_defaults ? defaults.field : null;
               extra = has_defaults && has_item ? item[0].type == defaults.type  : false;
           }
           else if(type == 'group'){
               defaults = this.defaults.group;
               item = this.get('group');
               has_defaults = defaults.length > 0;
               has_item = item.length > 0;
               
               field = has_item ? item[0] : null;
               default_field = has_defaults ? defaults[0] : null;
           }
           
           is_default = extra && field && default_field && field.get('reference') == default_field.get('reference'); 
           
           return is_default;
       }
    });

    dashboard.models('Search', Search);
});