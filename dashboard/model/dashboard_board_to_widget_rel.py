# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv, fields



class dashboard_board_to_widget_rel(osv.osv):

    _name = "dashboard.board_to_widget_rel"
    _description = "Board to Widget relation table"

    _columns = {
         'board_id': fields.integer('Board id'),
         'widget_id': fields.integer('Widget id'),
    
         #appearance / position
        'sequence': fields.integer('Sequence', help='Position in the dashboard, higher numbers are placed at the top'),
        'width':  fields.integer('Width', help='Width, max 12 units'),
        'height':  fields.integer('Height', help='Height, max 12 units'),
   }

dashboard_board_to_widget_rel()

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

