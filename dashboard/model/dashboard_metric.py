# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv, fields


class dashboard_metric(osv.osv):

    _name = "dashboard.metric"
    _description = "Widget Metric"

    def extra_fields(self, cr, uid, ids, field_names, arg, context=None):
        result = {}
        
        for metric in self.browse(cr, uid, ids, context=context):
            
            fields = []
            for field in metric.field_ids:
                fields.append({
                    'id': field.id,
                    'name': field.name,
                    'sequence': field.sequence,
                    'reference': field.reference,
                    'domain_field_path': field.domain_field_path,
                    'sql_name': field.sql_name,
                    'type_names': field.type_names,
                    'field_description': field.field_description,
                    'period': field.period,
                    'field_model': field.field_model
                })
            
            model_details = { 'id': metric.model.id, 'name': metric.model.name, 'model' : metric.model.model }
            
            defaults = {}
            model = self.pool.get(metric.model.model)
            if hasattr(model, '_metrics_sql') and metric.query_name in model._metrics_sql:
                query = model._metrics_sql[metric.query_name]
                defaults = query['defaults'] if isinstance(query, dict) and 'defaults' in query else {}
            
            result[metric.id] = {
                'fields': fields,
                'model_details': model_details,
                'defaults': defaults
            }
            
        return result
    
    _columns = {
        'name': fields.char('Name'),
        'type':  fields.selection((('numeric','Numeric'), ('list','List'), ('graph','Graph') ), 'Type of metric retrieved by the query'),
        'model':fields.many2one('ir.model','Model of the Resource', help='OpenERP model that will define sql queries to execute.'),
        'query_name': fields.char('SQL Query Name', help="Custom SQL query defined on the model to get metric data."),
                
        'widget_id': fields.many2one('dashboard.widget','Widget', ondelete='cascade', required=True),
        'field_ids': fields.many2many('dashboard.field', 'dashboard_metric_to_field_rel', id1='metric_id',id2='field_id', string='Fields', ondelete='cascade', required=True),
        'position': fields.integer('Sequence', help='Position in the widget, higher numbers are placed at the top.'),

        'options': fields.serialized('Options', help="""
Options are defined according to the metric type:

Number:
- format (use numerical.js): "0"
- thresholders: { ">10": "red", "<10": "green"}
List:
- page limit: 80 
Pie / Line / Bar Chart:
- all options available in Flotr2
        """),
        'values': fields.serialized('Values', help="Current metric state"),
     
        # get the model details directly by JSON-RPC
        'model_details': fields.function(extra_fields, method=True, multi=True, type='serialized', string='Model Details', readonly=True),
        
        # get field details directly by JSON-RPC (no need to query dashboard.field on web side)
        'fields': fields.function(extra_fields, method=True, multi=True, type='serialized', string='Fields Data', readonly=True),
        
        # get defaults metric filters defined on the model, in _metrics_sql attribute
        'defaults': fields.function(extra_fields, method=True, multi=True, type='serialized', string='Defaults for SQL', readonly=True),
        'help': fields.text('Help'),   
    }
    
    _defaults = {
        'options': {},
        'values': {},
    }
    
dashboard_metric()

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

