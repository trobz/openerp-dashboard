# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv, fields
import re

class dashboard_field(osv.osv):

    _name = "dashboard.field"
    _description = "Metric Field"

    def extra_fields(self, cr, uid, ids, field_names, arg, context=None):
        result = {}
        pattern = re.compile(r"""(?i)^date_trunc\((?:['"])?([a-z]+)(?:['"])?, .*\)""")
        
        for field in self.browse(cr, uid, ids, context=context):
            
            # field "period"
            matches = pattern.match(field.sql_name or "")
            period = matches.group(1) if matches and matches.lastindex == 1 else ""
            
            # field "type_names"
            types = ()
            for field_type in field.type_ids:
                types += (field_type.name,)
  
            # field "field_description"
            try:
                field_model = field.field_id.model
                model = self.pool.get(field_model)
                description = model.fields_get(cr, uid, [field.field_id.name], context=context)
                description[field.field_id.name]['name'] = field.field_id.name
                desc = description[field.field_id.name]
            except: 
                desc = 'not found'
            
            result[field.id] = {
                'period': period,
                'type_names': types,
                'field_description': desc,
                'field_model': field_model
            }
        
        return result

    
    _columns = {
        'metric_ids': fields.many2many('dashboard.metric','dashboard_metric_to_field_rel', id1='field_id',id2='metric_id', string='Metrics', ondelete='cascade', required=True),
        'name': fields.char('Name', required=True),
        'sequence': fields.integer('Sequence', help="field order, useful for list widgets"),
        'reference': fields.char('Reference', help="used to recognize fields with the same type of data", required=True),
        'sql_name': fields.char('SQL Name', help="name use in a SQL query, depend on the metric method. If the domain has to be used by the ORM, keep this field empty"),
        'domain_field_path': fields.char('Domain Field Path', help="The fullname to access one object in a domain, for example: hr_employee.address_id.country_id.name. This is used for the link at the bottom of a widget"),
        
        
        'field_id': fields.many2one('ir.model.fields', 'Field', help="field in the model"),
        'type_ids': fields.many2many('dashboard.field.type', id1='metric_field_id', id2='metric_field_type_id', string='Types', help='Defined the propose of the field: output, filter, group_by, order_by'),
        
        # used to access type names in JSON-RPC without an other query 
        'type_names': fields.function(extra_fields, method=True, type='serialized', string='Tag Names', multi=True, readonly=True),
        
        # search form need the description of the field defined
        'field_description': fields.function(extra_fields, method=True, type='serialized', string='Field Description', multi=True, readonly=True),
        
        # get the period from sql_name, if any
        'period': fields.function(extra_fields, method=True, type='char', string='Period', multi=True, readonly=True),

        # get the field model, if any
        'field_model': fields.function(extra_fields, method=True, type='char', string='Period', multi=True, readonly=True)

    }
        

dashboard_field()

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

