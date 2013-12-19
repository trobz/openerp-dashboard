#!/usr/bin/env python
# -*- coding: utf-8 -*-

from openerp import SUPERUSER_ID
from domain_converter import expression  
import copy
import re

import logging

# import sql parser if module is available
# sqlparse is used to have a nice debug SQL query, this module is optional
try:
    import sqlparse  
    sqlparse_available = True
except ImportError:
    logging.warn("dashboard: 'sqlparse' module not available, install it (pip install sqlparse) to have a formatted SQL query in debug mode.")
    sqlparse_available = False
 
class metrics():
    
    
    envelopes = {
        'query_date': """
            select date_trunc('{period}', gdate.gtime) as "{reference}", {output} from 
            (
                {query}
            ) AS result 
            right outer join (
                SELECT * FROM generate_series ( '{start}'::timestamp, '{end}', '{period_inc}') as gtime
            ) AS gdate ON result."{reference}" = date_trunc('{period}', gdate.gtime)
            group by date_trunc('{period}', gdate.gtime)
            {order}
            {limit}
            {offset}
            """,
            
        'query_string': """
            select result."{reference}" as {reference}, {output} from 
            (
                {query}
            ) AS result 
            group by result."{group}"
            {order}
            {limit}
            {offset}
            """
        
    }
    
    def count(self, cr, uid, ids, period={}, domain=[], group_by=[], order_by=[], limit="ALL", offset=0, debug=False, security_test=False, context=None):
        """
        Execute custom SQL queries to count results
        """
        
        result = { 'count': 0 }
        widgets = self.browse(cr, uid, ids, context=context)
        
        for widget in widgets:
            result = { 
                'count': self.count_metrics(cr, uid, ids, widget.metric_ids, period=period, domain=domain, group_by=group_by, order_by=order_by, context=context) 
            }
            
        return result
    
    
    def count_metrics(self, cr, uid, ids, metric_ids, period={}, domain=[], group_by=[], order_by=[], context=None):
        """
        get metric results count
        """
        count = 0
        
        if len(metric_ids) > 0:
            
            metric = metric_ids[0]
            is_graph_metrics = self.is_graph_metrics(metric_ids)
            
            is_date_group = False
            group = None
            if len(group_by) > 0:
                group = self.get_field(metric_ids[0], group_by[0])
                is_date_group = self.is_date_group(group)
            
            # for graph date, count == nb range in the period
            if is_graph_metrics and is_date_group:
                query = """SELECT count(date) FROM generate_series ( '%s'::timestamp, '%s', '%s') as date""" % (period['start'], period['end'], ("1 " + group.period if group.period != 'quarter' else "3 %s" % "month"))
                cr.execute(query)
                res = cr.fetchone()
                count = res[0]
            
            # for other graph, the full query has to be executed, not very nice for the perf...
            elif is_graph_metrics: 
                res, debug = self.exec_metrics(cr, uid, ids, metric_ids, period, domain, group_by, order_by, debug=False, security_test=False, context=context)  # @UnusedVariable
                for i,r in res.items():  # @UnusedVariable
                    count = len(r['results'])
                
            # for list, execute with select count(id) on the first metric (list widgets should never have more than 1 metric)
            elif metric.type == 'list':
                stacks = self.get_stacks(cr, uid, ids, [metric], period, domain, group_by, order_by)
                stack = stacks[metric.id]
                query = stack['query'] 
                if uid != SUPERUSER_ID:
                    query, warning, security_info = self.add_security_rule(cr, uid, stack, metric)  # @UnusedVariable
                    query = self.clean_query(query)
                
                
                count_pattern = re.compile(r"""(?uisx)^
                    (.*select).*
                    (
                        from
                        [ \n]+
                        [a-z0-9_\-\.]+
                        (?:\ as)?
                        [ \n]+
                        ([a-z0-9_\-\.]+)
                        [ \n]+.*
                    )$""")
                
                query = count_pattern.sub('\\1 count(\\3.id) \\2', query)
                cr.execute(query)
                res = cr.fetchone()
                count = res[0]
         
        return count
    
    
    def execute(self, cr, uid, ids, period={}, domain=[], group_by=[], order_by=[], limit="ALL", offset=0, debug=False, security_test=False, context=None):
        """
        Execute custom SQL queries to populate a dashboard widget
        """
        
        
        result = {}
        widgets = self.browse(cr, uid, ids, context=context)
        
        for widget in widgets:
            stacks = self.get_stacks(cr, uid, ids, widget.metric_ids, period=period, domain=domain, group_by=group_by, order_by=order_by, limit=limit, offset=offset, debug=debug, security_test=security_test, context=context) 
            res, res_debug = self.execute_stacks(cr, uid, widget.metric_ids, stacks, debug=debug, security_test=security_test, context=context)
            result[widget.id] = res
            if debug: 
                result[widget.id]['debug'] = {
                    'message': 'queries on widget %s' % (widget.name),
                    'queries': res_debug 
                }
            
            
        return result
    
                 
    
    def get_stacks(self, cr, uid, ids, metric_ids, period={}, domain=[], group_by=[], order_by=[], limit="ALL", offset=0, debug=False, security_test=False, context=None):
        """
        Execute metrics SQL queries
        """
        
        stacks = {}
        is_graph_metrics = self.is_graph_metrics(metric_ids)
        order_tmp = order_by
        
        for metric in metric_ids:
            model = self.pool.get(metric.model.model)
            
            query, params, defaults, no_result = self.get_query(model, metric)
        
            if is_graph_metrics:
                order_by = order_tmp
                self.set_stack_globals(metric, defaults, stacks, period, group_by, order_by, limit, offset)
                # in graph mode, order will be applied to the global query 
                order_tmp = order_by
                order_by = []
                #FIXME: should not disable the limit and offset on sub queries but it"s required if the ordering is different on sub queries and main query...
                limit = 'ALL'
                offset = 0
            
            args = self.defaults_arguments(defaults, group_by, order_by, limit, offset)
            fields_domain, fields_args = self.convert_fields(metric, domain, args) 
            fields_domain = self.add_period(period, fields_domain, metric)
            query, domain_params = self.process_query(query, fields_domain, fields_args);
                    
            params = params + domain_params
            
            stacks[metric.id] = {
                'query': query,
                'params': params,
                'no_result': no_result,
                'args':  fields_args,
                'output': self.extract_aggregate_field(metric, query),
                'metric': metric
            }
            
        return stacks
    
    
    def set_stack_globals(self, metric, defaults, stacks, period, group_by, order_by, limit, offset):
        group = copy.copy(defaults['group_by']) if 'group_by' in defaults and len(group_by) == 0 else copy.copy(group_by)
        order = copy.copy(order_by)
        
        if len(group) <= 0:
            raise Exception('graph metric require a group_by')
            
            
        # apply order by group for graph by default
        if len(order) <= 0:
            order.append(group[0] + ' ASC')
       
        stacks['global'] = {
            'limit': limit,
            'offset': offset,
            'period': period
        } if not 'global' in stacks else stacks['global'] 
        
        try:
            stacks['global']['order'] = self.convert_order(metric, order[0]) if 'order' not in stacks['global'] else stacks['global']['order']
        except:
            pass
        
        try:
            stacks['global']['group'] = self.convert_group(metric, group[0]) if 'group' not in stacks['global']  else stacks['global']['group']
        except:
            pass
        
    def add_period(self, period, fields_domain, metric):
        """
        add a period to the domain if possible
        """
        period_field = self.get_field_by_type(metric, 'period')
        if len(period) == 2 and period_field:
            fields_domain.append([period_field, '>=', period['start']])
            fields_domain.append([period_field, '<', period['end']])
        return fields_domain
        
    def process_query(self, query, domain, arguments):
        """
        create query and parameters for psycopg2 
        """
        
        group = arguments['group'][0] if len(arguments['group']) > 0 else None
        group_sql = group.sql_name if group else ""
        group_ref = group.reference if group else ""
        
        sql_domain, sql_args = self.to_sql(domain, arguments) 
    
        e = expression(sql_domain)
        domain_query, domain_params = e.to_sql()
            
        query = query.format(** {'generated': domain_query, 'group_sql': group_sql, 'group_ref': group_ref})
        
        query = '%s GROUP BY %s' % (query, ','.join(sql_args['group'])) if len(sql_args['group']) > 0 else query
        query = '%s ORDER BY %s' % (query, ','.join(sql_args['order'])) if len(sql_args['order']) > 0 else query
        query = '%s LIMIT %s' % (query, sql_args['limit']) if sql_args['limit'] is not None else query
        query = '%s OFFSET %s' % (query, sql_args['offset']) if sql_args['offset'] is not None else query
        
        return query, domain_params
    
    def execute_stacks(self, cr, uid, metric_ids, stacks, debug=False, security_test=False, context=None):
        result = {}
        debug_result = []
        warning = []
        security_info = []
        
        is_graph_metrics = self.is_graph_metrics(metric_ids)
            
        # add security rules
        for metric_id, stack in stacks.items():
            if metric_id != 'global':
                # security_test can not be enabled if debug mode is not True too
                security_test = security_test if debug else False
                if uid != SUPERUSER_ID or security_test:
                    stack['query'], warning, security_info = self.add_security_rule(cr, uid, stack['query'], stack['metric'], warning, security_info, security_test)
                stack['query'] = self.clean_query(stack['query'])
                    
        # execute one query in UNION for all metrics
        if is_graph_metrics:

            global_args = stacks['global']
            order = global_args['order']
            group = global_args['group']
            period = global_args['period']
            limit = global_args['limit']
            offset = global_args['offset']
            del stacks['global']
            
            # rebuild output parameters
            outputs = []
            query_outputs = {}
            queries = []
            params = []
            order_ref_id = order[0].reference

            for metric_id, stack in stacks.items():
                no_result = stack['no_result']
                output_ref = stack['output'].reference
                output_ref_id = "%s_%s" % (output_ref, metric_id)
                if order[0].reference == output_ref:
                    order_ref_id = output_ref_id

                outputs.append('coalesce(max(result."%s"), %s) as "%s"' % (output_ref_id, no_result, output_ref_id))
                query_outputs[metric_id] = 'NULL::integer as "%s"' % (output_ref_id)
            
            
            for metric_id, stack in stacks.items():
                queries.append('\n(' + self.replace_outputs(stack['query'], query_outputs, metric_id) + '\n)')
                params += stack['params']
            
            
            if group and group.period and group.field_description['type'] in ['date', 'datetime']:
                
                order_by = ''
                if order:
                    order_by = "ORDER BY date_trunc('%s', gdate.gtime) %s" % (order[0].period, order[1]) if order[0].period else 'ORDER BY max(result."%s") %s NULLS LAST' % (order_ref_id, order[1])
                    
                query = self.envelopes['query_date'].format(** {
                  "start": period['start'],
                  "end": period['end'],
                  "reference": group.reference,
                  "period": group.period,
                  "period_inc": "1 %s" % group.period if group.period != 'quarter' else "3 %s" % "month",
                  "output": ', '.join(outputs),
                  "order": order_by,
                  "limit": "LIMIT %s" % (limit), 
                  "offset": "OFFSET %s" % (offset), 
                  "query": '\nUNION ALL\n'.join(queries)
                })
                
            else:
                
                query = self.envelopes['query_string'].format(** {
                  "reference": group.reference,
                  "output": ', '.join(outputs),
                  "query": '\nUNION ALL\n'.join(queries),
                  "group": group.reference,
                  "limit": "LIMIT %s" % (limit), 
                  "offset": "OFFSET %s" % (offset), 
                  "order": 'ORDER BY max(result."%s") %s NULLS LAST' % (order_ref_id, order[1]) if order else ""
                })

            cr.execute(query, params)
   
            fetch = cr.dictfetchall()
            
            columns_index = {}
            for column in cr.description:
                columns_index[column.name] = column

            metric_names = []
            group_ref = group.reference
            for metric_id, stack in stacks.items():
                output_ref = stack['output'].reference
                output_ref_id = "%s_%s" % (output_ref, metric_id)

                desc = []
                desc.append(columns_index[group_ref])
                desc.append(columns_index[output_ref_id])
              
                res = []
                for item in fetch:
                    data = {}
                    data[group_ref] = item[group_ref]
                    data[output_ref] = item[output_ref_id]
                    res.append(data)
                
                result[metric_id] = {'columns': desc, 'results': res}
                metric_names.append(stack['metric'].name)
            
            if debug:     
                sql = cr.mogrify(query, params)
                
                if sqlparse_available:
                    sql = sqlparse.format(sql, reindent=True, keyword_case='upper')
                    
                debug_result.append({ 
                    'message': ', '.join(metric_names), 
                    'warning': warning,
                    'security_info': security_info,
                    'query' : sql 
                })
                
                 
                
        # execute each metric separately
        else:
        
            for metric_id, stack in stacks.items():
                
                cr.execute(stack['query'], stack['params'])
             
                result[metric_id] = {'columns': cr.description, 'results': cr.dictfetchall()}
                    
                if debug:
                    sql = cr.mogrify(stack['query'], stack['params'])
                
                    if sqlparse_available:
                        sql = sqlparse.format(sql, reindent=True, keyword_case='upper')
                
                    debug_result.append({
                        'message': stack['metric'].name,
                        'warning': warning,
                        'security_info': security_info,
                        'query' : sql
                    })
    
        return result, debug_result
    
    
    def clean_query(self, sql):
        
        """
        clean up a SQL query from useless joins, keep join dependencies
        """
        
        def add_joins(add_join, joins, aliases):
            """
            add joins and their join dependencies    
            """
            aliases.append(add_join[3])    
            condition_pattern = re.compile(r"""(?uis)
                    (?:[ ]+)?
                    (?:[a-z0-9'"_\-\.]+)
                    (?:[ =]+)
                    (?:[a-z0-9'"_\-\.]+)
                    (?:[ ]+)?
                    (?:and|or)?
                """, re.X|re.U)
            conditions = condition_pattern.findall(add_join[4])
            
            for condition in conditions:
                dependency_pattern = re.compile('(?ui)[ =]+((?![ ]*' + add_join[3] + ').*?)\.')
                dep = dependency_pattern.findall(condition)
        
                if len(dep) > 0:
                    for join in joins:
                        if join[3] == dep[0]:
                            aliases = add_joins(join, joins, aliases)    
            return list(set(aliases))
    
    
        detail_pattern = re.compile(r"""(?uis)
        (?P<join>
            (?:natural[ ]+)?
            (?:inner[ ]+)?
            (?:left|right|full)?
            (?:[ ]+outer)?
            [ ]* (?:join) [ ]*
            (?P<except>
                required
            )?[ ]+
            (?P<table>
                [a-z0-9'"_\-\.]+
            )
            (?:[ ]+as)? [ ]+
            (?P<alias>
                [a-z0-9'"_\-\.]+
            )
            [ ]+on
            (?P<condition>
                (?:
                    (?:[ ]+)?
                    (?:[a-z0-9'"_\-\.]+)
                    (?:[ =]+)
                    (?:[a-z0-9'"_\-\.]+)
                    (?:[ ]+)?
                    (?:and|or)?
                )+
            )
            (?:\n)?
        )""", re.X|re.U)            
        joins_pattern = re.compile(r"""(?uis)
        ^
         (?P<start>.*?from.*?)
         (?P<joins>
            (?:natural[ ]+)?(?:inner[ ]+)?(?:left|right|full)?(?:[ ]+outer)?[ ]*
            (?:join.*?)
         )
         (?P<end>(?:where|group\ by|order\ by|$).*)
        $

        """, re.X|re.U)
        
        
        extract_joins = joins_pattern.search(sql)
        
        if extract_joins:
            parts = extract_joins.groups()
            query_start = parts[0]
            query_end = parts[2]
            query_without_joins = query_start + query_end
        
            joins = detail_pattern.findall(sql)
            required_aliases = []
        
        
            for join in joins:
                alias_pattern = re.compile(join[3] + '\.')
                alias_found = alias_pattern.search(query_without_joins)
                if alias_found or len(join[1]):
                    required_aliases = add_joins(join, joins, required_aliases)
        
            clean_pattern = re.compile(r"""(?ui)(required )""")
            cleaned_joins = []
            for join in joins:
                if any(join[3] in a for a in required_aliases):
                    cleaned_joins.append(clean_pattern.sub(u'',join[0]))
                    
            sql = query_start + "\n" +  ''.join(cleaned_joins) + "\n" + query_end
        
        return sql
    

    
    def replace_outputs(self, query, outputs, metric_id):
        """
        rebuild query with parameters slot for other queries, required for UNION
        """
        
        pattern = re.compile(r"""(?uis)^(.*select .* as [^,]+),(.* as [a-z0-9_'"]+)(.*from.*)""")
        matches = pattern.match(query)
        
        fields = []
        for mid, output in outputs.items():
            if mid == metric_id:
                field = "%s_%s" % (matches.group(2), metric_id)
                fields.append(field)
            else:
                fields.append(output)
        
        return pattern.sub(u'\\1,' + ','.join(fields) + '\\3', query)
     
        
    def extract_aggregate_field(self, metric, query):
        """
        extract the last output field, used for graph metrics
        """
        
        pattern = re.compile(r"""(?uis)^.*select .* as (?:['"])?([a-z0-9_]+)(?:['"])?.*from""")
        matches = pattern.match(query)
        
        if not matches or  matches.lastindex < 1:
            raise Exception('can not get the last output field on metric "%s"' % (metric.name))
        
        
        return self.get_field(metric, matches.group(1))    
        
    def to_sql(self, domain, arguments):
        """
        convert domain and arguments to field name
        """
        
        converted_domain = []
        for criteria in domain:
            if len(criteria) == 3:
                clone = copy.copy(criteria)
                clone[0] = clone[0].sql_name
                converted_domain.append(clone)
            else:
                converted_domain.append(copy.copy(criteria))
         
        converted_args = {
           'group': [],
           'order': [],
           'limit': arguments['limit'],
           'offset': arguments['offset']
        }
        
        for group in arguments['group']:
            converted_args['group'].append(group.sql_name)
         
        for order in arguments['order']:
            converted_args['order'].append(order[0].sql_name + ' ' + order[1])
        
        
        self.validate_arguments(converted_args)
         
        return converted_domain, converted_args       
        
    
    def convert_fields(self, metric, domain, arguments):
        """
        convert all field reference to field object
        """
             
        converted_domain = []
        for criteria in domain:
            try:
                if len(criteria) == 3:
                    clone = copy.copy(criteria)
                    clone[0] = self.get_field(metric, clone[0])
                    converted_domain.append(clone)
                else:
                    converted_domain.append(copy.copy(criteria))
            except Exception as e:
                logging.warning(e)
                pass
            
        converted_args = {
           'group': [],
           'order': [],
           'limit': arguments['limit'],
           'offset': arguments['offset']
        }
        
        for group in arguments['group']:
            converted_args['group'].append(self.convert_group(metric, group))
         
        for order in arguments['order']:
            converted_args['order'].append(self.convert_order(metric, order))
         
        return converted_domain, converted_args;       
     
       
    def convert_group(self, metric, group_by):
        return self.get_field(metric, group_by)
     
    def convert_order(self, metric, order_by):
        pattern = re.compile(r"""(?ui)^([a-z0-9_-]+) (ASC|DESC)$""")
        matches = pattern.match(order_by)
        if not matches or matches.lastindex < 2:
            raise Exception('can not get field reference from order "%s"' % (order_by))
        return [self.get_field(metric, matches.group(1)), matches.group(2)]
    
    
    def get_field_by_type(self, metric, field_type):
        """
        get a field object based on field type
        """
        for metric_field in metric.field_ids:
            if field_type in metric_field.type_names:
                return metric_field
        return None
    
    def get_field(self, metric, field_reference):
        """
        get a field object based on the field reference
        """
        for metric_field in metric.field_ids:
            if metric_field.reference == field_reference:
                return metric_field
        raise Exception('field reference "%s" is not associated with metric "%s"' % (field_reference,metric.name))
        
    
    def get_query(self, model, metric):
        """
        get the query to execute and all default parameters
        """
        
        if not hasattr(model, '_metrics_sql') or not metric.query_name in model._metrics_sql:
            raise Exception('"%s" is not defined in model._metrics_sql' % (metric.query_name,))
    
        query = model._metrics_sql[metric.query_name]
        
        params = query['params'] if isinstance(query, dict) and 'params' in query else [] 
        defaults = query['defaults'] if isinstance(query, dict) and 'defaults' in query else {}
        sql_query = query['query'] if isinstance(query, dict) and 'query' in query else query
        no_result = query['no_result'] if isinstance(query, dict) and 'no_result' in query else 'null::integer'
   
        return sql_query, params, defaults, no_result
   
    
    def defaults_arguments(self, defaults, group_by, order_by, limit, offset):
        """
        set default parameters if necessary
        """
        
        arguments = {}
        arguments['group'] = copy.copy(defaults['group_by']) if 'group_by' in defaults and len(group_by) == 0 else copy.copy(group_by)
        arguments['order'] = copy.copy(defaults['order_by']) if 'order_by' in defaults and len(order_by) == 0 else copy.copy(order_by)
        arguments['limit'] = defaults['limit'] if 'limit' in defaults and limit == "ALL" else limit
        arguments['offset'] = defaults['offset'] if 'offset' in defaults and offset == 0 else offset
          
        return arguments;
    
    
    def validate_arguments(self, arguments):
        """
        validate fields and prevent SQL Injection...
        """
        
        pattern = re.compile(r"""(?ui)^(
                                    (?:
                                        (?:date_trunc\([\ ]*[a-z'"]+[\ ]*,[\ ]*[a-z0-9_'"\.]+[\ ]*\)){1} # extract on value
                                        (?:\ asc|\ desc)? # required for order
                                    )        
                                    |
                                    (?:[^\s]+(?:\ asc|\ desc)?)  # any groups, space not allowed
                                 )$""", re.X|re.U)
        
        for group in arguments['group']:
            if pattern.match(group) is None and pattern.match(group) is None:
                raise Exception('group "%s" is not valid' % (group, ))
            
        for order in arguments['order']:
            if pattern.match(order) is None and pattern.match(order) is None:
                raise Exception('order "%s" is not valid' % (order, ))
        
        if not (isinstance(arguments['limit'], int) or arguments['limit'] == "ALL"):
            raise Exception('limit is not an integer or is not "ALL"')
        
        if not isinstance(arguments['offset'], int):
            raise Exception('offset is not an integer')
        
        return True
    
    
    def is_graph_metrics(self, metrics):
        """
        check if a collection of metrics are all graph type
        """
        
        for metric in metrics:
            if metric.type != "graph":
                return False
        
        return True
    
    def is_date_group(self, field):
        """
        check if the group by is by date
        """
        
        return field.period and field.field_description['type'] in ['date', 'datetime']
    
    
    def add_security_rule(self, cr, uid, query, metric, warning=[], security_info=[], security_test=False):
        
        # get models used by the query
        models = self.extract_models(query)
        model_ids = self.get_model_ids(cr, models)
        
        if len(model_ids) > 0:
            
            # get global security rules
            cr.execute("""
                SELECT DISTINCT identifier 
                FROM ir_rule
                WHERE identifier IS NOT NULL
                AND global = %s
                AND model_id IN %s 
            """, (True, model_ids))
            global_rules = cr.fetchall()
            
            if security_test:
                # check if some potential required rules have no identifier
                cr.execute("""
                    SELECT DISTINCT ir.id, ir.name 
                    FROM ir_rule as ir
                    WHERE ir.identifier IS NULL 
                    AND ir.model_id IN %s
                """, (model_ids, ))
                
                no_identifier = cr.fetchall()
                for no_id_rule in no_identifier:
                    warning.append('rule "%s" with id "%s" should be used but has no identifier' % (no_id_rule[1], no_id_rule[0]))
                
                
                # get rules in groups without user restriction
                cr.execute("""
                    SELECT DISTINCT ir.identifier 
                    FROM ir_rule as ir
                    JOIN rule_group_rel as rgr on rgr.rule_group_id = ir.id
                    WHERE ir.identifier IS NOT NULL 
                    AND ir.model_id IN %s
                """, (model_ids, ))
                  
            else:
                # get user security rules
                cr.execute("""
                    SELECT DISTINCT ir.identifier 
                    FROM ir_rule as ir
                    JOIN rule_group_rel as rgr on rgr.rule_group_id = ir.id
                    JOIN res_groups as g on rgr.group_id = g.id
                    JOIN res_groups_users_rel as gur on gur.gid = g.id
                    JOIN res_users as u on gur.uid = u.id
                    WHERE ir.identifier IS NOT NULL
                    AND ir.model_id IN %s
                    AND u.id = %s
                """, (model_ids, uid))
            
            local_rules = cr.fetchall()
            
            
            # get sql rules from identifiers
            base_model = self.pool.get(metric.model.model)
            if not hasattr(base_model, '_metrics_sql') or not metric.query_name in base_model._metrics_sql:
                raise Exception('"%s" is not defined in model._metrics_sql' % (metric.query_name,))
            
            sql_rules = base_model._metrics_sql[metric.query_name]['security'] if 'security' in base_model._metrics_sql[metric.query_name] else []
            
            and_clauses = []
            or_clauses = []
        
            
            for rule in global_rules:
                rule = rule[0]
                if rule in sql_rules:
                    security_info.append('global security rule "%s" tested on model: "%s", query_name: "%s"' % (rule, metric.model.model, metric.query_name))
                    and_clauses.append(sql_rules[rule])
                else:
                    warning.append('global security rule "%s" not implemented on model: "%s", query_name: "%s"' % (rule, metric.model.model, metric.query_name))
            
            for rule in local_rules:
                rule = rule[0]
                if rule in sql_rules:
                    security_info.append('local security rule "%s" tested on model: "%s", query_name: "%s"' % (rule, metric.model.model, metric.query_name))
                    or_clauses.append(sql_rules[rule])
                else:
                    warning.append('user security rule "%s" not implemented on model: "%s", query_name: "%s"' % (rule, metric.model.model, metric.query_name))
            
            and_sql = " AND ".join(and_clauses) if len(and_clauses) > 0 else '1 = 1'
            or_sql = " OR ".join(or_clauses) if len(or_clauses) > 0 else '1 = 1'
            rules =  """/*[rules: */ ( %s AND ( %s) ) /*]*/ AND""" % (and_sql, or_sql)
            
            # replace dynamic parameters
            rules = self.replace_rules_parameters(cr, uid, rules)
            
            inject_pattern = re.compile(r"""(?ui)(where)""")
            query = inject_pattern.sub("""\\1 %s """ % rules, query)
        
        return query, warning, security_info
    
    def replace_rules_parameters(self, cr, uid, rules):
        """
        replace dynamic parameters in rules sql clauses
        """
        
        #TOTO: for now, we explicitly list all available parameters, because some of them require special queries (ie. child_of category)
        data_params = self.get_dynamic_parameters(cr, uid)
        
        pattern = re.compile(r"""(?iu)%(.*?)%""")
        sql_params = pattern.findall(rules)
        
        for sql_param in sql_params:
            if sql_param not in data_params:
                raise Exception('dynamic parameter "%s" is not available' % (sql_param, ))
            replace = re.compile("(?iu)%" + sql_param + "%")
            rules = replace.sub(data_params[sql_param], rules)
       
        return rules
    
    def get_dynamic_parameters(self, cr, uid):
        params = {}
        
        user_model = self.pool.get('res.users')
        
        # user superuser to bypass security rules
        users = user_model.browse(cr, SUPERUSER_ID, [uid])
        if len(users) != 1:
            raise Exception('can not retrieve user based on user id "%s"' % (uid, ))
        user = users[0]
        
        # user children companies
        company_model = self.pool.get('res.company')
        ids = company_model.search(cr, uid, [('id', 'child_of', user.company_id.id)]) 
        params['user.company_id.child'] = ', '.join(str(company_id) for company_id in ids)
        
        # user groups
        group_model = self.pool.get('res.groups')
        ids = group_model.search(cr, uid, [('users', '=', user.id)])
        params['user.groups_id'] = ', '.join(str(group_id) for group_id in ids)
        
        # user partners  
        params['user.partner_id.id'] = str(user.partner_id.id) 
        
        # user properties
        #TODO: get all user simple columns has potential parameters
        columns = ['id', 'name', 'login', 'active']
        for column in columns:
            params['user.' + column] = str(user[column])
        
        return params
        
    def get_model_ids(self, cr, models):
        names = tuple(models.keys())
        res = []
        if len(names) > 0:
            cr.execute("""SELECT id FROM ir_model WHERE model IN %s;""", (names, ))
            res = cr.fetchall()
            
        return tuple(res)
        
    def extract_models(self, query):
        """
        get all models used in the query
        """
        pattern = re.compile(r"""(?iu)(?:from|join){1}(?:[ ]+required)?[ ]+([a-z0-9_\-\.]+)[ ]+""")
        tables = pattern.findall(query)
        
        models = {}
        
        for table in tables:
            name, model = self.get_model(table)
            if name and model:
                models[name] = model
        return models
        
    
    def get_model(self, table):
        """
        get a model from a table name
        """
        search = None
        models = self.pool.models
        for name, model in models.items():
            if model._table == table:
                search = (name, model)
        return search
    
    
    def exec_metrics(self, cr, uid, ids, metric_ids, period={}, domain=[], group_by=[], order_by=[], limit="ALL", offset=0, debug=False, security_test=False, context=None):
        """
        method used to test get_stacks + execute_stacks methods...
        """
        stacks = self.get_stacks(cr, uid, ids, metric_ids, period=period, domain=domain, group_by=group_by, order_by=order_by, limit=limit, offset=offset, debug=debug, security_test=security_test, context=context) 
        return self.execute_stacks(cr, uid, metric_ids, stacks, debug=debug, security_test=security_test, context=context)
    
metric_support = metrics

