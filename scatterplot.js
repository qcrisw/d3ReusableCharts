
function Scatterplot(dataFile, chartWrapper, chartId, xAxisLabel, yAxisLabel) {
    var parentNode = d3.select(chartWrapper).node(),
        parent = chartId;
    const margin = { left: 70, right: 10, top: 10, bottom: 120 };

    var containerwidth = parentNode.getBoundingClientRect().width,
    containerheight = parentNode.getBoundingClientRect().height,
    width = containerwidth - margin.left - margin.right,
    height = containerheight - margin.top - margin.bottom;

    var svg = d3.select(parent)
    .append('svg')
    .attr('width', containerwidth)
    .attr('height', containerheight);
    var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var tooltip = d3.select(parent)
    .append('div')
    .attr('class', 'd3-tooltip hidden');

    var format = d3.format(".2s");
    const xValue = d => d.x;
    const xLabel = xAxisLabel;
    const yValue = d => d.y;
    const yLabel = yAxisLabel;

	  //grid lines
		const xScale = d3.scaleLinear();
		const yScale = d3.scaleLinear();

    const xAxisG = g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr("class", "xAxisG");
    xAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', 45)
        .text(xLabel);

    const yAxisG = g.append('g')
        .attr("class", "yAxisG");
    yAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('transform', `rotate(-90)`)
        .style('text-anchor', 'middle')
        .text(yLabel);

		// axis
    const xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(10)
      .tickPadding(15)
      .tickFormat(function(d) {return format(d)})
      .tickSize(-height);
    const yAxis = d3.axisLeft()
      .scale(yScale)
      .ticks(10)
      .tickPadding(15)
      .tickFormat(function(d) {return format(d)})
      .tickSize(-width);

    var dataCirclesG = g.append('g').attr("class", "data-points");

  d3.json(dataFile, function(error, data) {
    if (error) throw error;
    data.forEach(function(d) {
     d.enabled = true;  // for legend toggling
   });
    var newData = unGroupData(data);

    var maxXY = findMaxXY(data);

    xScale
    .domain([0, maxXY[0]])
    .range([0, width])
    .nice();

    yScale
    .domain([0, maxXY[1]])
    .range([height, 0])
    .nice();

    // second yScale for invert height range starting 0
    const yScale2 = d3.scaleLinear()
    .domain([0, maxXY[1]])
  	.range([0, height])
  	.nice();

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);
    drawScatterplot(newData, xScale, yScale, yScale2);
    drawLegend(data);


    function drawScatterplot(jsonData, xScale, yScale, yScale2) {
      tooltip.classed('hidden', true);
      var dataCirclesG = g.append('g').attr("class", "data-points");

      // exit the whole group
      dataCirclesG.exit().remove();

      dataCirclesG.selectAll('circle')
      .data(jsonData)
      .enter().append('circle')
      .attr('fill', d => d.color)
      .attr('fill-opacity', 1.0)
      .attr('cx', d => xScale(xValue(d)))
      .attr('cy', d => yScale(yValue(d)))
      .attr('r', 8)
      .style("opacity", 0.8)
      .on("mouseover", function(d) {
            d3ScatterplotMouseOver(d, xScale, yScale, yScale2);
        })
      .on("mouseout", function(d) {
            tooltip.classed('hidden', true);
            d3.selectAll('rect').remove();
        })
      .on("click", function(d) {
            // removeNewlyAdded(jsonData, d)
            d3ScatterplotClick(d);
      })
      .on("dblclick", function(d) {
          d3.select(this).remove();
      });
    }

    function removeNewlyAdded(dataUG, d) {
          console.log(d.values);
          for(i in dataUG){
            console.log(i);
            if(dataUG[i].newlyAdd == 1){
              console.log(dataUG[i])
            }}
        return dataUG;
    }

    function filterEnabled(dataUG) {
      var fData = [];
      for(i in dataUG){
        if(dataUG[i].enabled ==true){
          fData.push(dataUG[i])
        }}
      return fData;
     }

    function drawLegend(data){
      var legendItem = d3.select(".legend")
        .selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .on('click', function(d) {
          d.enabled = !d.enabled;
          var ungroupNAD = unGroupData(data);
          var fDataUG= filterEnabled(ungroupNAD);
          d3.selectAll('circle').remove();
          drawScatterplot(fDataUG, xScale, yScale, yScale2)
         });
       legendItem
       .append("span")
       .attr("class", "color-circle")
       .style("background", function(d, i) {
         return d.color;
       })
       .style("border", "1px solid #fff !important")
       .style("border-color", toggleColor());

       legendItem
         .append("span")
         .text(function(d) {
           return (d.key)
         });
    }

    function toggleColor(){
        var currentColor = "#fff";

         return function(){
             currentColor = currentColor == "#fff" ? "#f00" : "#fff";
             d3.select(this).style("border-color", currentColor);
           }
     }

      function d3ScatterplotMouseOver(d, xScale, yScale, yScale2){
        //tooltip
        var mouse = d3.mouse(svg.node()).map(function(d) {
            return parseInt(d);
        });
        var left = Math.min(containerwidth, mouse[0]+margin.left+margin.right),
        top = Math.min(containerheight, mouse[1]+margin.top+margin.right);
        var tooltipHtml = "<p class='text-capitalize'>Subject: <b>"+d.label+"</b></p><p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
        if(d.values !=null){
          tooltipHtml +="<p>Group Size: <b>"+ d.values.length+"</b></p>";
        }
        tooltip.html(tooltipHtml)
        .classed('hidden', false)
        .style('left', left + 'px')
        .style('top', top + 'px');

        if(d.values != null && d.values.length >> 1){
          var a = Math.abs(d.x - d.xQ1);
          var b = Math.abs(d.x - d.xQ3);
          var c = Math.abs(d.y - d.yQ1);
          var e = Math.abs(d.y - d.yQ3);
          var sWidth = xScale(a + b);
          var sHeight = yScale2(c + e);

          var sposX = xScale(Math.abs(d.x - sWidth /2));
          var sposY = yScale(Math.abs(d.y - sHeight /2));

          g.append("rect")
          .attr("x", sposX)
          .attr("y", sposY)
          .attr("width", sWidth)
          .attr("height", sHeight)
          .attr("stroke", "#444")
          .attr("fill", "none");

          // Min Max Rect
          var mXp =  xScale(d.xMin);
          var mYp =  yScale(d.yMax);
          var mWidth = xScale(Math.abs(d.xMax - d.xMin))
          var mHeight = yScale2(Math.abs(d.yMax - d.yMin))
          g.append("svg:rect")
          .attr("x",mXp)
          .attr("y",mYp)
          .attr("width", mWidth)
          .attr("height", mHeight)
          .attr("stroke", "#ff0000")
          .attr("fill", "none");
        }
      }

      function d3ScatterplotClick(d){
        var newValues;
        if(d.values !=null && d.values.length >>  1){
          d['newlyAdd'] = 1;
          d['color']="#f00";
          newValues = d.values;
          for(i in newValues) {
             // add new key-value pairs to newValues
             newValues[i]['label'] = d.values[i].label;
           }
          var newlyAddedData = d;
           data.push(newlyAddedData);
           var ungroupNAD = unGroupData(data);
           d3.selectAll('circle').remove();
           drawScatterplot( ungroupNAD, xScale, yScale, yScale2);
         }
        if(data.length ==3 && data[2].newlyAdd == 1){
          data.splice(2, 1);
        }
      }

      function unGroupData(data){
        //AGV data from Backend is nested. So, flattening or ungrouping nested data
        var dataUnGrouped = [];
        data.forEach(function(d){
          // for Individuals
          if(d.isGroup == false){
            dataUnGrouped.push({
             "enabled": d.enabled,
             "isGroup": d.isGroup,
             "key": d.key,
             "color": d.color,
             "values": d.values,
             "x": d.x,
             "y": d.y,
             "xMin": d.xMin,
             "xMax": d.xMax,
             "xQ1": d.xQ1,
             "xQ3": d.xQ3,
             "yMin": d.yMin,
             "yMax": d.yMax,
             "yQ1": d.yQ1,
             "yQ3": d.yQ3,
             "label": d.label,
              })
            }
          // for Groups
          else if(d.isGroup == true){
            d.values.forEach(function(e) {
            dataUnGrouped.push({
            "enabled": d.enabled,
            "isGroup": d.isGroup,
            "key": d.key,
            "color": d.color,
            "x": e.x,
            "y": e.y,
            "xMin": e.xMin,
            "xMax": e.xMax,
            "xQ1": e.xQ1,
            "xQ3": e.xQ3,
            "yMin": e.yMin,
            "yMax": e.yMax,
            "yQ1": e.yQ1,
            "yQ3": e.yQ3,
            "label": e.label,
            "values": e.values // copies all e.label's x and y raw values
              })
            })
          }
        })
        return dataUnGrouped;
      }

      function findMaxXY(data){    // finding max value of xMax and yMax in data
        var i,j,xMaxX,yMaxY;
        var allX = [];
        var allY = [];
        for(i in data) {
          if(data[i].isGroup == true){
            for(j in data[i].values) {
              allX.push(data[i].values[j].xMax)
              allY.push(data[i].values[j].yMax)
              var x = data[i].values[j].values;
            }
          }
          xMaxX = allX.reduce(function(a, b) { return Math.max(a, b); });
          yMaxY = allY.reduce(function(a, b) { return Math.max(a, b); });
        }
        return [xMaxX, yMaxY];
      }

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
        d3.selectAll('circle').remove();
        drawScatterplot(newData, xScale, yScale, yScale2);
      });

  });
 }
