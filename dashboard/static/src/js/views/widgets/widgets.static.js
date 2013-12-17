openerp.unleashed.module('dashboard',function(dashboard, _, Backbone, base){
 
    var Widget = dashboard.views('Widget'),
        Widgets = dashboard.views('Widgets'),
        _super = Widgets.prototype;

    var StaticWidgetsView = Widgets.extend({

        ui: {
            widgets: 'widget'
        },

        // override to keep the layout and inject widgets at specific places
        render: function(){
            this.isRendered = true;
            this.isClosed = false;

            this.triggerBeforeRender();

            this.bindUIElements();
            this.triggerMethod("composite:model:rendered");

            this._renderChildren();

            this.triggerMethod("composite:rendered");
            this.triggerRendered();
            return this;
        },

         // render the item view in a specific container, based on the widget id
        renderItemView: function(view, index) {
            var id = view.model.get('identifier'),
                $widget = this.ui.widgets.filter('#' + id)

            if($widget.length > 0){
                view.render();
                $widget.append(view.el);
            }

        }

    });

    dashboard.views('StaticWidgets', StaticWidgetsView);

});