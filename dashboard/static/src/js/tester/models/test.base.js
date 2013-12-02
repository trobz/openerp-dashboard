openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
    
    var Model = Backbone.Model,
        _superModel = Model.prototype;
    
    var CODES = {
        ERROR: 0,
        WARNING: 1,
        SUCCESS: 2,
        PENDING: 3,
        INIT: 4
    };
    
    var TestBase = Model.extend({
        
        codes: CODES, 
        
        label: 'base test',
        
        initialize: function(data, options){
            this.model = options.model;
            this.init();
        },
        
        run: function(model){
            throw new Error('abstract object, override this method on a concret Test implementation');
        },
        
        init: function(){
            this.set({
                label: this.label,
                message: null,
                code: CODES.INIT   
            });
        },
        
        start: function(){
            this.set({
                label: this.label,
                message: null,
                code: CODES.PENDING   
            });
        },
        
        success: function(message){
            this.set({
                message: message,
                code: CODES.SUCCESS   
            });
        },
        
        warning: function(message){
            this.set({
                message: message,
                code: CODES.WARNING   
            });
        },
        
        error: function(message){
            this.set({
                message: message,
                code: CODES.ERROR   
            });
        },
        
        arrayMessage: function(){
            return $.isArray(this.get('message'));
        },
        
        hasMessage: function(){
            
            return this.arrayMessage() ? this.get('message').length > 0 : !!this.get('message');
        },
    });      

    dashboard.models('TestBase', TestBase);

});