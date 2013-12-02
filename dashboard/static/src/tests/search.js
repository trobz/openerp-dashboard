openerp.unleashed.module('trobz_dashboard', function(dashboard, _, Backbone){
        
    openerp.testing.section('Search Model', function (test) {

        var Search = dashboard.models('Search');
            Field = dashboard.models('Field'); 
            
        var field = {
            numeric1: new Field({ name: 'Numeric 1', sql_name: 'ut.num1', reference: 'num1', field_id: 'num1', model: 'unit.test1', type_names: ['domain']}),  
            
            string1: new Field({ name: 'String 1', sql_name: 'ut.str1', reference: 'str1', field_id: 'str1', model: 'unit.test1', type_names: ['domain']}),  
        
            date1: new Field({ name: 'Date 1', sql_name: 'ut.date1', reference: 'date1', field_id: 'date1', model: 'unit.test1', type_names: ['domain']}),  

            numeric1bis: new Field({ name: 'Numeric 1', sql_name: 'ut2.num1_bis', reference: 'num1', field_id: 'num1_bis', model: 'unit.test2', type_names: ['domain']}),  
        
        };
                       
        test('domain numeric', function () {
            
            var tests = [
                {
                    params: [ field.numeric1, 'e', 10 ],
                    string: 'F{Numeric 1} O{is equal to} V{10}',
                    domain: [['num1', '=', 10]]
                },
                {
                    params: [ field.numeric1, 'lt', 10 ],
                    string: 'F{Numeric 1} O{is equal to} V{10} S{or} ' +
                            'F{Numeric 1} O{is lower than} V{10}',
                    domain: [
                                '|', 
                                ['num1', '=', 10], 
                                ['num1', '<', 10],
                            ]
                },
                {
                    params: [ field.numeric1, 'lte', 10 ],
                    string: 'F{Numeric 1} O{is equal to} V{10} S{or} ' +
                            'F{Numeric 1} O{is lower than} V{10} S{or} ' +
                            'F{Numeric 1} O{is lower or equal to} V{10}',
                    domain: [
                                '|', 
                                ['num1', '=', 10], 
                                '|', 
                                ['num1', '<', 10],
                                ['num1', '<=', 10],
                            ]
                },
                {
                    params: [ field.numeric1, 'gt', 10 ],
                    string: 'F{Numeric 1} O{is equal to} V{10} S{or} ' + 
                            'F{Numeric 1} O{is lower than} V{10} S{or} ' +
                            'F{Numeric 1} O{is lower or equal to} V{10} S{or} ' +
                            'F{Numeric 1} O{is higher than} V{10}',
                    domain: [
                                '|', 
                                ['num1', '=', 10], 
                                '|', 
                                ['num1', '<', 10],
                                '|', 
                                ['num1', '<=', 10], 
                                ['num1', '>', 10],
                            ]
                },
                {
                    params: [ field.numeric1, 'gte', 10 ],
                    string: 'F{Numeric 1} O{is equal to} V{10} S{or} ' + 
                            'F{Numeric 1} O{is lower than} V{10} S{or} ' +
                            'F{Numeric 1} O{is lower or equal to} V{10} S{or} ' +
                            'F{Numeric 1} O{is higher than} V{10} S{or} ' +
                            'F{Numeric 1} O{is higher or equal to} V{10}',
                    domain: [
                                '|', 
                                ['num1', '=', 10], 
                                '|', 
                                ['num1', '<', 10],
                                '|', 
                                ['num1', '<=', 10], 
                                '|', 
                                ['num1', '>', 10],
                                ['num1', '>=', 10],
                            ]
                },
                {
                    params: [ field.numeric1, 'ne', 10 ],
                    string: 'F{Numeric 1} O{is equal to} V{10} S{or} ' + 
                            'F{Numeric 1} O{is lower than} V{10} S{or} ' +
                            'F{Numeric 1} O{is lower or equal to} V{10} S{or} ' +
                            'F{Numeric 1} O{is higher than} V{10} S{or} ' +
                            'F{Numeric 1} O{is higher or equal to} V{10} S{or} ' +
                            'F{Numeric 1} O{is not equal to} V{10}',
                    domain: [
                                '|', 
                                ['num1', '=', 10], 
                                '|', 
                                ['num1', '<', 10],
                                '|', 
                                ['num1', '<=', 10], 
                                '|', 
                                ['num1', '>', 10],
                                '|', 
                                ['num1', '>=', 10],
                                ['num1', '!=', 10],
                            ]
                }
            ];
            
            var search = new Search();
           
            _.each(tests, function(t, i){
                search.addDomain.apply(search, t.params);
                deepEqual(search.domain(), t.domain, 'test ' + i + ': search domain is correct');
                strictEqual(search.domain('string'), t.string, 'test ' + i + ': search string is correct');
            });
            
            search.clear(); 
        });
   
        test('domain string', function () {
            
            var tests = [
                {
                    params: [ field.string1, 'contains', 'foobar' ],
                    string: 'F{String 1} O{contains} V{foobar}',
                    domain: [['str1', 'like', 'foobar']]
                },
                {
                    params: [ field.string1, 'n_contains', 'foobar' ],
                    string: 'F{String 1} O{contains} V{foobar} S{or} ' +
                            'F{String 1} O{doesn\'t contains} V{foobar}',
                    domain: [
                                '|',
                                ['str1', 'like', 'foobar'], 
                                '!',
                                ['str1', 'like', 'foobar'],
                            ]
                }
            ];
            
            var search = new Search();
           
            _.each(tests, function(t, i){
                search.addDomain.apply(search, t.params);
                deepEqual(search.domain(), t.domain, 'test ' + i + ': search domain is correct');
                strictEqual(search.domain('string'), t.string, 'test ' + i + ': search string is correct');
            });
            
            search.clear(); 
        });

        test('domain date', function () {
            
            var tests = [
                {
                    params: [ field.date1, 'month', 1 ],
                    string: 'F{Date 1} O{of month} V{February}',
                    domain: [['extract("month" from date1)', '=', 1]]
                },
                {
                    params: [ field.date1, 'year', 2010 ],
                    string: 'F{Date 1} O{of month} V{February} S{or} ' +
                            'F{Date 1} O{of year} V{2010}',
                    domain: [
                        '|',
                        ['extract("month" from date1)', '=', 1],
                        ['extract("year" from date1)', '=', 2010]
                    ]
                },
                {
                    params: [ field.date1, 'quarter', 1 ],
                    string: 'F{Date 1} O{of month} V{February} S{or} ' +
                            'F{Date 1} O{of year} V{2010} S{or} ' +
                            'F{Date 1} O{of quarter} V{1st}',
                    domain: [
                        '|',
                        ['extract("month" from date1)', '=', 1],
                        '|',
                        ['extract("year" from date1)', '=', 2010],
                        ['extract("quarter" from date1)', '=', 1]
                    ]
                },
                {
                    params: [ field.date1, 'day', 1 ],
                    string: 'F{Date 1} O{of month} V{February} S{or} ' +
                            'F{Date 1} O{of year} V{2010} S{or} ' +
                            'F{Date 1} O{of quarter} V{1st} S{or} ' +
                            'F{Date 1} O{of day} V{Monday}',
                    domain: [
                        '|',
                        ['extract("month" from date1)', '=', 1],
                        '|',
                        ['extract("year" from date1)', '=', 2010],
                        '|',
                        ['extract("quarter" from date1)', '=', 1],
                        ['extract("dow" from date1)', '=', 1]
                    ]
                },
            ];
            
            var search = new Search();
           
            _.each(tests, function(t, i){
                search.addDomain.apply(search, t.params);
                deepEqual(search.domain(), t.domain, 'test ' + i + ': search domain is correct');
                strictEqual(search.domain('string'), t.string, 'test ' + i + ': search string is correct');
            });
            
            search.clear(); 
        });
    
        test('domain multi fields', function(){
           
            var search = new Search();
        
            /*
             * add
             */
            
            search.addDomain(field.numeric1, 'e', 10);
        
            deepEqual(search.domain(), [['num1', '=', 10]], '1 condition: domain correct');
            strictEqual(search.domain('string'), 'F{Numeric 1} O{is equal to} V{10}', '1 condition: domain string correct');
           
            search.addDomain(field.numeric1, 'e', 10);
        
            deepEqual(search.domain(), [['num1', '=', 10]], 'same condition not added 2 times');
            strictEqual(search.domain('string'), 'F{Numeric 1} O{is equal to} V{10}', 'same condition not added 2 times');
        
            search.addDomain(field.string1, 'contains', 'foobar');
                
            deepEqual(search.domain(), [['num1', '=', 10], ['str1', 'like', 'foobar']], '2 conditions: domain correct');
            strictEqual(search.domain('string'), 'F{Numeric 1} O{is equal to} V{10} S{and} F{String 1} O{contains} V{foobar}', '2 conditions: domain string correct');
            
            search.addDomain(field.numeric1, 'gt', 10);
        
            deepEqual(search.domain(), ['|', ['num1', '=', 10], ['num1', '>', 10], ['str1', 'like', 'foobar']], '3 conditions: domain correct');
            strictEqual(search.domain('string'), 'S{(} F{Numeric 1} O{is equal to} V{10} S{or} F{Numeric 1} O{is higher than} V{10} S{)} S{and} F{String 1} O{contains} V{foobar}', '3 conditions: domain string correct');
        
            search.addDomain(field.numeric1, 'e', 20);
        
            deepEqual(search.domain(), ['|', ['num1', '=', 10], '|', ['num1', '>', 10],  ['num1', '=', 20],  ['str1', 'like', 'foobar']], '4 conditions: domain correct');
            strictEqual(search.domain('string'), 'S{(} F{Numeric 1} O{is equal to} V{10} S{or} F{Numeric 1} O{is higher than} V{10} S{or} F{Numeric 1} O{is equal to} V{20} S{)} S{and} F{String 1} O{contains} V{foobar}', '4 conditions: domain string correct');
        
            /*
             * remove
             */
        
            search.removeDomain(field.numeric1, 'e', 20);
        
            deepEqual(search.domain(), ['|', ['num1', '=', 10], ['num1', '>', 10], ['str1', 'like', 'foobar']], '3 conditions / 1 removed: domain correct');
            strictEqual(search.domain('string'), 'S{(} F{Numeric 1} O{is equal to} V{10} S{or} F{Numeric 1} O{is higher than} V{10} S{)} S{and} F{String 1} O{contains} V{foobar}', '3 conditions / 1 removed: domain string correct');
        
            search.removeDomain(field.string1, 'contains', 'foobar');
               
            deepEqual(search.domain(), ['|', ['num1', '=', 10], ['num1', '>', 10]], '2 conditions / 2 removed: domain correct');
            strictEqual(search.domain('string'), 'F{Numeric 1} O{is equal to} V{10} S{or} F{Numeric 1} O{is higher than} V{10}', '2 conditions / 2 removed: domain string correct');
            
            /*
             * bracket test
             */
            
            search.addDomain(field.string1, 'contains', 'foobar');
        
            deepEqual(search.domain(), ['|', ['num1', '=', 10], ['num1', '>', 10], ['str1', 'like', 'foobar']], '3 conditions: domain correct');
            strictEqual(search.domain('string'), 'S{(} F{Numeric 1} O{is equal to} V{10} S{or} F{Numeric 1} O{is higher than} V{10} S{)} S{and} F{String 1} O{contains} V{foobar}', '3 conditions: domain string correct');
               
            search.clear(); 
        });
    
    });    
});




