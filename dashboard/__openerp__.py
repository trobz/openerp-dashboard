# -*- coding: utf-8 -*-
{
    'name': 'Dashboard',
    'version': '1.0',
    'category': 'Data Visualization',
    'description': """
Creates Interactive and customizable Dashboard, with widgets: Metric, List, Graph and Combined Graph
    """,
    'author': 'trobz',
    'website': 'https://github.com/trobz/openerp-dashboard',
    'depends': [
        'web_graph',
        'web_serialized',
        'web_unleashed',
        'web_unleashed_extra'
    ],

    'update_xml': [
        'view/ir_rule_view.xml',
        'view/dashboard_board_view.xml',
        'view/dashboard_widget_view.xml',
        'view/dashboard_metric_view.xml',
        'view/dashboard_field_view.xml',
        'menu/dashboard_menu.xml',

        'data/default_field_types.xml',
        # Security
        'security/res_groups_data.xml',
        'security/ir.model.access.csv',
    ],

    'demo': [],
    'application': True,
    'sequence': -99,
    'installable': True,
    'active': False,
    'post_objects': ['post.object.dashboard'],

    'qweb' : [
        'static/src/templates/*.xml',
    ],

    'js': [
        # libs
        'static/lib/bootstrap-daterangepicker/daterangepicker.js',

        # fix bugs in flotr2 lib
        'static/src/js/extends/flotr2.js',

        'static/src/js/models/state.js',
        'static/src/js/models/period.js',

        'static/src/js/collections/results.js',
        'static/src/js/collections/results.pager.js',

        'static/src/js/models/operator.js',
        'static/src/js/collections/operators.js',

        'static/src/js/models/search.js',

        'static/src/js/models/field.js',
        'static/src/js/collections/fields.js',

        'static/src/js/models/metric.js',
        'static/src/js/collections/metrics.js',

        'static/src/js/models/widget.js',
        'static/src/js/collections/widgets.js',

        'static/src/js/models/board.js',

        # views
        'static/src/js/views/search/widgets.js',
        'static/src/js/views/search/order.js',
        'static/src/js/views/search/group.js',
        'static/src/js/views/search/domain.js',
        'static/src/js/views/search/search.js',

        'static/src/js/views/toolbar/timebar.js',
        'static/src/js/views/toolbar/toolbar.js',
        'static/src/js/views/toolbar/print.js',

        'static/src/js/views/widgets/display/numeric.js',
        'static/src/js/views/widgets/display/list.js',
        'static/src/js/views/widgets/display/graph.js',
        'static/src/js/views/widgets/display/display.js',

        'static/src/js/views/widgets/status/status.js',

        'static/src/js/views/widgets/widget.js',
        'static/src/js/views/widgets/widgets.js',
        'static/src/js/views/widgets/widgets.static.js',

        'static/src/js/views/board.js',

        'static/src/js/views/panel.js',

        'static/src/js/dashboard.js',


        # debug mode, test metric integrity
        'static/src/js/tester/tester.js',

        'static/src/js/tester/models/test.base.js',
        'static/src/js/tester/models/test.attrs.js',
        'static/src/js/tester/models/test.base.fields.js',
        'static/src/js/tester/models/test.order.js',
        'static/src/js/tester/models/test.group.js',
        'static/src/js/tester/models/test.domain.js',
        'static/src/js/tester/models/test.security.js',

        'static/src/js/tester/collections/tests.js',

        'static/src/js/tester/views/widgets.js',
        'static/src/js/tester/views/results.js',

        'static/src/js/tester/tester.js',
    ],
    'css': [
        # libs
        'static/lib/bootstrap-daterangepicker/daterangepicker.css',
        'static/src/css/datepicker_bootstrap.css',

        'static/src/css/print.css',

        'static/src/css/dashboard.css',
        'static/src/css/toolbar.css',

        'static/src/css/widgets.css',
        'static/src/css/widget.css',
        'static/src/css/search.css',
        'static/src/css/display.css',

        'static/src/css/tester.css',
    ],

    'test': [
        'static/src/tests/search.js',
    ]
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
