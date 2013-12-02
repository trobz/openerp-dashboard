openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){
    
    var ItemView = Marionette.ItemView,
        _superItem = ItemView.prototype;
 
    var CollectionView = Marionette.CollectionView,
        _superCollection = CollectionView.prototype;


    var TestBase = dashboard.models('TestBase');
    var CODES = TestBase.prototype.codes;
    

    /*
     * Views
     */
    
     var TestResult = ItemView.extend({
        template: 'TrobzDashboard.tester.result',
        tagName: 'li',
        className: 'list-group-item',
        
        modelEvents: {
            'change': 'render'
        },
        
        ui: {
            info: '.test-info',
            trace: '.debug_trace'
        },
        
        events: {
            'click .test-label.clickable': 'toggleDetail',
            'click .trace': 'toggleTrace',
            
        },
        
        toggleDetail: function(e){
            if(e) e.preventDefault();
            var $label = $(e.currentTarget),
                $icon = $label.nextAll('i.chevron');
            
            if($icon.length > 0){
                if($icon.is('.icon-chevron-right')){
                    $icon.attr('class', 'chevron icon-chevron-down');
                    this.ui.info.show();
                }
                else {
                    $icon.attr('class', 'chevron icon-chevron-right');
                    this.ui.info.hide();
                }    
            }
        },
        
        
        toggleTrace: function(e){
            if(e) e.preventDefault();
            var $label = $(e.currentTarget),
                $icon = $label.nextAll('i.debug_chevron'),
                $trace = $label.nextAll('pre');
            
            if($icon.length > 0){
                if($icon.is('.icon-chevron-right')){
                    $icon.attr('class', 'debug_chevron icon-chevron-down');
                    $trace.show();
                }
                else {
                    $icon.attr('class', 'debug_chevron icon-chevron-right');
                    $trace.hide();
                }    
            }
        },
        
        serializeData : function() {
            var code = this.model.get('code');
            return {
                model : this.model,
                state : (
                            code != CODES.ERROR ? 
                            ( 
                                code != CODES.WARNING ? 
                                (
                                    code != CODES.SUCCESS ? null : 'success'
                                )  : 'warning'
                            ) : 'danger'
                        ),
                       
                icon :  (
                            code != CODES.ERROR ? 
                            ( 
                                code != CODES.WARNING ? 
                                (
                                    code != CODES.PENDING ?  
                                    (
                                       code != CODES.SUCCESS ? '' : 'icon-ok'  
                                    ) : 'icon-refresh icon-spin'   
                                ) : 'icon-warning-sign'
                            ) : 'icon-remove'
                        ),
            };
        }
    });
    
    var TestResults = CollectionView.extend({
        itemView: TestResult,
        tagName: 'ul',
        className: 'list-group',
    });
    
    dashboard.views('TestResults', TestResults);

});