openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
    
    var Layout = Marionette.Layout,
        _superLayout = Layout.prototype;

    var CompositeView = Marionette.CompositeView,
        _superComposite = CompositeView.prototype;
     
    var TestBase = dashboard.models('TestBase');
    var CODES = TestBase.prototype.codes;
        
    var TestWidget = Layout.extend({
        template: 'Dashboard.tester.widget',
        tagName: 'li',
        className: 'list-group-item',

        events: {
            'click .test': 'test',
            'click .detail': 'toggleDetail',
        },
        
        ui: {
            result: '.test_result',
            label: '.label',
            error_label: '.label-danger',
            success_label: '.label-success',
            warning_label: '.label-warning',
            
        },

        regions: {
            result: '.test_result'
        },

        initialize: function(options){
            this.resultView = options.resultView;
            var testCollection = options.testCollection;

            this.tests = new testCollection([], {
                model: this.model 
            });
            
            this.listenTo(this.tests, 'run', this.executed, this)
            this.listenTo(this.tests, 'refresh', this.refresh, this)
        },
        
        onRender: function(){
            var view = this.resultView;
            
            this.result.show(new view({
                collection: this.tests
            }));
        },
        
        refresh: function(){
            this.ui.label.hide();
        },
        
        executed: function(test){
            this.ui.label.hide();
            if(this.tests.findWhere({code: CODES.ERROR})){
                this.ui.error_label.show();
            }
            else if(this.tests.findWhere({code: CODES.WARNING})){
                this.ui.warning_label.show();
            }
            else {
                this.ui.success_label.show();
            }
        },
        
        test: function(e){
            if(e) e.preventDefault();
            this.tests.run();
        },
        
        toggleDetail: function(e){
            if(e) e.preventDefault();
            var $icon = $(e.currentTarget).find('i');
            
            if($icon.is('.icon-expand-alt')){
                $icon.attr('class', 'icon-collapse-alt');
                this.ui.result.show();
            }
            else {
                $icon.attr('class', 'icon-expand-alt');
                this.ui.result.hide();
            }
        },
        
        serializeData : function() {
            return {
                model : this.model
            };
        }
    });

    var TestWidgets = CompositeView.extend({
        
        className: 'tester',
        template: 'Dashboard.tester.widgets',
        
        itemView: TestWidget,
        itemViewContainer: '#dashboard_tester',
        itemViewOptions: function(){
            return {
                resultView: this.resultView,
                testCollection: this.testCollection
            };
        },
        
        initialize: function(options){
            this.resultView = options.resultView;
            this.testCollection = options.testCollection;
        },
        
        events: {
            'click .test_all': 'testAll'
        },
        
        testAll: function(e){
            if(e) e.preventDefault();
            this.children.each(function(view){
                view.test();
            });
        }
    });
    
    
    dashboard.views('TestWidgets', TestWidgets);

});