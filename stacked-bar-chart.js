/**
* StackedBarChart() is a nested function which takes data, dom identifiers such as chartWrapper and ChartID, and axis labes as input arguments
* This nested function extensively uses d3.js to create a stacked bar chart
* The drawStackedBar() function maps data and stacks allKeys as individual 'stack' group inside the SVG
* In ActigraVis, the StackedBarChart() function is used for Activity (in minutes) across Time, as well as Avg Activity for weekdays and weekend
* The x axis values differ for time (date) and weekdays-weekend (hour, 0-23 hrs)
* The json response from backend contains x vlaue to be null for generating Activity Across time chart. Based on the x value, we reuse the same function to generate all stacked bar charts
**/

function StackedBarChart(data,chartWrapper, chartId, xAxisLabel, yAxisLabel){

  // Create/Set DOM selectors, margins and chart dimensions
  var margin = { top: 30, right: 35,  bottom: 70, left: 70 };
  var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
  var containerheight = 200;
  var width = parentDiv.width - margin.left - margin.right;
  var height = containerheight - margin.top - margin.bottom;
  var xLabel = xAxisLabel;
  var yLabel = yAxisLabel;

  // Remove svg under this div, if any
  d3.selectAll("div"+chartId+">svg").remove();

  // Initialize stack layout in d3
  var stack = d3.stack()
	  .order(d3.stackOrderNone)
	  .offset(d3.stackOffsetExpand);

  // DATA MANIPULATION & MODELLING

  // var parseTime = d3.timeParse("%Y-%m-%d");

  // Ungroup data and find maxX and maxY value
  var allKeys = ["sleep","nap","sedentary","light","moderate","vigorous"];
  // x value is null for weekdays and weekends stackBar
  for(i in data){
    if(data[i].x != null) {
    data.sort(function(a,b) { return a.x - b.x; });
    var newData = unGroupData(data);
    var groupData =
     d3.nest().key(function(d){
         if(d.x == null) { return d.date; }
         else { return d.x;}
  	  }).entries(newData);
    }
    else {
      var newData = unGroupData(data);
      var groupData =
     d3.nest().key(function(d){
         if(d.x == null) { return d.date; }
         else { return d.x;}
  	    }).sortKeys(d3.ascending)
        .entries(newData);
     }
  }
  groupData = formatGroupData(groupData);
  groupData.forEach(function(d) {
	 d.enabled = true;
	});
  var newGroupData = stack.keys(allKeys)(groupData);
  // Add enabled key - for legend toggling functionality
	newGroupData.forEach(function(d) {
	 d.enabled = true;
	});

  var colorScale = d3.scaleOrdinal().range(["#3182bd", "#9ecae1", "#fee5d9", "#fcae91", "#fb6a4a", "#de2d26"]);
  colorScale.domain(allKeys);

  //drawLegend appends to the chartId div and does not require SVG
  drawLegend(groupData, newGroupData, colorScale);

  // Create SVG with chart dimensions
  var svg = d3.select(chartId)
  .append('svg')
  .attr('width', parentDiv.width)
  .attr('height', containerheight);
  var g = svg
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var gSelection = "div"+chartId+">svg>g";

  //  Create tool tip
  var tooltip = d3.select(chartId)
  .append('div')
  .attr('class', 'd3-stack-barchart-tooltip hidden');

  // fn call to generate StackedBarChart
  drawStackedBar(newGroupData, width, height);

  // FEATURE - Redraw chart on window resize
  $(window).on('resize', function() {
      var margin = { top: 30, right: 35,  bottom: 70, left: 70 };
      var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
      var containerheight = 200;
      var width = parentDiv.width- margin.left - margin.right;
      var height = containerheight - margin.top - margin.bottom;

      drawStackedBar(newGroupData, width, height);
    });

  // ############## ALL FUNCTIONS ##################

  function drawStackedBar(jsonData, width, height){
    //  clear existing data points, rectangles or tooltips on svg if any
    d3.selectAll(gSelection+">g").remove();
    d3.selectAll(gSelection+">g.data-rectangles").remove();
    tooltip.classed('hidden', true);
    d3.select(gSelection+'>g.xAxisG>text').remove();
    d3.select(gSelection+'>g.yAxisG>text').remove();

    // Create Chart Axis scales
    var xScale = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1);
    var xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(3)
      .tickPadding(2)
      .tickSize(-height);
    xScale.domain(groupData.map(function(d) { return d.key; }));
    var mult = Math.max (1, Math.floor (width / xScale.domain().length));
    xScale.rangeRound([0, (xScale.domain().length * mult)], 0.1, 0);
    var newWidth = xScale.domain().length * mult;  // new width based on xAxis - to be used for y Axis ticks size

    var yScale = d3.scaleLinear()
      .range([height, 0]);
    var yScale2 = d3.scaleLinear()
        .range([height, 0]);
    var yAxis = d3.axisLeft()
        .scale(yScale2)
        .ticks(5)
        .tickPadding(15)
        .tickSize(-newWidth);
    yScale2.domain([0, d3.max(groupData, function(d) { return d.total; })]);

    //  Create groups for x and y axis labels and add text labels
    var xAxisG = d3.select(gSelection).append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr("class", "xAxisG");
    xAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', 70)
        .text(xLabel);
    var yAxisG = d3.select(gSelection).append('g')
        .attr("class", "yAxisG");
    yAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('transform', `rotate(-90)`)
        .style('text-anchor', 'middle')
        .text(yLabel);

    var xAxisTickSelection = "div"+chartId+">svg>g>g.xAxisG>g.tick>text";
    // call functions from this file to generate axis & legend
    xAxisG.call(xAxis)
    	.selectAll(xAxisTickSelection)
    	.attr("dx", "-1.5em")
      .attr("dy", "1.1em")
    	.style("text-anchor", "end")
      .attr("transform", "rotate(-35)");
    yAxisG.call(yAxis);

    var dataRect = g.append('g')
        .attr("class", "data-rectangles");

    // exit the whole group before adding points
    dataRect.exit().remove();

     dataRect.selectAll(".stack")
      .data(jsonData)
      .enter().append("g")
        .attr("class", "stack")
        .attr("fill", function(d) { return colorScale(d.key);
        }).selectAll("rect")
     .data(function(d) {return d; })
     .enter().append("rect")
       .attr("x", function(d) {return xScale(d.data.key); })
       .attr("y", function(d) { return yScale(d[1]); })
       .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
       .attr("width", xScale.bandwidth());


     var hoverRectSelection = "div"+chartId+">svg>g>g.data-rectangles";
    dataRect.selectAll('.stack>rect').on("mouseover", function(d) {
              d3StackedBarMouseOver(d, xScale, yScale, yScale2);
          })
      .on("mouseout", function(d) {
            tooltip.classed('hidden', true);
            // d3.selectAll(hoverRectSelection).remove();
        })
  }

  function unGroupData(data){
      // Flatten or ungroup nested data
      var dataUnGrouped = [];

      data.forEach(function(d){
    	var xDate = d.date;
    	d.date = xDate.replace("00:00:00", "");
	    //d.date = parseTime(d.date);
        for( i in d.values) {
        dataUnGrouped.push({
          "date": d.date,
          "x": d.x,
          "group": d.labels[i],
          "value": d.values[i],
          "total": d.values.reduce((a, b) => a + b, 0)
        });
       }
      })

      dataUnGrouped.forEach(function(d){
        if(d.group == "sleep") d.sleep = d.value;
        if(d.group == "nap") d.nap = d.value;
        if(d.group == "sedentary") d.sedentary = d.value;
        if(d.group == "light") d.light = d.value;
        if(d.group == "moderate") d.moderate = d.value;
        if(d.group == "vigorous") d.vigorous = d.value;
      })
      return dataUnGrouped;
    }

  function formatGroupData(data){
    var xData = [];

    xData.forEach(function(d){
      if(d.group == "sleep") d.sleep = d.value;
      if(d.group == "nap") d.nap = d.value;
      if(d.group == "sedentary") d.sedentary = d.value;
      if(d.group == "light") d.light = d.value;
      if(d.group == "moderate") d.moderate = d.value;
      if(d.group == "vigorous") d.vigorous = d.value;
    })

    data.forEach(function(d){
        d.values.forEach(function(e) {
          xData.push({
            "key": d.key,
            "group": e.group,
            "value": e.value,
            "total": e.total
            })
        })
    })
    xData.forEach(function(d){
      if(d.group == "sleep") d.sleep = d.value;
      if(d.group == "nap") d.nap = d.value;
      if(d.group == "sedentary") d.sedentary = d.value;
      if(d.group == "light") d.light = d.value;
      if(d.group == "moderate") d.moderate = d.value;
      if(d.group == "vigorous") d.vigorous = d.value;
    })
    for(i in data){
      for(j in xData){
        if(xData[j].key == data[i].key){
          data[i].total = xData[j].total;
          // groupData[i].group = xData[j].group;

          if(xData[j].group == "sleep")  data[i].sleep = xData[j].value;
          if(xData[j].group == "nap")  data[i].nap = xData[j].value;
          if(xData[j].group == "sedentary")  data[i].sedentary = xData[j].value;
          if(xData[j].group == "light")  data[i].light = xData[j].value;
          if(xData[j].group == "moderate")  data[i].moderate = xData[j].value;
          if(xData[j].group == "vigorous")  data[i].vigorous = xData[j].value;
        }
      }
    }
    return data;
    }

  function filterEnabled(data) {
      // Filtering data based on d.enabled (written for legend filtering)
      var filteredData = [];
      for(i in data){
        if(data[i].enabled ==true){
          filteredData.push(data[i])
        }}
      return filteredData;
     }

  function drawLegend(groupData, jsonData, colorScale){
    //  Generate legend based on datapoints
    d3.select("div"+chartId).append("ul").attr("class", "legend float-sm-right");

    var legendSelection = "div"+chartId+">ul.legend";
    d3.selectAll(legendSelection+">li").remove();
    var legendItem = d3.select(legendSelection)
      .selectAll("li")
      .data(jsonData)
      .enter()
      .append("li");
    legendItem
      .append("span")
      .attr("id", "color-circle")
      .style("background", function(d, i) {
        return colorScale(d.key)
      });
    legendItem
      .append("span")
      .text(function(d) {
        return (d.key)
      });
    var keyValue = [];
    legendItem
      .on('click', function(d) {
        // data Filter - onClick functionality for Legend
        d3.select(this).select("span").classed("legend-active",d3.select(this).select("span").classed("legend-active")? false: true);
        d.enabled = !d.enabled;
        var filteredKey = d.key;
        groupData.forEach(function(e){
          if(d.enabled == false){
            keyValue.push({
              "key": e.key,
              [filteredKey]: e[filteredKey],
              "total": e.total
              })
            e.total = e.total - e[filteredKey]
            e[filteredKey] = null;
           }
           else {
             groupData.forEach(function(e){
               keyValue.forEach(function(f){
               e.total = f.total + f[filteredKey]
               e[filteredKey]= f[filteredKey]
               })
             })
           }
        })
        console.log(keyValue, groupData);
        var xx = stack.keys(allKeys)(groupData);
        // console.log(xx);
        var fData= filterEnabled(xx)//(data);
        d3.selectAll("div"+chartId+">svg>g>g.data-rectangles").remove();
        drawStackedBar(xx, width, height);
       });
  }

  function d3StackedBarMouseOver(d, xScale, yScale, yScale2){
    // show tooltip on mouse hover
    var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
    var mouse = d3.mouse(svg.node()).map(function(d) {
        return parseInt(d);
    });

    var tooltipHtml = "<p>"+xLabel+": <b>"+d.data.key+"</b></p>";
    tooltip.html(tooltipHtml)
    .classed('hidden', false);

    if(mouse[0]<parentDiv.width/2){
      tooltip.style('left', mouse[0] + 50 + 'px')
      .style('top', mouse[1] + 'px');
    }
    else {
      tooltip.style('left', mouse[0] -150 + 'px')
      .style('top', mouse[1] + 'px');
    }
    }

}
