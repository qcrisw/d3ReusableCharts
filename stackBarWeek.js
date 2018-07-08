function StackedBarChart2(data,chartWrapper, chartId, xAxisLabel, yAxisLabel){


  // Create/Set DOM selectors, margins and chart dimensions
  var parentNode = d3.select(chartWrapper).node(),
      parent = chartId;
  var margin = { left: 70, right: 20, top: 10, bottom: 120 };
  var containerwidth = parentNode.getBoundingClientRect().width - 20,
  containerheight = parentNode.getBoundingClientRect().height - 30,
  width = containerwidth - margin.left - margin.right,
  height = containerheight - margin.top - margin.bottom;


    var stack = d3.stack()
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetExpand);

      // Call data and format data
      data.sort(function(a,b) { return a.x - b.x; });
      var newData = unGroupData(data);
      var allKeys = ["sleep","nap","sedentary","light","moderate","vigorous"];

      var groupData = d3.nest().key(function(d){
        return d.x;
      }).entries(newData);

      groupData = formatGroupData(groupData);

      var colorScale = d3.scaleOrdinal().range(["#3182bd", "#9ecae1", "#fee5d9", "#fcae91", "#fb6a4a", "#de2d26"]);
      colorScale.domain(allKeys);

      var newGroupData = stack.keys(allKeys)(groupData);
      newGroupData.forEach(function(d) {
       d.enabled = true;
      });
      drawLegend(newGroupData);


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
  .attr('class', 'd3-stack-barchart-week-tooltip hidden');


  // Create Chart Axis labels and scales
  var xLabel = xAxisLabel;
  var xScale = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1);
  var yLabel = yAxisLabel;
  var yScale = d3.scaleLinear()
    .rangeRound([height, 0]);
  var yScale2 = d3.scaleLinear()
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
    .scale(xScale)
    .ticks(10)
    .tickSize(-height);
  var yAxis = d3.axisLeft()
    .scale(yScale2)
    .ticks(10)
    .tickPadding(15)
    .tickSize(-width);


  // Set xScale and yScale
  xScale.domain(groupData.map(function(d) { return d.key; }))
  yScale2.domain([0, d3.max(groupData, function(d) { return d.total; })]);

  // call functions from this file to generate axis, legend and barChart
  var xAxisTickSelection = "div"+parent+">svg>g>g.xAxisG>g.tick>text";

  xAxisG.call(xAxis).selectAll(xAxisTickSelection).style("text-anchor", "end");

  yAxisG.call(yAxis);

  drawStackedBarWeek(newGroupData, xScale, yScale);

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
      xScale
      .range([0, width]);

      yScale
      .range([height, 0]);

      d3.select(parent + ' svg, ' + parent + ' svg g').attr('width', containerwidth).attr('height', containerheight);

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);
      d3.select(axisSelection+'>g.xAxisG>text').remove();
      d3.select(axisSelection+'>g.yAxisG>text').remove();
      d3.select('data-rectangles-week').remove();

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
      drawStackedBarWeek(newGroupData, xScale, yScale);
    });

  // ################################
  function unGroupData(data){
      // Flatten or ungroup nested data
      var dataUnGrouped = [];

      data.forEach(function(d){
        for( i in d.values) {
        dataUnGrouped.push({
          "x": d.x,
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
    d3.select("div"+parent).append("ul").attr("class", "legend float-sm-right");
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
        drawStackedBarWeek(fData, xScale, yScale);
       });
  }

  function drawStackedBarWeek(jsonData, xScale, yScale){
    console.log(jsonData);
    //  clear existing data points, rectangles or tooltips on svg if any
    d3.selectAll('g.data-rectangles-week').remove();
    d3.selectAll("div"+parent+">svg>g>g.stack").remove();
    tooltip.classed('hidden', true);

    var dataRect = g.append('g')
        .attr("class", "data-rectangles-week");

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

      var hoverRectSelection = "div"+parent+">svg>g>g.data-rectangles-week";
     dataRect.selectAll('.stack>rect').on("mouseover", function(d) {
               d3StackedBarMouseOver(d, xScale, yScale, yScale2);
           })
       .on("mouseout", function(d) {
             tooltip.classed('hidden', true);
             // d3.selectAll(hoverRectSelection).remove();
         })
  }

  function d3StackedBarMouseOver(d, xScale, yScale, yScale2){
    // show tooltip and rectangles on mouse hover
    // var x = event.clientX;
    // var y = event.clientY;
    var mouse = d3.mouse(svg.node()).map(function(d) {
        return parseInt(d);
    });
    var left = Math.min(containerwidth, mouse[0]+margin.left+margin.right),
    top = Math.min(containerheight, mouse[1]+margin.top+margin.right);
    var tooltipHtml = "<p>"+xLabel+": <b>"+d.data.key+"</b></p>";
    tooltip.html(tooltipHtml)
    .classed('hidden', false)
    // .style('left', x + 'px')
    // .style('top', y + 'px');
    .style('left', left + 'px')
    .style('top', top + 'px');
    }

}
