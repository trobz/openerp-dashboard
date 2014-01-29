# -*- coding: utf-8 -*-

from openerp.osv import osv, fields

from dashboard.utils.model import metric_support 

# to support metric, the model has to inherit from osv and metric_support
class hr_employee(osv.osv, metric_support):
   
    _inherit = 'hr.employee'
    
    _metrics_sql = {
        # simply specify a query without custom condition
        # use "count" name in Metric SQL Query Name
        'count': 'SELECT count(id) as count FROM hr_employee WHERE TRUE {generated}',
        # query with conditions, use the %s syntax in the query and add parameters for each of them
        # use "custom_count" name in Metric SQL Query Name
        'custom_count': {
             'query': 'SELECT count(id) as count FROM hr_employee WHERE TRUE AND name_related like %s {generated}',
             'params': ['J%']
        },
                    
        'list': """
             SELECT he.name_related, he.work_email, he.birthday, he.parent_id as manager, rc.name as "country"  
             FROM hr_employee AS he 
             LEFT JOIN res_country rc ON rc.id = he.country_id 
             WHERE TRUE {generated}
             """,
         
    }
    
    _columns = {
        'write_date': fields.datetime('Date Modified', readonly=True),
    }
    
hr_employee()
