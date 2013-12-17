openerp.unleashed.module('dashboard', function(dashboard, _, Backbone){
    
    var _super = Backbone.Model.prototype;
    
    var State = Backbone.Model.extend({
        
        defaults: {
            action: null,
            menu_id: null,
            model: null,
            view_type: null,
        },
        
        link: function(obj){
            this.board = obj.board;
        },
        
        bind: function(){
        },
        
        unbind: function(){
        },
        
        /* processing */
        process: function(){
            return this.board.fetch();
        },
        
        push: function(){
            this.trigger('change', this);
        },
        
        destroy: function(){
            this.unbind();
            _super.destroy.apply(this, arguments);
        }
    });

    dashboard.models('State', State);

});