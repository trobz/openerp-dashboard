#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging

from openerp.tools import misc

#.apidoc title: Domain Expressions

# Domain operators.
NOT_OPERATOR = '!'
OR_OPERATOR = '|'
AND_OPERATOR = '&'
DOMAIN_OPERATORS = (NOT_OPERATOR, OR_OPERATOR, AND_OPERATOR)

# List of available term operators. It is also possible to use the '<>'
# operator, which is strictly the same as '!='; the later should be prefered
# for consistency. This list doesn't contain '<>' as it is simpified to '!='
# by the normalize_operator() function (so later part of the code deals with
# only one representation).
# An internal (i.e. not available to the user) 'inselect' operator is also
# used. In this case its right operand has the form (subselect, params).
TERM_OPERATORS = ('=', '!=', '<=', '<', '>', '>=', '=?', '=like', '=ilike',
                  'like', 'not like', 'ilike', 'not ilike', 'in', 'not in',
                  'child_of')

# A subset of the above operators, with a 'negative' semantic. When the
# expressions 'in NEGATIVE_TERM_OPERATORS' or 'not in NEGATIVE_TERM_OPERATORS' are used in the code
# below, this doesn't necessarily mean that any of those NEGATIVE_TERM_OPERATORS is
# legal in the processed term.
NEGATIVE_TERM_OPERATORS = ('!=', 'not like', 'not ilike', 'not in')

TRUE_LEAF = (1, '=', 1)
FALSE_LEAF = (0, '=', 1)

TRUE_DOMAIN = [TRUE_LEAF]
FALSE_DOMAIN = [FALSE_LEAF]

_logger = logging.getLogger(__name__)


# --------------------------------------------------
# Generic domain manipulation
# --------------------------------------------------

def normalize_domain(domain):
    """Returns a normalized version of ``domain_expr``, where all implicit '&' operators
       have been made explicit. One property of normalized domain expressions is that they
       can be easily combined together as if they were single domain components.
    """
    assert isinstance(domain, (list, tuple)), "Domains to normalize must have a 'domain' form: a list or tuple of domain components"
    if not domain:
        return TRUE_DOMAIN
    result = []
    expected = 1                            # expected number of expressions
    op_arity = {NOT_OPERATOR: 1, AND_OPERATOR: 2, OR_OPERATOR: 2}
    for token in domain:
        if expected == 0:                   # more than expected, like in [A, B]
            result[0:0] = [AND_OPERATOR]             # put an extra '&' in front
            expected = 1
        result.append(token)
        if isinstance(token, (list, tuple)):  # domain term
            expected -= 1
        else:
            expected += op_arity.get(token, 0) - 1
    assert expected == 0, 'This domain is syntactically not correct: %s' % (domain)
    return result


def combine(operator, unit, zero, domains):
    """Returns a new domain expression where all domain components from ``domains``
       have been added together using the binary operator ``operator``. The given
       domains must be normalized.

       :param unit: the identity element of the domains "set" with regard to the operation
                    performed by ``operator``, i.e the domain component ``i`` which, when
                    combined with any domain ``x`` via ``operator``, yields ``x``.
                    E.g. [(1,'=',1)] is the typical unit for AND_OPERATOR: adding it
                    to any domain component gives the same domain.
       :param zero: the absorbing element of the domains "set" with regard to the operation
                    performed by ``operator``, i.e the domain component ``z`` which, when
                    combined with any domain ``x`` via ``operator``, yields ``z``.
                    E.g. [(1,'=',1)] is the typical zero for OR_OPERATOR: as soon as
                    you see it in a domain component the resulting domain is the zero.
       :param domains: a list of normalized domains.
    """
    result = []
    count = 0
    for domain in domains:
        if domain == unit:
            continue
        if domain == zero:
            return zero
        if domain:
            result += domain
            count += 1
    result = [operator] * (count - 1) + result
    return result


def AND(domains):
    """AND([D1,D2,...]) returns a domain representing D1 and D2 and ... """
    return combine(AND_OPERATOR, TRUE_DOMAIN, FALSE_DOMAIN, domains)


def OR(domains):
    """OR([D1,D2,...]) returns a domain representing D1 or D2 or ... """
    return combine(OR_OPERATOR, FALSE_DOMAIN, TRUE_DOMAIN, domains)


def distribute_not(domain):
    """ Distribute any '!' domain operators found inside a normalized domain.

    Because we don't use SQL semantic for processing a 'left not in right'
    query (i.e. our 'not in' is not simply translated to a SQL 'not in'),
    it means that a '! left in right' can not be simply processed
    by __leaf_to_sql by first emitting code for 'left in right' then wrapping
    the result with 'not (...)', as it would result in a 'not in' at the SQL
    level.

    This function is thus responsible for pushing any '!' domain operators
    inside the terms themselves. For example::

         ['!','&',('user_id','=',4),('partner_id','in',[1,2])]
            will be turned into:
         ['|',('user_id','!=',4),('partner_id','not in',[1,2])]

    """
    def negate(leaf):
        """Negates and returns a single domain leaf term,
        using the opposite operator if possible"""
        left, operator, right = leaf
        mapping = {
            '<': '>=',
            '>': '<=',
            '<=': '>',
            '>=': '<',
            '=': '!=',
            '!=': '=',
        }
        if operator in ('in', 'like', 'ilike'):
            operator = 'not ' + operator
            return [(left, operator, right)]
        if operator in ('not in', 'not like', 'not ilike'):
            operator = operator[4:]
            return [(left, operator, right)]
        if operator in mapping:
            operator = mapping[operator]
            return [(left, operator, right)]
        return [NOT_OPERATOR, (left, operator, right)]

    def distribute_negate(domain):
        """Negate the domain ``subtree`` rooted at domain[0],
        leaving the rest of the domain intact, and return
        (negated_subtree, untouched_domain_rest)
        """
        if is_leaf(domain[0]):
            return negate(domain[0]), domain[1:]
        if domain[0] == AND_OPERATOR:
            done1, todo1 = distribute_negate(domain[1:])
            done2, todo2 = distribute_negate(todo1)
            return [OR_OPERATOR] + done1 + done2, todo2
        if domain[0] == OR_OPERATOR:
            done1, todo1 = distribute_negate(domain[1:])
            done2, todo2 = distribute_negate(todo1)
            return [AND_OPERATOR] + done1 + done2, todo2
    if not domain:
        return []
    if domain[0] != NOT_OPERATOR:
        return [domain[0]] + distribute_not(domain[1:])
    if domain[0] == NOT_OPERATOR:
        done, todo = distribute_negate(domain[1:])
        return done + distribute_not(todo)



def normalize_leaf(element):
    """ Change a term's operator to some canonical form, simplifying later
        processing. """
    if not is_leaf(element):
        return element
    left, operator, right = element
    original = operator
    operator = operator.lower()
    if operator == '<>':
        operator = '!='
    if isinstance(right, bool) and operator in ('in', 'not in'):
        _logger.warning("The domain term '%s' should use the '=' or '!=' operator." % ((left, original, right),))
        operator = '=' if operator == 'in' else '!='
    if isinstance(right, (list, tuple)) and operator in ('=', '!='):
        _logger.warning("The domain term '%s' should use the 'in' or 'not in' operator." % ((left, original, right),))
        operator = 'in' if operator == '=' else 'not in'
    return left, operator, right


def is_operator(element):
    """ Test whether an object is a valid domain operator. """
    return isinstance(element, basestring) and element in DOMAIN_OPERATORS


def is_leaf(element, internal=False):
    """ Test whether an object is a valid domain term:
        - is a list or tuple
        - with 3 elements
        - second element if a valid op

        :param tuple element: a leaf in form (left, operator, right)
        :param boolean internal: allow or not the 'inselect' internal operator
            in the term. This should be always left to False.

        Note: OLD TODO change the share wizard to use this function.
    """
    INTERNAL_OPS = TERM_OPERATORS + ('<>',)
    if internal:
        INTERNAL_OPS += ('inselect',)
    return len(element) == 3 \
        and element[1] in INTERNAL_OPS




class Leaf(object):

    def __init__(self, leaf):
        """ Initialize the ExtendedLeaf

            :attr [string, tuple] leaf: operator or tuple-formatted domain
                expression
            :attr obj model: current working model
            :attr list _models: list of chained models, updated when
                adding joins
            :attr list join_context: list of join contexts. This is a list of
                tuples like ``(lhs, table, lhs_col, col, link)``

                where

                lhs
                    source (left hand) model
                model
                    destination (right hand) model
                lhs_col
                    source model column for join condition
                col
                    destination model column for join condition
                link
                    link column between source and destination model
                    that is not necessarily (but generally) a real column used
                    in the condition (i.e. in many2one); this link is used to
                    compute aliases
        """
        self.leaf = leaf
        # normalize the leaf's operator
        self.normalize_leaf()
        # check validity
        self.check_leaf()

    def __str__(self):
        return '<osv.Leaf: %s>' % (str(self.leaf))

    # --------------------------------------------------
    # Leaf manipulation
    # --------------------------------------------------

    def check_leaf(self):
        if not is_operator(self.leaf) and not is_leaf(self.leaf, True):
            raise ValueError("Invalid leaf %s" % str(self.leaf))

    def is_operator(self):
        return is_operator(self.leaf)

    def is_true_leaf(self):
        return self.leaf == TRUE_LEAF

    def is_false_leaf(self):
        return self.leaf == FALSE_LEAF

    def is_leaf(self, internal=False):
        return is_leaf(self.leaf, internal=internal)

    def normalize_leaf(self):
        self.leaf = normalize_leaf(self.leaf)
        return True



class expression(object):
    """ Parse a domain expression
        Use a real polish notation
        Leafs are still in a ('foo', '=', 'bar') format
        For more info: http://christophe-simonis-at-tiny.blogspot.com/2008/08/new-new-domain-notation.html
    """

    def __init__(self, exp):
        """ Initialize expression object and automatically parse the expression
            right after initialization.

            :param exp: expression (using domain ('foo', '=', 'bar' format))
            :param table: root model

            :attr list result: list that will hold the result of the parsing
                as a list of ExtendedLeaf
            :attr list joins: list of join conditions, such as
                (res_country_state."id" = res_partner."state_id")
            :attr root_model: base model for the query
            :attr list expression: the domain expression, that will be normalized
                and prepared
        """

        # normalize and prepare the expression for parsing
        self.expression = distribute_not(normalize_domain(exp))

        # parse the domain expression
        self.parse()


    # ----------------------------------------
    # Parsing
    # ----------------------------------------

    def parse(self):
                
        def pop():
            """ Pop a leaf to process. """
            return self.stack.pop()

        def push(leaf):
            """ Push a leaf to be processed right after. """
            self.stack.append(leaf)

        def push_result(leaf):
            """ Push a leaf to the results. This leaf has been fully processed
                and validated. """
            self.result.append(leaf)

        self.result = []
        self.stack = [Leaf(leaf) for leaf in self.expression]
        # process from right to left; expression is from left to right
        self.stack.reverse()

        while self.stack:
            # Get the next leaf to process
            leaf = pop()
            push_result(leaf)


    def __leaf_to_sql(self, eleaf):
        leaf = eleaf.leaf
        left, operator, right = leaf
        query_format = "%s" 
        
        # final sanity checks - should never fail
        assert operator in (TERM_OPERATORS + ('inselect',)), \
            "Invalid operator %r in domain term %r" % (operator, leaf)

   
        if leaf == TRUE_LEAF:
            query = 'TRUE'
            params = []

        elif leaf == FALSE_LEAF:
            query = 'FALSE'
            params = []

        elif operator == 'inselect':
            query = '%s in (%s)' % (left, right[0])
            params = right[1]

        elif operator in ['in', 'not in']:
            # Two cases: right is a boolean or a list. The boolean case is an
            # abuse and handled for backward compatibility.
            if isinstance(right, bool):
                _logger.warning("The domain term '%s' should use the '=' or '!=' operator." % (leaf,))
                if operator == 'in':
                    r = 'NOT NULL' if right else 'NULL'
                else:
                    r = 'NULL' if right else 'NOT NULL'
                query = '(%s IS %s)' % (left, r)
                params = []
            elif isinstance(right, (list, tuple)):
                params = list(right)
                check_nulls = False
                for i in range(len(params))[::-1]:
                    if params[i] == False:
                        check_nulls = True
                        del params[i]

                if params:
                    instr = ','.join(['%s'] * len(params))
                    query = '(%s %s (%s))' % (left, operator, instr)
                else:
                    # The case for (left, 'in', []) or (left, 'not in', []).
                    query = 'FALSE' if operator == 'in' else 'TRUE'

                if check_nulls and operator == 'in':
                    query = '(%s OR %s IS NULL)' % (query, left)
                elif not check_nulls and operator == 'not in':
                    query = '(%s OR %s IS NULL)' % (query, left)
                elif check_nulls and operator == 'not in':
                    query = '(%s AND %s IS NOT NULL)' % (query, left)  # needed only for TRUE.
            else:  # Must not happen
                raise ValueError("Invalid domain term %r" % (leaf,))
        # is not set operator
        elif operator == '=':
            print ''
            query = '%s IS NULL ' % (left)
            params = []
        # set operator
        elif operator == '!=':
            query = '%s IS NOT NULL' % (left)
            params = []

        else:
            need_wildcard = operator in ('like', 'ilike', 'not like', 'not ilike')
            sql_operator = {'=like': 'like', '=ilike': 'ilike'}.get(operator, operator)
        
            add_null = False
            
            if need_wildcard:
                if isinstance(right, str):
                    str_utf8 = right
                elif isinstance(right, unicode):
                    str_utf8 = right.encode('utf-8')
                else:
                    str_utf8 = str(right)
                params = '%%%s%%' % str_utf8
                add_null = not str_utf8
                left = 'unaccent(%s)' % left
                query_format = 'unaccent(%s)' % query_format
                
            else:
                params = right
            
            query = '(%s %s %s)' % (left, sql_operator, query_format)
            
            if add_null:
                query = '(%s OR %s IS NULL)' % (query, left)

            

        if isinstance(params, basestring):
            params = [params]

        _logger.info('__leaf_to_sql: %s, %s', query, params);
            
        return query, params

    def to_sql(self):
        stack = []
        params = []
        # Process the domain from right to left, using a stack, to generate a SQL expression.
        self.result.reverse()
        for leaf in self.result:
            if leaf.is_leaf(internal=True):
                q, p = self.__leaf_to_sql(leaf)
                params.insert(0, p)
                stack.append(q)
            elif leaf.leaf == NOT_OPERATOR:
                stack.append('(NOT (%s))' % (stack.pop(),))
            else:
                ops = {AND_OPERATOR: ' AND ', OR_OPERATOR: ' OR '}
                q1 = stack.pop()
                q2 = stack.pop()
                stack.append('(%s %s %s)' % (q1, ops[leaf.leaf], q2,))

        assert len(stack) == 1
        query = stack[0]
        query = ' AND %s' % (query,) 
        
        return query, misc.flatten(params)

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
