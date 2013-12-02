(function(Flotr) {

    // fix bug
    // when mouse tracker is on and 2 y-axis are used, the rollover doesn't work for all bars
    Flotr.graphTypes['bars'].hit = function(options) {
        var data = options.data, args = options.args, mouse = args[0], n = args[1], x = mouse.x, y = mouse.y, hitGeometry = this.getBarGeometry(x, y, options), width = hitGeometry.width / 2, left = hitGeometry.left, geometry, i;

        for ( i = data.length; i--; ) {
            geometry = this.getBarGeometry(data[i][0], data[i][1], options);

            //TODO: fixed by using y2 value too, should be done with an OR condition but there's no way to know which y-axis is used by a bar object...
            if ((geometry.y > mouse.y2 || geometry.y > hitGeometry.y ) && Math.abs(left - geometry.left) < width && hitGeometry.y > 0) {
                n.x = data[i][0];
                n.y = data[i][1];
                n.index = i;
                n.seriesIndex = options.index;
            }
        }
    };
    

    //fix bug
    // only listen to mouse even on Graph element, not on all the document !?
    var E = Flotr.EventAdapter;
    Flotr.Graph.prototype.mouseDownHandler = function(event) {

        if (this.mouseUpHandler)
            return;
        this.mouseUpHandler = _.bind(function(e) {
            E.stopObserving(this.el, 'mouseup', this.mouseUpHandler);
            E.stopObserving(this.el, 'mousemove', this.mouseDownMoveHandler);
            this.mouseDownMoveHandler = null;
            this.mouseUpHandler = null;
            // @TODO why?
            //e.stop();
            E.fire(this.el, 'flotr:mouseup', [e, this]);
        }, this);
        this.mouseDownMoveHandler = _.bind(function(e) {
            var pos = this.getEventPosition(e);
            E.fire(this.el, 'flotr:mousemove', [event, pos, this]);
            this.lastMousePos = pos;
        }, this);
        E.observe(this.el, 'mouseup', this.mouseUpHandler);
        E.observe(this.el, 'mousemove', this.mouseDownMoveHandler);
        E.fire(this.el, 'flotr:mousedown', [event, this]);
        this.ignoreClick = false;
    };

    //fix bug
    // wrong y2-axis title position
    var drawTitles = Flotr.plugins.titles.drawTitles;
    Flotr.plugins.titles.drawTitles = function() {
        this.plotWidth += 15;
        drawTitles.apply(this, arguments);
        this.plotWidth -= 15;
        
    };

    // make the label a little bit nicer
    var legendMethod = Flotr.plugins.legend.insertLegend;
    Flotr.plugins.legend.insertLegend = function() {
        legendMethod.apply(this, arguments);

        var series = this.series, 
            plotOffset = this.plotOffset, 
            options = this.options, 
            legend = options.legend,
            m = legend.margin,
            itemCount = _.filter(series, function(s) {return (s.label && !s.hide);}).length,
            ctx = this.ctx;

        var style = {
            size : options.fontSize * 1.1,
            color : options.grid.color
        };

        var lbw = legend.labelBoxWidth, lbh = legend.labelBoxHeight, lbm = legend.labelBoxMargin, offsetX = plotOffset.left + m, offsetY = plotOffset.top + m;

        // We calculate the labels' max width
        var labelMaxWidth = 0;
        for ( i = series.length - 1; i > -1; --i) {
            if (!series[i].label || series[i].hide)
                continue;
            label = legend.labelFormatter(series[i].label);
            labelMaxWidth = Math.max(labelMaxWidth, this._text.measureText(label, style).width);
        }

        var legendWidth = Math.round(lbw + lbm * 3 + labelMaxWidth), legendHeight = Math.round(itemCount * (lbm + lbh) + lbm);

        ctx.strokeStyle = legend.customBoxBorderColor;
        ctx.strokeRect(Flotr.toPixel(offsetX), Flotr.toPixel(offsetY), legendWidth, legendHeight);
    };
    
    // fix bug
    // add margin, based on https://github.com/HumbleSoftware/Flotr2/pull/161
    var calculateSpacingMethod = Graph.prototype.calculateSpacing;
    Graph.prototype.calculateSpacing = function(){
        calculateSpacingMethod.apply(this, arguments);
        
        this.plotHeight -= 10;
        this.plotWidth -= 10;
        
        var a = this.axes,
            x = a.x,
            x2 = a.x2,
            y = a.y,
            y2 = a.y2;
        
        x.length = x2.length = this.plotWidth;
        y.length = y2.length = this.plotHeight;
        y.offset = y2.offset = this.plotHeight;
        x.setScale();
        x2.setScale();
        y.setScale();
        y2.setScale();
    };


   // fix bug (side effect of margin)
    var drawMouseTrackMethod = Flotr.plugins.hit.drawMouseTrack;
    Flotr.plugins.hit.drawMouseTrack = function(){
        var right = this.plotOffset.right;
        this.plotOffset.right += 10;
        drawMouseTrackMethod.apply(this, arguments);
        this.plotOffset.right = right;
    };
    
})(Flotr)
