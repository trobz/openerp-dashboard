openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){

    var DisplayNumeric = dashboard.views('DisplayNumeric'),
        DisplayGraph = dashboard.views('DisplayGraph'),
        DisplayList = dashboard.views('DisplayList');

    var Collection = Marionette.CollectionView,
        _super = Collection.prototype;

    var WidgetDisplay = Collection.extend({
        
        className: 'displayer',
        
        views: {
            'numeric': DisplayNumeric,
            'graph': DisplayGraph,
            'list': DisplayList,
        },
        
        
        _initialEvents: function() {
            _super._initialEvents.apply(this, arguments);
            
            //custom listener for metric.results update
            if (this.collection) {
                this.listenTo(this.collection, "results:updated", this.render, this);
            }
        },
        
        initialize: function(options){
            this.is_printable = options.printable;
            this.search = options.search;
            
            if(options.type == 'graph'){
                // refresh the display at window resize (card #47)
                var children = this.children, self = this;
                $(window).resize(_.debounce(function(){
                    children.each(function(child){
                        child.render();
                    });
                }, 200));
            }
        },
        
        printable: function(state){
            this.is_printable = state;
            this.children.each(function(child){
                if(child.printable){
                    child.printable(state);    
                }
            });
        },
        
        getItemView: function(model){
            var type = model.get('type');
            if(!(type in this.views)){
                throw new Error('metic type ' + type + ' is not yet supported.');
            }       
            return this.views[type];
        },
        
        itemViewOptions: function(model, index){
            return {
                search: this.search,
                collectionView: this,
                printable: this.is_printable
            };
        }
    });


    dashboard.views('WidgetDisplay', WidgetDisplay);

});