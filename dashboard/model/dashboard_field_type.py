# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv, fields

class dashboard_field_type(osv.osv):

    _name = "dashboard.field.type"
    _description = "Metric Field Type"

    _columns = {
        'name':  fields.selection( ( ('output','Output'), ('period','Period'), ('domain','Domain'), ('group_by','Group By'), ('order_by','Order By') ), 'Type of field'),
        
    }

dashboard_field_type()

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

