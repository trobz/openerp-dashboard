# -*- coding: utf-8 -*-

from openerp.osv import osv
from os import path
import psutil

class dashboard_widget(osv.osv):

    _inherit = "dashboard.widget"

    def custom_execute(self, cr, uid, ids, period={}, domain=[], group_by=[], order_by=[], limit="ALL", offset=0, debug=False, security_test=False, context=None):
        """
        Demo: custom method to execute widget metrics.
        
        Read values from a text file, maybe a little bit dirty but it just for the POC.
        
        Note: 
        This method is only used for demo, by a specific widget associated with well known metrics and fields.
        The response has to follow the same format than the default `execute` method.
        """

        response = {}
        
        current_path = path.dirname(path.realpath(__file__))
        source_file = current_path + '/../data/custom_method_data.txt'
        data = [[i for i in line.split()] for line in open(source_file)]
        
        columns = [{'name': 'custom_name'}, {'name': 'custom_value'}]
        results = [{columns[i]['name']:val for i, val in enumerate(line)} for line in data]
        
        for widget in self.browse(cr, uid, ids, context=context):
            response[widget.id] = {}
            for metric in widget.metric_ids:
                
                response[widget.id][metric.id] = {
                    'columns': columns,
                    'results': results,
                }
            
                if debug:
                    response[widget.id]['debug'] = {
                        'message': 'read text file %s with %s results for widget %s' % (source_file, len(data), widget.name)
                    }
                     
            
        return response

    def metric_free_space(self, cr, uid, ids, period={}, domain=[], group_by=[], order_by=[], limit="ALL", offset=0, debug=False, security_test=False, context=None):
        """
        Demo: custom method to execute widget metrics.
        
        Get info about server hard disk usage 
        """
        response = {}
        columns = [{'name': 'type'}, {'name': 'space'}]
        
        results = [
                { 'type': 'used (fake, please, install psutil)', 'space': 100000000},
                { 'type': 'free (fake, please, install psutil)', 'space': 1000000000},
            ]
        
        try:
            partitions = psutil.disk_partitions()
            if len(partitions) > 0:
                usage = psutil.disk_usage(psutil.disk_partitions()[0][1])
                results = [
                    { 'type': 'used space (%s)' % psutil.disk_partitions()[0][0], 'space': usage[1]},
                    { 'type': 'free space (%s)' % psutil.disk_partitions()[0][0], 'space': usage[2]},
                ]
        
        except:
            # We use the default result. fake result, because it's a demo... but it's cool to have the real value, please install psutil ;)
            pass
            
        for widget in self.browse(cr, uid, ids, context=context):
            response[widget.id] = {}
            for metric in widget.metric_ids:
                
                response[widget.id][metric.id] = {
                    'columns': columns,
                    'results': results,
                }
                if debug:
                    response[widget.id]['debug'] = {
                        'message': 'get disk usage for widget %s' % widget.name
                    }
                     
            
        return response


dashboard_widget()


# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:

