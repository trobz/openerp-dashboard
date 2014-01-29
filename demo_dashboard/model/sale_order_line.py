# -*- coding: utf-8 -*-

from openerp.osv import osv
from dashboard.utils.model import metric_support 

class sale_order_line(osv.osv, metric_support):
    
    graph_total_sales = {
       'query': """
            SELECT {group_sql} AS "{group_ref}", SUM(price_unit * product_uom_qty) AS total_sales_amount
            FROM sale_order_line sol
            JOIN sale_order sor ON sor.id = sol.order_id
            JOIN res_company rco ON rco.id=sor.company_id
            JOIN sale_shop ssh ON ssh.id=sor.shop_id
            JOIN res_partner rpa ON rpa.id=sor.partner_id
            JOIN resource_resource rre ON rre.user_id = sor.user_id
            JOIN hr_employee hem ON hem.resource_id = rre.id
            LEFT JOIN hr_department hde ON hde.id = hem.department_id
            JOIN product_product ppr ON ppr.id = sol.product_id
            JOIN product_template pte ON pte.id = ppr.product_tmpl_id
            JOIN REQUIRED product_category pca ON pca.id = pte.categ_id
            WHERE TRUE {generated}
            {group_by}
            {order_by}
            """,
       'security': {
            'base.res_company_rule': 'rco.id in (%user.company_id.child%)',
            'product.product_comp_rule': 'pte.company_id in (%user.company_id.child%) OR pte.company_id = NULL',
            'sale.sale_order_personal_rule': 'sor.user_id = %user.id% OR sor.user_id = NULL',
            'portal_sale.portal_sale_order_user_rule': 'sol.order_partner_id in (%user.partner_id.id%)'
       }
                         
    } 
    
    _inherit = 'sale.order.line'
    
    _metrics_sql = {
        'total_sales_numeric': """
            SELECT sum(sol.price_unit * sol.product_uom_qty)/1000000000 as total_sales_numeric 
            FROM sale_order_line sol
            JOIN sale_order sor ON sor.id = sol.order_id
            JOIN res_partner rpa ON rpa.id=sor.partner_id
            WHERE TRUE {generated}
        """,
        'number_customers': """
            SELECT COUNT(DISTINCT partner_id) as number_customers 
            FROM sale_order sor
            JOIN res_partner rpa ON rpa.id=sor.partner_id
            WHERE TRUE {generated}
        """,
        'average_sale_repetition': """
            SELECT avg(nb_repetition) as nb_repetition 
            FROM (SELECT COUNT(id) as "nb_repetition" FROM sale_order group by partner_id) as repetition_per_customer 
            WHERE TRUE {generated}
        """,
        'graph_total_sales': {
            'query': graph_total_sales['query'],
            'security': graph_total_sales['security'],
            'defaults': {
                'group_by': ['order_date_month']
            },
           'no_result': 0
        },
        'graph_total_sales_pie': {
            'query': graph_total_sales['query'],
            'security': graph_total_sales['security'],
            'defaults': {
                'group_by': ['customer']
            }
        },
        'graph_total_sales_quantity': {
           'query': """
                SELECT {group_sql} AS "{group_ref}", sum(product_uom_qty) as total_sales_quantity
                FROM sale_order_line sol
                JOIN sale_order sor ON sor.id = sol.order_id
                JOIN res_company rco ON rco.id=sor.company_id
                JOIN sale_shop ssh ON ssh.id=sor.shop_id
                JOIN res_partner rpa ON rpa.id=sor.partner_id
                JOIN resource_resource rre ON rre.user_id = sor.user_id
                JOIN hr_employee hem ON hem.resource_id = rre.id
                LEFT JOIN hr_department hde ON hde.id = hem.department_id
                JOIN product_product ppr ON ppr.id = sol.product_id
                JOIN product_template pte ON pte.id = ppr.product_tmpl_id
                JOIN product_category pca ON pca.id = pte.categ_id
                where TRUE {generated}
                {group_by}
                {order_by}
                """,
           'defaults': {
                'group_by': ['order_date_month']
           },
           'no_result': 0
        },
        'graph_kitchen_sales': {
           'query': """
                SELECT {group_sql} AS "{group_ref}", sum(price_unit * product_uom_qty)/1000000000 as kitchen_sales
                FROM sale_order_line sol
                JOIN sale_order sor ON sor.id = sol.order_id
                JOIN res_company rco ON rco.id=sor.company_id
                JOIN sale_shop ssh ON ssh.id=sor.shop_id
                JOIN res_partner rpa ON rpa.id=sor.partner_id
                JOIN resource_resource rre ON rre.user_id = sor.user_id
                JOIN hr_employee hem ON hem.resource_id = rre.id
                LEFT JOIN hr_department hde ON hde.id = hem.department_id
                JOIN product_product ppr ON ppr.id = sol.product_id
                JOIN product_template pte ON pte.id = ppr.product_tmpl_id
                JOIN product_category pca ON pca.id = pte.categ_id
                where TRUE AND pca.name = 'Kitchen Modules' {generated}
                {group_by}
                {order_by}
                """,
           'defaults': {
                'group_by': ['order_date_month']
           }
        },
        'graph_sales_by_category': {
           'query': """
                SELECT {group_sql} AS "{group_ref}", sum(price_unit * product_uom_qty)/1000000000 as category_sales
                FROM sale_order_line sol
                JOIN sale_order sor ON sor.id = sol.order_id
                JOIN res_company rco ON rco.id=sor.company_id
                JOIN sale_shop ssh ON ssh.id=sor.shop_id
                JOIN res_partner rpa ON rpa.id=sor.partner_id
                JOIN resource_resource rre ON rre.user_id = sor.user_id
                JOIN hr_employee hem ON hem.resource_id = rre.id
                LEFT JOIN hr_department hde ON hde.id = hem.department_id
                JOIN product_product ppr ON ppr.id = sol.product_id
                JOIN product_template pte ON pte.id = ppr.product_tmpl_id
                JOIN product_category pca ON pca.id = pte.categ_id
                where TRUE {generated}
                {group_by}
                {order_by}
                """,
           'defaults': {
                'group_by': ['product_category']
           }
        },           
                    
                    
    }


sale_order_line()