# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv, fields
from openerp.addons.trobz_dashboard.utils.model import metric_support #@UnresolvedImport 

class dashboard_widget(osv.osv, metric_support):

    _name = "dashboard.widget"
    _description = "Widget"

    def extra_fields(self, cr, uid, ids, field_names, arg, context=None):
        result = {}
        
        for widget in self.browse(cr, uid, ids, context=context):
            
            metrics = []
            for metric in widget.metric_ids:
                metrics.append({
                    'id': metric.id,
                    'name': metric.name,
                    'type':  metric.type,
                    'query_name': metric.query_name,
                    'options': metric.options,
                    'values': metric.values,
                    'defaults': metric.defaults,
                    'model_details': metric.model_details,
                    'fields': metric.fields,
                    'help': metric.help,
                    'position': metric.position  # position of metric
                })
            
            result[widget.id] = {
                'metrics': metrics
            }
            
        return result

    _columns = {
        'name': fields.char('Name'),
        'type': fields.selection((('numeric','Numeric'), ('list','List'), ('graph','Graph')), 'Widget type'),
        
        
        'limit': fields.selection((('all','All'), ('5','5'), ('10','10'), ('80','80'),('100','100'),('200','200')), 'Pager limit'),
        
        'method': fields.char('Model Method', help="Widget model method to execute related metrics"),
        
        'board_ids': fields.many2many('dashboard.board', 'dashboard_board_to_widget_rel', id1='widget_id',id2='board_id', string='Boards', ondelete='cascade', required=True),
        'metric_ids': fields.one2many('dashboard.metric', 'widget_id','Metrics', ondelete='cascade', required=True),
        
        # get metric details directly by JSON-RPC (no need to query dashboard.metric on web side)
        'metrics': fields.function(extra_fields, method=True, multi=True, type='serialized', string='Metrics Data', readonly=True),
    }
    
    _defaults = {
        'method': 'execute',
        'limit': 'all',
   }



dashboard_widget()

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

