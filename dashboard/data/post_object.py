# -*- encoding: utf-8 -*-
##############################################################################

from openerp.osv import osv
from openerp.modules.db import has_unaccent


class post_object(osv.osv_memory):
    
    _name = 'post.object.dashboard'
    _description = 'prepare the database'
    _auto = True
    _log_access = True
    
    
    def start(self, cr, uid):
        self.add_postgresql_unaccent_module(cr, uid)
        self.generate_ir_rules_identifier(cr, uid)
        return True
    
    
    def generate_ir_rules_identifier(self, cr, uid):
        """
        populate custom ir.rules field "identifier" with data id if available
        """
        
        # get rules
        cr.execute("SELECT id FROM ir_rule WHERE identifier IS NULL;")
        rules = cr.fetchall()
         
        update = {
            'query': [],
            'params': []
        }
        
        for rule in rules:
            cr.execute("SELECT module, name FROM ir_model_data WHERE model = %s AND res_id = %s", ['ir.rule', rule])
            info = cr.fetchone()
            if info and len(info) == 2:
                update['query'].append("UPDATE ir_rule SET identifier = %s WHERE id = %s;")  
                update['params'] = update['params'] + [ info[0] + '.' + info[1], rule ]   
         
        
        # update all rules
        if len(update['query']) > 0:
            cr.execute("".join(update['query']), update['params'])
            cr.commit()
        
        
    
    def add_postgresql_unaccent_module(self, cr, uid):
        """
        lazy load unaccent extension
        """
        try:
            if not has_unaccent(cr):
                cr.execute('CREATE EXTENSION "unaccent";')
        except:
            cr.rollback()     
            raise Exception('Ooops, postgesql unaccent module can not be loaded, check your postgresql version and if this module is installed. To install it on ubuntu, execute: sudo apt-get install postgresql-contrib-9.1')
            
post_object()
