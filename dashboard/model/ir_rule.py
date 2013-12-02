# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv, fields


class ir_rule(osv.osv):

    _inherit = "ir.rule"
    
    _columns = {
        'identifier': fields.char('Identifier', help="Unique identifier, used as a technical reference to the rule", required=True),
    }
    
    _sql_constraints = [ 
        ('unique_identifier', 'UNIQUE (identifier)', 'The rule identifier must be unique') 
    ] 
    


ir_rule()

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: