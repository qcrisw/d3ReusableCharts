function StackedBarChart(data,chartWrapper, chartId, xAxisLabel, yAxisLabel){


  // Create/Set DOM selectors, margins and chart dimensions
  var parentNode = d3.select(chartWrapper).node(),
      parent = chartId;
  var margin = { left: 70, right: 20, top: 10, bottom: 120 };
  var containerwidth = parentNode.getBoundingClientRect().width,
  containerheight = parentNode.getBoundingClientRect().height,
  width = containerwidth - margin.left - margin.right,
  height = containerheight - margin.top - margin.bottom;

  // Create SVG with chart dimensions
  var svg = d3.select(parent)
  .append('svg')
  .attr('width', containerwidth)
  .attr('height', containerheight);
  var g = svg
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  //  Create tooltip
  var tooltip = d3.select(parent)
  .append('div')
  .attr('class', 'd3-grouped-barchart-tooltip hidden');


  // Create Chart Axis labels and scales
  var xLabel = xAxisLabel;
  var x0Scale = d3.scaleTime().rangeRound([0, width], .1, 0);
  var x1Scale = d3.scaleBand().paddingInner(0.05);
  var yLabel = yAxisLabel;
  var yScale = d3.scaleLinear()
    .rangeRound([height, 0]);


  //  Create groups for x and y axis labels
  var axisSelection = "div"+parent+">svg>g";
  var xAxisG = d3.select(axisSelection).append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr("class", "xAxisG");
      xAxisG.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', 45)
      .text(xLabel);
  var yAxisG = d3.select(axisSelection).append('g')
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
    .tickFormat(d3.timeFormat('%Y-%M-%d'))
    .tickSize(-height);
  var yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(10)
    .tickPadding(15)
    .tickSize(-width);


  // Call data and add enabled key - for legend toggling functionality
  var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
  data.forEach(function(d) {
   d.enabled = true;
   // d.x = parseTime(d.x);
  });



  var allX = [];
  // Ungroup data and find maxX and maxY value
  var maxXY = findMaxXY(data);
  var newData = unGroupData(data);
  var keys = [];

  for(i in data){
    keys.push(data[i].key)
  }

  // Set x0Scale, x1Scale and yScale
  // x0Scale.domain(d3.extent(allX))//[0, maxXY[0]]);
  x0Scale.domain(allX);//.range([0, width], 0.1);
  x1Scale.domain(keys).rangeRound([0, width]);
  yScale.domain([0, maxXY[1]]).range([height, 0]);

  // call functions from this file to generate axis, legend and barChart
  var xAxisTickSelection = "div"+parent+">svg>g>g.xAxisG>g.tick>text"
  xAxisG.call(xAxis).selectAll(xAxisTickSelection).style("text-anchor", "end")
  .attr("transform", "rotate(-65)");
  yAxisG.call(yAxis);
  drawLegend(data);
  drawStackedBar(newData, x0Scale, yScale);

  // FEATURE - Redraw chart on window resize
  $(window).on('resize', function() {
      containerwidth = parentNode.getBoundingClientRect().width,
      containerheight = parentNode.getBoundingClientRect().height,
      width = containerwidth - margin.left - margin.right,
      height = containerheight - margin.top - margin.bottom;

      xAxisG.attr('transform', `translate(0, ${height})`).attr('x', width / 2);

      yAxisG.attr('x', -height / 2)

      xAxis.tickSize(-height);

      yAxis.tickSize(-width);
      x0Scale
      .range([0, width]);

      yScale
      .range([height, 0]);

      d3.select(parent + ' svg, ' + parent + ' svg g').attr('width', containerwidth).attr('height', containerheight);

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);
      d3.select(axisSelection+'>g.xAxisG>text').remove();
      d3.select(axisSelection+'>g.yAxisG>text').remove();
      d3.select('data-points-groupedbar').remove();

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
      drawStackedBar(newData, x0Scale, yScale);
    });

  // ################################
  function findMaxXY(data){
    // find max value of xMax and yMax in data for Axis scales
    var i,j,xMax,yMax;

    var allY = [];
    for(i in data) {
      for(j=0; j<data[i].values.length; j++){
        allX.push(data[i].values[j].x)
        allY.push(data[i].values[j].y)
        var x = data[i].values[j].values;
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
            "x": parseTime(e.x),
            "y": e.y,
            "label": e.label
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
    var legendSelection = "div"+parent+">ul.legend";
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
        drawStackedBar(fDataUG, x0Scale, yScale);
       });
  }

  function drawStackedBar(jsonData, x0Scale, yScale){
    //  clear existing data points, rectangles or tooltips on svg if any
    var rectSelection = "div"+parent+">svg>g>g>g>rect";
    d3.selectAll(rectSelection).remove();
    tooltip.classed('hidden', true);
    console.log(data, jsonData);
    var dataPointsG = g.append('g')
      .attr("class", "data-points-stackedbar");
    dataPointsG
       .selectAll("g")
       .data(jsonData)
       .enter().append("g")
       .attr("transform", function(d) { return "translate(" + x0Scale(d.x) + ",0)"; }).selectAll("rect")
       .data(function(d) { return keys.map(function(key) { return {key: key, value: d.y, color:d.color}; }); })//jsonData)
       .enter().append("rect")
       .attr("x", function(d) { return x1Scale(d.key); })
       .attr("y", function(d) { return yScale(d.value); })
       .attr("width", x1Scale.bandwidth())
       .attr("height", function(d) { return height - yScale(d.value) + 1; })
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
      var mouse = d3.mouse(svg.node()).map(function(d) {
          return parseInt(d);
      });
      var left = Math.min(containerwidth, mouse[0]+margin.left+margin.right),
      top = Math.min(containerheight, mouse[1]+margin.top+margin.right);
      var tooltipHtml = "<p class='text-capitalize'>Subject: <b>"+d.label+"</b></p><p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
      tooltip.html(tooltipHtml)
      .classed('hidden', false)
      .style('left', left + 'px')
      .style('top', top + 'px');
    }

} // end of GroupedBarChart()
