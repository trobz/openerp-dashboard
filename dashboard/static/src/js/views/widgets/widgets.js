openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
 
    var Widget = dashboard.views('Widget'),
        View = Marionette.CompositeView,
        _super = View.prototype;

    var WidgetsView = View.extend({
        
        type: 'list',
        className: 'list',
        
        template: 'Dashboard.widgets',
        
        itemViewContainer: '.widgets',
        
        itemView: Widget,
        itemViewOptions: function(model, index) {
            return {
                period: this.period,
                debug: this.debug,
                removable: this.is_removable,
                printable: this.is_printable
            };
        },
        
        initialize: function(options){
            this.is_removable = !!options.removable, 
            this.is_printable = !!options.printable, 
            this.period = options.period;
            this.debug = options.debug;
            this.previousAnim = $.Deferred();
            this.previousAnim.resolve();
        },
        
        onShow: function() {
            this.children.each(function(child){
                // inject a float:clear div to stop the flow and force widgets wrapping (fix card #47)
                var $clear = $('<div class="clear">');
                if(child.$el.position().left == 0){
                    child.$el.before($clear.clone());
                }
            });
        },
        
        removable: function(state){
            this.is_removable = state;
            this.children.each(function(child){
              child.removable(state);
            });
        },
        
        printable: function(state){
            this.is_printable = state;
            this.children.each(function(child){
              child.printable(state);
            });
        },
        
        animate: function(duration){
            duration = duration || 10000;
            this.stopAnimate();
            if(this.type == 'sliding'){
                    this.timer = setInterval($.proxy(this.slide, this), duration);        
            }
        },
        
        stopAnimate: function(){
            clearInterval(this.timer || 0);
        },
        
        
        resetSliding: function(){
            this.$el.find('.graph').empty();
            
            this.$el.css({
                x: 0,
                y: 0
            });
        },
        
        next: function(){
            if(this.type == 'sliding'){
                this.slide('next');
                
            }
        },
        
        previous: function(){
            if(this.type == 'sliding'){
                this.slide('previous');
            }
        },
        
        slide: function(direction){
            
            direction = direction || 'next';
            
            var $el = this.$el,
                size = this.size,
                children = this.children,
                self = this,
                x = parseInt($el.css('x')),
                last = - (this.size.width * (this.collection.length - 2));
                
                
            if(direction == 'next'){
                pos = x + this.size.width > last ? x - this.size.width : 0;
            }
            else {
                pos = x + this.size.width < 0 ? x + this.size.width : last; 
            }
                
            this.previousAnim.done(function(){
                
                self.previousAnim = new $.Deferred();
                            
                $el.transition({ x: pos, y: 0 }, 2000, function(){
                    //refesh the widget
                    var index = Math.round(Math.abs(parseInt($el.css('x'))) / size.width),
                        child = children.findByIndex(index);
                    
                    if(child){
                        child.model.update().done(function(){
                            self.previousAnim.resolve();
                            child.$el.hide().show(0);
                        });
                    }
                });    
            });
            
        },
        
        mode: function(type){
            this.type = type;
            
            this.$el.attr({
                style: ''
            });
            
            if(type == 'sliding'){
                var size = this.size = {
                    width: this.$el.width(),
                };
                
                this.children.each(function(widget, index){
                    widget.width = widget.$el.width(); 
                    widget.$el.css({
                        width: size.width,
                        left: size.width * index
                    });
                    widget.$el.find('.display').css({
                    });
                });
                
                
            }
            else {
                this.children.each(function(widget){
                    widget.$el.attr({
                        style: ''   
                    });
                });
                
                this.$el.attr({
                    style: ''   
                });
            }
            
            
            _.defer($.proxy(this.refresh, this));
        },
        
        
        refresh: function(){
            this.children.each(function(child){
                child.views.display.render();
            });
        },
        
        serializeData: function(){                      
            return {
              "name": this.model.get('name'),
            }
        }
        
    });

    dashboard.views('Widgets', WidgetsView);

});