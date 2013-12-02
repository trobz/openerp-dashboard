openerp.unleashed.module('trobz_dashboard',function(dashboard, _, Backbone, base){

    var Renderer = Marionette.Renderer;

    var Controller = Marionette.Controller,
        _super = Controller.prototype;
    
    var getDefaults = function(){
        return {
            general: {
                group: false,
                HtmlText : false,
                mouse: {
                    sensibility: 30,
                    track: true,
                    position: 'ne',
                    lineColor: '#333333',
                },
                legend : {
                  backgroundColor : '#ffffff',
                  labelBoxBorderColor: '#ffffff',
                  customBoxBorderColor: '#cacaca'
                },
                xaxis: {
                    labelsAngle : 45
                },
                grid: {
                    labelMargin: 5
                }    
            },
            
            bar: {
                fid: 'bars',
                bars: {
                    show : true,
                    horizontal : false,
                    shadowSize : 0,
                    centered: true, 
                }
            },
            
            line: {
                fid: 'lines',
                lines: { show : true }
            },
            
            pie: {
                fid: 'pie',
                grid: {
                    verticalLines: false,
                    horizontalLines: false
                },
                xaxis: {
                    showLabels: false
                },
                yaxis: {
                    showLabels: false
                },
                pie: { 
                    show : true, 
                    explode: 6
                }
            }
        }
    };

    var GraphRenderer = Controller.extend({
        
        initialize: function(options){
            
            this.is_printable = options.printable;
            
            this.series = [];
            this.data = [];
            this.ticks = [];
            this.ticks_group = 1; //nb of item in 1 tick groups
            
            this.rendered = false;
            
            this.metrics = options.metrics;
            this.options = _.deepExtend({}, getDefaults().general, options.general);
            this.search = options.search;
            this.total = options.metrics.length;
            this.call = 0;
            
            this.setup();
            this.setElement(options.$el);
        },
        
        setup: function(){
            this.options.group = this.metrics.every(function(metric){ 
                var options = metric.get('options');
                return 'type' in options && options.type == 'bar'
            });
            
            if(this.options.group){
                this.ticks_group = this.total + (this.total > 1 ? 1 : 0);    
            }
            
            this.options.mouse.trackFormatter = $.proxy(this.trackFormatter, this);   
        },
        
        render: function(){
            if(this.data.length > 0){
                this.options.xaxis.ticks = this.getTicks(); 
                
                if(this.$dest.find('.graph').length <= 0){
                    this.appendHtml();
                }
                
                this.resize();
                
                if(this.$el.is(':visible')){
                    
                    this.$el.empty();
                    
                    //no result
                    if(_(this.data).every(function(serie){return serie.data.length <= 0; })){
                        this.$el.html(
                            Renderer.render('TrobzDashboard.widget.display.graph.no_result')
                        );
                    }
                    //not more than 1 result
                    else if(this.options.fid != 'pie' && _(this.data).every(function(serie){return serie.data.length == 1; })){
                        var ticks = {};
                        _(this.options.xaxis.ticks).each(function(item){ticks[item[0]] = item[1];});
                        
                        this.$el.html(
                            Renderer.render('TrobzDashboard.widget.display.graph.one_result', {
                                series: this.data,
                                ticks: ticks,
                                format: this.options.yaxis.format || false,
                                numeral: numeral
                            })
                        );        
                        
                    }
                    else {
                        
                        Flotr.draw(this.$el.get(0), this.data, this.options);    
                        if(this.is_printable){
                            this.convertToImage();
                        }
                    }
                }
            }
            this.rendered = true;
        },
        
        printable: function(state){
            this.is_printable = state;
            if(this.is_printable){
                this.convertToImage();
            }
        },
        
        convertToImage: function(){
            var data = this.getDataURL();
            
            if(data){
                var $img = $('<img>').attr({src: data});
            
                this.$el.find('canvas').hide();
                this.$el.find('canvas.flotr-canvas').replaceWith($img);
            }
        },
        
        getDataURL: function(){
            var data, 
                $canvas = this.$el.find('canvas.flotr-canvas');
                
            if($canvas.length > 0){
                var canvas = $canvas.get(0),
                    context = canvas.getContext('2d'),
                    w = canvas.width,
                    h = canvas.height;
                
                context.globalCompositeOperation = "destination-over";
                context.fillStyle = '#ffffff';
                context.fillRect(0,0,w,h);
                data = canvas.toDataURL("image/jpeg");    
            }
            return data;
        },
        
        addData: function(metric, x_axis, y_axis, options){
            if(x_axis && y_axis && this.series.length < this.total){
                if(options.type == 'pie'){
                    this.convertPie(metric, x_axis, y_axis, options);    
                }
                else {
                    this.convert(metric, x_axis, y_axis, options);    
                }
            }
            else if(metric.results.length == 0){
                //add empty data for metric without results
                this.data.push({
                    data: [],
                    label: metric.get('name')
                })
            }
            if(++this.call == this.total){
                this.render();
                this.call = 0;
            }
        },
        
        convertPie: function(metric, x_axis, y_axis, options){
            var data = [], remains = null, serie_options = this.serieOptions(options);
            
            // only one metric allowed, so one graph serie...
            if(this.series.length > 0){
                throw new Error('pie graph accept only one metric !');
            }
            this.series.push({ x_axis: x_axis, y_axis: y_axis });
        
            
            metric.results.each(function(result, index){
                var name = result.get(x_axis.get('reference')) || base._t('undefined'),
                    y = parseInt(result.get(y_axis.get('reference')));
        
                y = _.isNaN(y) ? null : y;
                
                if(('nb_limit' in serie_options['pie'] && index > serie_options['pie'].nb_limit) 
                || ('val_limit' in serie_options['pie'] && serie_options['pie'].val_limit > y)){
                    remains += y;
                }
                else {
                    this.data.push(
                        _.extend({
                            data: [[0, y]], 
                            label: name, 
                       }, serie_options)
                    );    
                }
            }, this);
            
            if(remains){
                this.data.push(
                    _.extend({
                        data: [[0, remains]], 
                        label: base._t('Remaining values'), 
                   }, serie_options)
                );    
            }
        },
        
        convert: function(metric, x_axis, y_axis, options){
            var last_y_axis = this.checkPreviousSeries(x_axis, y_axis),
                data = [];
            
            this.series.push({ x_axis: x_axis, y_axis: y_axis });
        
            metric.results.each(function(result, index){
                var name = result.get(x_axis.get('reference')) || base._t('undefined'),
                    x = this.getTickIndex(name, x_axis),
                    y = result.get(y_axis.get('reference'));
                
                if($.isNumeric(y)){
                    data.push([x, parseInt(y)]);    
                }
            }, this);
            
            this.data.push(
                _.extend({ 
                    data: data, 
                    label: metric.get('name'), 
                    yaxis : (last_y_axis ? 2 : 1) 
               }, this.serieOptions(options))
            );
            
            var yaxis = last_y_axis ? 'y2axis' : 'yaxis';
            this.options.xaxis = _.extend({ title : x_axis.get('name'), min: 0 }, this.options.xaxis);
            if(!(yaxis in this.options)){
                var self = this;
                this.options[yaxis] = { 
                    tickFormatter: function(val){ 
                        return self.tickFormatter(val, this); 
                    },
                    title: y_axis.get('name'), 
                    min: 0 
                }; 
                
                if('format' in options){
                    this.options[yaxis].format = options.format;
                }
            }
        },
    
        serieOptions: function(options){
            var type = 'type' in options ? options.type : 'bar',
                def = getDefaults(),
                flotr_type =def[type].fid,
                serie_options = {},
                // dirty trick to clone sub object but it's work...
                base_options = JSON.parse(JSON.stringify(options));
            
            this.options = _.deepExtend(def[type], base_options.general, this.options);
            
            
            delete base_options.general;
            
            serie_options[flotr_type] = _.deepExtend(this.options[flotr_type], base_options);
            
            if(flotr_type in this.options)
                delete this.options[flotr_type];
            
            return serie_options;
        },
        
        getTickIndex: function(name, x_axis){
            var current_serie = this.series.length - 1,
                tick = _(this.ticks).find(function(tick){ 
                    return tick.origin == name; 
                });
        
            if(!tick){
                tick = {
                    value: x_axis.format(name),
                    origin: name,
                    index: this.ticks.length * this.ticks_group
                };
                this.ticks.push(tick);
            }
        
            return tick.index + (this.options.group ? current_serie : 0);
        },
        
        getTick: function(index){
            index = parseInt(index);
            var group = this.ticks_group;
            return _(this.ticks).find(function(tick){ 
                return tick.index <= index && index < tick.index + group; 
            });
        },
        
        getTicks: function(){
            // recreate all ticks based on group required 
            
            var group = this.ticks_group,
                half = Math.floor(group / 2),
                ticks = [];
            
            _(this.ticks).each(function(tick){
                var index = tick.index, value = tick.value;
                for(var i=0 ; i < group ; i++){
                    ticks.push([ index + i, (i == half ? value : '') ]);
                }
            });
            
            return ticks;
        },
        
        tickFormatter: function(val, options){
            return 'format' in options ? numeral(val).format(options.format) : val;
        },
        
        trackFormatter: function(item){
            
            if(item.nearest.series.type == 'pie'){
                return _.template('<ul><li><span><%= x.label %></span>:<b><%= x.value %></b></li></ul>', {
                    x: {
                        label: item.nearest.series.label,
                        value: this.tickFormatter(item.y, item.nearest.series)
                    }
                });
            }
            else {
                var tick = this.getTick(item.x);
                    x_value = tick && tick.value ? tick.value : item.x;
                
                return _.template('<ul><li><span><%= x.label %></span>:<b><%= x.value %></b></li><li><span><%= y.label %></span>:<b><%= y.value %></b></li></ul>', {
                    x: {
                        label: item.nearest.xaxis.options.title,
                        value: x_value
                    },
                    y: {
                        label: item.nearest.yaxis.options.title,
                        value: this.tickFormatter(item.y, item.nearest.yaxis.options)
                    }
                });    
            }
            
        },
        
        checkPreviousSeries: function(x_axis, y_axis){
            var y_diff = 0, 
                last_serie = _(this.series).last();
            
            _(this.series).each(function(serie){
                var serie_x_ref = serie.x_axis.get('reference'), serie_y_ref = serie.y_axis.get('reference'),
                    x_ref = x_axis.get('reference'), y_ref = y_axis.get('reference');
               
                if(serie_x_ref != x_ref){
                    throw new Error('a previous serie with x-axis: "' + serie_x_ref + '" is not compatible with x-axis: "' + x_ref + '"');
                }    
                if(serie_y_ref != y_ref){
                    if(++y_diff >= 2){
                        throw new Error('currently only 2 differents y_axis are supported, more have been detected');
                    }
                }
            });
            return last_serie && !last_serie.y_axis.compatible(y_axis);
        },
        
        setElement: function($el){
            this.$dest = $el;
            var $graph = this.$dest.find('.graph');
            
            $graph = $graph.length > 0 ? $graph : $('<div class="graph">');
            this.$el = $graph;
        },
        
        appendHtml: function(){
            this.$dest.empty();
            this.$dest.html(this.$el);
        },
        
        resize: function(){
            //preserve a 4/3 ratio
            var el_width = this.$el.parent().width(),
                margin = Math.round(el_width / 10), 
                width = el_width - margin, 
                height = width / (16/9);
                
            this.$el.css({
                width: width,
                height: height
            });
        }
    });

    var DisplayGraph = Controller.extend({

        initialize: function(options){
            this.is_printable = options.printable;
            
            this.model = options.model;
            
            
            // attach the graph to the collection, to keep it unique for each widget
            var graph = this.graph = options.collectionView.graph = options.collectionView.graph || null; 
            
            //create the graph object, at the first metric init
            
            
            if(!graph || graph.rendered){
                var model_options = options.model.get('options');
                graph = new GraphRenderer({
                    search: options.search,
                    metrics: options.model.collection,
                    $el: options.collectionView.$el,
                    general: 'general' in model_options ? model_options.general : {},
                    printable: this.is_printable
                });
            }            
            
            this.graph = options.collectionView.graph = graph;
        },
        
        printable: function(state){
            if(this.graph){
                this.graph.printable(state);
            }
        },
        
        resize: function(){
            console.log('resize called');
            if(this.graph){
                this.graph.resize();
            }
        },

        render: function(){
            var results = this.model.results, 
                x_axis = results.columns[0] || null,
                y_axis = results.columns[1] || null,
                options = _(this.model.get('options')).clone();
        
            this.graph.addData(this.model, x_axis, y_axis, options);
        }
    });

    dashboard.views('DisplayGraph', DisplayGraph);
});