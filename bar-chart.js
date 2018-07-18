function GroupedBarChart(data,chartWrapper, chartId, xAxisLabel, yAxisLabel){
  // Create/Set DOM selectors, margins and chart dimensions
  var margin = { top: 30, right: 50,  bottom: 70, left: 70 };
  var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
  var containerwidth = parentDiv.width;
  var containerheight = 280;
  var width = containerwidth - margin.left - margin.right;
  var height = containerheight - margin.top - margin.bottom;

d3.selectAll("div"+chartId+">svg").remove();
  // Call data and add enabled key - for legend toggling functionality
  data.forEach(function(d) {
   d.enabled = true;
  });

  var allX = [];
  var maxXY = findMaxXY(data);
  var newData = unGroupData(data);
  newData.sort(function(a,b){
	    return a.x - b.x;
	  })
	  console.log(newData)
  var keys = [data[0].key, data[1].key];
  
  //drawLegend appends to the chartId div and does not require SVG
  drawLegend(data);
  
  // Create SVG with chart dimensions
  var svg = d3.select(chartId)
  .append('svg')
  .attr('width', containerwidth)
  .attr('height', containerheight);
  var g = svg
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  //  Create tool tip
  var tooltip = d3.select(chartId)
  .append('div')
  .attr('class', 'd3-grouped-barchart-tooltip hidden');

  // Create Chart Axis labels and scales
  var xLabel = xAxisLabel;
  var x0Scale = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1);
  var x1Scale = d3.scaleBand().padding(0.05);
  var yLabel = yAxisLabel;
  var yScale = d3.scaleLinear().rangeRound([height, 0]);

  //  Create groups in svg for x and y axis labels and add labels
  var gSelection = "div"+chartId+">svg>g";
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

  // Create d3 axis and set axis ticks & size
  var xAxis = d3.axisBottom()
    .scale(x0Scale)
    .ticks(10)
    .tickPadding(15)
//    .tickFormat(d3.format(".0s"))
    .tickSize(-height);
  var yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(10)
    .tickPadding(15)
    //.tickFormat(d3.format(".0s"))
    .tickSize(-width);

  // Set x0Scale and yScale
  // x0Scale.domain(d3.extent(allX))//[0, maxXY[0]]);
  x0Scale.domain(allX);
  x1Scale.domain(keys).rangeRound([0, x0Scale.bandwidth()]);
  yScale.domain([0, maxXY[1]]).range([height, 0]);

  // call functions from this file to generate axis, legend and barChart
   var xAxisTickSelection = "div"+chartId+">svg>g>g.xAxisG>g.tick>text";

  xAxisG.call(xAxis)
  	  .selectAll(xAxisTickSelection)
  	  .attr("dx", "-1.5em")
      .attr("dy", "-1.1em")
	  .attr("transform", "rotate(-65)"); 
  yAxisG.call(yAxis);
  drawGroupedBar(newData, x0Scale, yScale);

  // FEATURE - Redraw chart on window resize
  $(window).on('resize', function() {
      var margin = { top: 30, right: 50,  bottom: 70, left: 70 };
      var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
      console.log(parentDiv.width, data);
      var containerwidth = parentDiv.width;
      var containerheight = 280;
      var width = containerwidth - margin.left - margin.right;
      var height = containerheight - margin.top - margin.bottom;

      xAxisG.attr('transform', `translate(0, ${height})`).attr('x', width / 2);

      yAxisG.attr('x', -height / 2)

      xAxis.tickSize(-height);

      yAxis.tickSize(-width);
      x0Scale
      .range([0, width]);

      yScale
      .range([height, 0]);

      d3.select(chartId + ' svg, ' + chartId + ' svg g').attr('width', containerwidth).attr('height', containerheight);

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);
      d3.selectAll(gSelection+'>g.xAxisG>text').remove();
      d3.selectAll(gSelection+'>g.yAxisG>text').remove();
      d3.selectAll(gSelection+">g.data-points-groupedbar").remove();

      xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('x', width / 2)
          .attr('y', 45)
          .text(xLabel);
      yAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('x', -height / 2)
          .attr('y', -55)
          .attr('transform', `rotate(-90)`)
          .style('text-anchor', 'middle')
          .text(yLabel);
      drawGroupedBar(newData, x0Scale, yScale);
    });


  // ################################
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
        drawGroupedBar(fDataUG, x0Scale, yScale);
       });
  }

  function drawGroupedBar(jsonData, x0Scale, yScale){
    //  clear existing data points, rectangles or tooltips on svg if any
    var rectSelection = "div"+chartId+">svg>g>g.data-points-groupedbar";
    d3.selectAll(rectSelection).remove();
    tooltip.classed('hidden', true);
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

  function d3GroupedBarMouseOver(d, x0Scale, yScale, yScale2){
    // show tooltip and rectangles on mouse hover
    // var x = event.clientX;     // Get the horizontal coordinate
    // var y = event.clientY;     // Get the vertical coordinate
    // var tooltipHtml = "<p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
    // tooltip.html(tooltipHtml)
    // .classed('hidden', false)
    // .style('left', x + 'px')
    // .style('top', y + 'px');
    var mouse = d3.mouse(svg.node()).map(function(d) {
        return parseInt(d);
    });
    var left = Math.min(containerwidth, mouse[0]+margin.left+margin.right),
    top = Math.min(containerheight, mouse[1]+margin.top+margin.right);
    var tooltipHtml = "<p class='text-capitalize'>Subject: <b>"+d.label+"</b></p><p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
    if(d.values !=null && d.values.length >> 0){
      tooltipHtml +="<p>Group Size: <b>"+ d.values.length+"</b></p>";
    }

    var tooltipHtml = "<p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
    if(d.values !=null && d.values.length >> 0){
      tooltipHtml +="<p>Group Size: <b>"+ d.values.length+"</b></p>";
    }
    tooltip.html(tooltipHtml)
    .classed('hidden', false)
    // .style('left', x + 'px')
    // .style('top', y + 'px');
    .style('left', left + 'px')
    .style('top', top + 'px');

    }
} // end of GroupedBarChart()
