function StackedBarChart(data,chartWrapper, chartId, xAxisLabel, yAxisLabel){
  // Create/Set DOM selectors, margins and chart dimensions
  var margin = { top: 30, right: 50,  bottom: 70, left: 70 };
  var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
  console.log(parentDiv.width);
  var containerwidth = parentDiv.width;
  var containerheight = 280;
  var width = containerwidth - margin.left - margin.right;
  var height = containerheight - margin.top - margin.bottom;

  d3.selectAll("div"+chartId+">svg").remove();
  var stack = d3.stack()
	  .order(d3.stackOrderNone)
	  .offset(d3.stackOffsetExpand);
  // Call data and add enabled key - for legend toggling functionality
  var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S") //d3.timeParse("%b %d, %Y %H:%M:%S");
  // Ungroup data and find maxX and maxY value
  var newData = unGroupData(data);
  var allKeys = ["sleep","nap","sedentary","light","moderate","vigorous"];
  var groupData = d3.nest().key(function(d){
	  return d.date;
	}).entries(newData);
  groupData = formatGroupData(groupData);
  var colorScale = d3.scaleOrdinal().range(["#3182bd", "#9ecae1", "#fee5d9", "#fcae91", "#fb6a4a", "#de2d26"]);
  colorScale.domain(allKeys);
  var newGroupData = stack.keys(allKeys)(groupData);
	newGroupData.forEach(function(d) {
	 d.enabled = true;
	});

  //drawLegend appends to the chartId div and does not require SVG
  drawLegend(newGroupData);

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
  .attr('class', 'd3-stack-barchart-tooltip hidden');

  // Create Chart Axis labels and scales
  var xLabel = xAxisLabel;
  var xScale = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1);  // d3.scaleTime().rangeRound([0, width], .1, 0);
  var yLabel = yAxisLabel;
  var yScale = d3.scaleLinear()
    .range([height, 0]);
  var yScale2 = d3.scaleLinear()
      .range([height, 0]);

  //  Create groups for x and y axis labels
  var axisSelection = "div"+chartId+">svg>g";
  var xAxisG = d3.select(axisSelection).append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr("class", "xAxisG");
  xAxisG.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', 70)
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
    .scale(xScale)
    .ticks(3)
    .tickPadding(2)
    .tickSize(-height);

  var yAxis = d3.axisLeft()
    .scale(yScale2)
    .ticks(5)
    .tickPadding(15)
    .tickSize(-width);


  // Set xScale and yScale
  xScale.domain(groupData.map(function(d) { return d.key; }))
  yScale2.domain([0, d3.max(groupData, function(d) { return d.total; })]);


  // call functions from this file to generate axis, legend and barChart
  var xAxisTickSelection = "div"+chartId+">svg>g>g.xAxisG>g.tick>text";

  xAxisG.call(xAxis)
  	.selectAll(xAxisTickSelection)
  	.attr("dx", "-1.5em")
    .attr("dy", "1.1em")
  	.style("text-anchor", "end")
    .attr("transform", "rotate(-35)");

  yAxisG.call(yAxis);

  drawStackedBar(newGroupData, xScale, yScale);

  // FEATURE - Redraw chart on window resize
  $(window).on('resize', function() {
      var margin = { top: 30, right: 50,  bottom: 70, left: 70 };
      var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
      console.log(parentDiv.width);
      var containerwidth = parentDiv.width;
      var containerheight = 280;
      var width = containerwidth - margin.left - margin.right;
      var height = containerheight - margin.top - margin.bottom;

      xAxisG.attr('transform', `translate(0, ${height})`).attr('x', width / 2);

      yAxisG.attr('x', -height / 2)

      xAxis.tickSize(-height);

      yAxis.tickSize(-width);
      xScale
      .range([0, width]);

      yScale
      .range([height, 0]);

      d3.select(chartId + ' svg, ' + chartId + ' svg g').attr('width', containerwidth).attr('height', containerheight);

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);
      d3.select(axisSelection+'>g.xAxisG>text').remove();
      d3.select(axisSelection+'>g.yAxisG>text').remove();
      d3.selectAll("div"+chartId+">svg>g>g.data-rectangles").remove();

      xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('x', width / 2)
          .attr('y', 70)
          .text(xLabel);
      yAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('x', -height / 2)
          .attr('y', -55)
          .attr('transform', `rotate(-90)`)
          .style('text-anchor', 'middle')
          .text(yLabel);
      drawStackedBar(newGroupData
        , xScale, yScale);
    });

  // ################################
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
          // "color": d.color,
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
        return colorScale(d.key)
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
        var fData= filterEnabled(data);
        d3.selectAll("div"+chartId+">svg>g>g.data-rectangles").remove();
        drawStackedBar(fData, xScale, yScale);
       });
  }

  function drawStackedBar(jsonData, xScale, yScale){
    // console.log(jsonData);
	  if(d3.selectAll("div"+chartId+">svg>g>g") != null){ console.log("hi", chartId);}
    //  clear existing data points, rectangles or tooltips on svg if any
    d3.selectAll("div"+chartId+">svg>g>g.data-rectangles").remove();
    tooltip.classed('hidden', true);

    var dataRect = g.append('g')
        .attr("class", "data-rectangles");

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
