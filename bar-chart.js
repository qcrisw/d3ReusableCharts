/**
* GroupedBarChart() is a nested function which takes data, dom identifiers such as chartWrapper and ChartID, and axis labes as input arguments
* This nested function extensively uses d3.js to create a grouped bar chart
* The drawGroupedBar() function maps data and creates rectangles in data-points-groupedbar group inside the SVG
**/

function GroupedBarChart(data,chartWrapper, chartId, xAxisLabel, yAxisLabel){

  // Create/Set DOM selectors, margins and chart dimensions
  var margin = { top: 30, right: 35,  bottom: 70, left: 70 };
  var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
  var containerheight = 280;
  var width = parentDiv.width - margin.left - margin.right;
  var height = containerheight - margin.top - margin.bottom;
  var xLabel = xAxisLabel;
  var yLabel = yAxisLabel;

  // Remove svg under this div, if any
  d3.selectAll("div"+chartId+">svg").remove();

  // DATA MANIPULATION & MODELLING
  var allX = [];
  // add enabled key - for legend toggling functionality
  data.forEach(function(d) {
   d.enabled = true;
  });
  var maxXY = findMaxXY(data);
  allX.sort(function(a, b){return a-b});
  var newData = unGroupData(data);
  newData.sort(function(a,b){
	    return a.x - b.x;
	  })
  var keys = [data[0].key, data[1].key];

  //drawLegend appends to the chartId div and call it here, as it does not require SVG
  drawLegend(data);

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
  .attr('class', 'd3-grouped-barchart-tooltip hidden');

  // fn call to generate GroupedBarChart
  drawGroupedBar(newData, width, height);

  // FAETURE - Redraw chart on window resize
  $(window).on('resize', function() {
    var margin = { top: 30, right: 35,  bottom: 70, left: 70 };
    var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
    var containerheight = 280;
    var width = parentDiv.width - margin.left - margin.right;
    var height = containerheight - margin.top - margin.bottom;
    drawGroupedBar(newData, width, height);
    });


  // ############## ALL FUNCTIONS ##################
  function drawGroupedBar(jsonData, width, height){
      /**
      * takes grouped data (jsonData) as is
      * drawGroupedBar plots datapoints as rectangles on SVG based on groups
      * has function calls for mouseevents
      **/

      //  clear existing data points, rectangles or tooltips on svg if any
      d3.selectAll(gSelection+">g").remove();
      var rectSelection = "div"+chartId+">svg>g>g.data-points-groupedbar";
      d3.selectAll(rectSelection).remove();
      tooltip.classed('hidden', true);
      d3.selectAll(gSelection+'>g.xAxisG>text').remove();
      d3.selectAll(gSelection+'>g.yAxisG>text').remove();
      d3.selectAll(gSelection+">g.data-points-groupedbar").remove();

      // Create Chart Axis scales
      var x0Scale = d3.scaleBand();
      var x1Scale = d3.scaleBand().paddingInner(0.05);

      var xAxis = d3.axisBottom()
        .scale(x0Scale)
        .ticks(10)
        .tickPadding(15)
        .tickSize(-height);
      x0Scale.domain(allX).range([0, width]);
      x1Scale.domain(keys).rangeRound([0, x0Scale.bandwidth()]);
      var mult = Math.max (1, Math.floor (width / x0Scale.domain().length));
      x0Scale.rangeRound([0, (x0Scale.domain().length * mult)], 0.1, 0);
      var newWidth = x0Scale.domain().length * mult;  // new width based on xAxis - to be used for y Axis ticks size
      var yScale = d3.scaleLinear().rangeRound([height, 0]);
      var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(10)
        .tickPadding(15)
        //.tickFormat(d3.format(".0s"))
        .tickSize(-newWidth);
      yScale.domain([0, maxXY[1]]).range([height, 0]).nice();


      //  Create groups in svg for x and y axis labels and add text labels
      var xAxisG = d3.select(gSelection).append('g')
          .attr("class", "xAxisG")
          .attr('transform', `translate(0, ${height})`);
      xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('x', width / 2)
          .attr('y', 45)
          .style('text-anchor', 'middle')
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

      // call functions to generate axis & legend
      xAxisG.call(xAxis)
        .selectAll(xAxisTickSelection)
        .attr("dx", "-1.5em")
        .attr("dy", "-1.1em")
        .attr("transform", "rotate(-65)");
      yAxisG.call(yAxis);

    //  Draw  rectangles
    var dataPointsG = g.append('g')
    .attr("class", "data-points-groupedbar");
    dataPointsG
       .selectAll("rect")
       .data(jsonData)
       .enter().append("rect")
       .attr("transform", function(d) { return "translate(" + x0Scale(d.x) + ",0)"; })
         .attr("x", function(d) { return x1Scale(d.key); })
         .attr("y", function(d) { return yScale(d.y); })
         .attr("width", x1Scale.bandwidth())
         .attr("height", function(d) { return height - yScale(d.y) + 1; })
         .attr("fill", function(d) { return d.color; })
      .on('mouseover', function(d){
        d3GroupedBarMouseOver(d);
      })
      .on("mouseout", function(d) {
            tooltip.classed('hidden', true);
        });
  }

  function findMaxXY(data){
    // find max value of xMax and yMax in data for Axis scales
    var i,j,xMax,yMax;

    var allY = [];
    for(i in data) {
      for(j=0; j<data[i].values.length; j++){
      allX.push(data[i].values[j][0])
      allY.push(data[i].values[j][1])
    }
      xMax = allX.reduce(function(a, b) { return Math.max(a, b); });
      yMax = allY.reduce(function(a, b) { return Math.max(a, b); });
    }
    return [xMax, yMax];
  }

  function unGroupData(data){
      // Flatten or ungroup nested data
      var dataUnGrouped = [];

      data.forEach(function(d){
          d.values.forEach(function(e) {
          dataUnGrouped.push({
          "enabled": d.enabled,
          "key": d.key,
          "color": d.color,
          "x": e[0],
          "y": e[1],
          // "values": d.values // copies entire inner array values
            })
          })
      })
      return dataUnGrouped;
    }

  function filterEnabled(jsonData) {
      // Filtering data based on d.enabled (written for legend filtering)
      var filteredData = [];
      for(i in jsonData){
        if(jsonData[i].enabled ==true){
          filteredData.push(jsonData[i])
        }}
      return filteredData;
     }

  function drawLegend(data){
    //  Generate legend based on datapoints
    d3.select("div"+chartId).append("ul").attr("class", "legend float-sm-right");
    var legendSelection = "div"+chartId+">ul.legend";
    d3.selectAll(legendSelection+">li").remove();
    var legendItem = d3.select(legendSelection)
      .selectAll("li")
      .data(data)
      .enter()
      .append("li");
    legendItem
      .append("span")
      .attr("id", "color-circle")
      .style("background", function(d, i) {
        return d.color;
      });
    legendItem
      .append("span")
      .text(function(d) {
        return (d.key)
      });

    legendItem
      .on('click', function(d) {
        // data Filter - onClick functionality for Legend
        d3.select(this).select("span").classed("legend-active", d3.select(this).select("span").classed("legend-active")? false: true);
        d.enabled = !d.enabled;
        var ungroupNAD = unGroupData(data);
        var fDataUG= filterEnabled(ungroupNAD);
        drawGroupedBar(fDataUG, width, height);
       });
  }

  function d3GroupedBarMouseOver(d){
    // show tooltip on mouse hover
    var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
    var mouse = d3.mouse(svg.node()).map(function(d) {
        return parseInt(d);
    });

    var tooltipHtml = "<p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
    if(d.values !=null && d.values.length >> 0){
      tooltipHtml +="<p>Group Size: <b>"+ d.values.length+"</b></p>";
      }
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
