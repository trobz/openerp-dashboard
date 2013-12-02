openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone, base){
    
    var Search = dashboard.models('Search'),
        Fields = dashboard.collections('Fields'),
        Widgets = dashboard.collections('Widgets'),
        Period = dashboard.models('BoardPeriod');
    
    var BaseModel = base.models('BaseModel'),
        _super = BaseModel.prototype;
    
    var Board = BaseModel.extend({
        
        model_name: 'dashboard.board',
        
        initialize: function(data, options){
            this.widgets = new Widgets();
            this.period = new Period();
            
            this.global = {
                search: new Search(),
                fields: new Fields()
            };
            
            this.on('sync', this.onSync);
        },
        
        onSync: function(){
            if(!this.hasCustomPeriod()){
                this.period.set({
                    name: this.get('period_name'),
                    type: this.get('period_type'),
                });
            }
            else {
                this.period.set({
                    start: this.get('period_start_at'),
                    end: this.get('period_end_at'),
                });
            }   
        },
        
        parse: function(data, options){
            var widgets = [];
            if('widgets' in data){
                widgets = data.widgets;
                delete data.widgets;
            }
            this.widgets.reset(widgets);
            
            // add reference to global fields
            var global_fields = this.global.fields, field;
            _(data.global_field_refs).each(function(field_ref){
                
                this.widgets.each(function(widget){
                    field = widget.metrics.fields.types('domain').oneByRef(field_ref);
                    if(!field){
                        throw new Error('global field reference "' + field_ref + '" with type "domain" can not be found in widget "' + widget.get('name') + '"');
                    }
                });
                
                global_fields.add(field);
            }, this);
            
            data['period_start_at'] = moment(data['period_start_at']);
            data['period_end_at'] = moment(data['period_end_at']);
            
            
            return data;
        },
        
        hasCustomPeriod: function(){
            var start = this.get('period_start_at'),
                end = this.get('period_end_at');
            return start.isValid() && end.isValid() && start < end;
        },
        
        fields: function(){
            var fields = new Fields(); 
            this.widgets.each(function(widget){
                fields.add(widget.metrics.fields.models);
            });
            return fields;
        }
    });

    dashboard.models('Board', Board);
});