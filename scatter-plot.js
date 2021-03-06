/**
* Scatterplot() is a nested function which takes data, dom identifiers such as chartWrapper and ChartID, and axis labes as input arguments
* This nested function extensively uses d3.js to create a scatterplot
* The drawScatterplot() function maps data and creates circles in a group inside the SVG
**/
function Scatterplot(data, chartWrapper, chartId, xAxisLabel, yAxisLabel) {

      // Create/Set DOM selectors, margins and chart dimensions
      var margin = { top: 5, right: 70,  bottom: 70, left: 70 };
      var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
      var containerheight = 200;
      var width = parentDiv.width - margin.left - margin.right;
      var height = containerheight - margin.top - margin.bottom;
      var xLabel = xAxisLabel;
      var yLabel = yAxisLabel;

      // Remove svg under this div, if any
      d3.selectAll("div"+chartId+">svg").remove();

      // DATA MANIPULATION & MODELLING

      // Call data and add enabled key - for legend toggling functionality
      data.forEach(function(d) {
       d.enabled = true;
      });
      // Ungroup data and find maxX and maxY value
      var newData = unGroupData(data);
      var maxXY = findMaxXY(data);


      //drawLegend appends to the chartId div and call it here, as it does not require SVG
      drawLegend(data);

      // Create SVG with chart dimensions
      var svg = d3.select(chartId)
      .append('svg')
      .attr('width', parentDiv.width)
      .attr('height', containerheight);
      var g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      var gSelection = "div"+chartId+">svg>g";

      //  Create tooltip
      var tooltip = d3.select(chartId)
      .append('div')
      .attr('class', 'd3-scatterplot-tooltip hidden');

      // fn call to generate Scatterplot
      drawScatterplot(newData, width, height);

      // FEATURE - Redraw chart on window resize
      $(window).on('resize', function() {
        var margin = { top: 5, right: 70,  bottom: 70, left: 70 };
        var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
        var containerheight = 200;
        var width = parentDiv.width - margin.left - margin.right;
        var height = containerheight - margin.top - margin.bottom;
        drawScatterplot(newData, width, height);
        });

      // FEATURE - double click on chart area to remove newly added points
      $(chartId).dblclick(function (event){
          d3.selectAll('circle').remove();
          var noNewPointsData = unGroupData(data);
          drawScatterplot(noNewPointsData, width, height);
        })


  // ############## ALL FUNCTIONS ##################

      function drawScatterplot(jsonData, width, height) {
        /**
        * takes ungrouped data (jsonData) which has all individual and group data points as seperate json in json array
        * drawScatterplot plots datapoints as circles on SVG
        * different styling is provided to group and individuals
        * has function calls for mouseevents
        **/

        //  clear existing data points, rectangles or tooltips on svg if any
        d3.selectAll(gSelection+">g").remove();
        d3.select(gSelection+'>g.xAxisG>text').remove();
        d3.select(gSelection+'>g.yAxisG>text').remove();
        d3.select('data-points-grp').remove();
        d3.select('data-points-indv').remove();
        d3.selectAll('circle').remove();
        tooltip.classed('hidden', true);

        // Create Chart Axis values, axis scales
        var xValue = d => d.x;
        var xScale = d3.scaleLinear();
        var xAxis = d3.axisBottom()
          .scale(xScale)
          .ticks(10)
          .tickPadding(15)
          .tickSize(-height);
        xScale
          .domain([0, maxXY[0]])
          .range([0, width])
          .nice();
        var yValue = d => d.y;
        var yScale = d3.scaleLinear();
        var yAxis = d3.axisLeft()
          .scale(yScale)
          .ticks(10)
          .tickPadding(15)
          .tickSize(-width);
        yScale
          .domain([0, maxXY[1]])
          .range([height, 0])
          .nice();

        //  Create groups for x and y axis labels and add text labels
        var xAxisG = d3.select(gSelection).append('g')
            .attr('transform', `translate(0, ${height})`)
            .attr("class", "xAxisG");
        xAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', 35)
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

        // create a second yScale for inverted height range starting 0
        var yScale2 = d3.scaleLinear()
        .domain([0, maxXY[1]])
        .range([0, height])
        .nice();

        // call functions to generate axis & legend
        xAxisG.call(xAxis);
        yAxisG.call(yAxis);

        //  Draw circles
        var dataCirclesG = g.append('g')
          .attr("class", "data-points-grp");
        var dataCirclesI = g.append('g')
          .attr("class", "data-points-indv");

        // exit the whole group before adding points
        dataCirclesG.exit().remove();
        dataCirclesI.exit().remove();

        // seperate jsonData as group and individual
        var dataGrp = [], dataIndv = [];
        jsonData.forEach(function(d){
          if(d.group == true){
            dataGrp.push(d);
          }
          if(d.group == false){
            dataIndv.push(d);
          }
        })

        // map group or/and individual datapoints as circles
        dataCirclesG.selectAll('circle')
        .data(dataGrp)
        .enter().append('circle')
        .attr('fill', d => d.color)
        .attr('fill-opacity', 1.0)
        .attr('cx', d => xScale(xValue(d)))
        .attr('cy', d => yScale(yValue(d)))
        .attr('r', 8)
        .style("opacity", 0.8);

        dataCirclesI.selectAll('circle')
        .data(dataIndv)
        .enter().append('circle')
        .attr("fill", "none")
        .attr('stroke', d => d.color)
        .attr('stroke-width', '3px')
        .attr('cx', d => xScale(xValue(d)))
        .attr('cy', d => yScale(yValue(d)))
        .attr('r', 5)
        .style("opacity", 0.8);

        // Mouse events for generating tooltip, rect and individual points in groups
        var hoverRectSelection = "div"+chartId+">svg>g>rect";
        dataCirclesG.selectAll('circle')
        .on("mouseover", function(d) {
                d3ScatterplotMouseOver(d, xScale, yScale, yScale2);
            })
        .on("mouseout", function(d) {
              tooltip.classed('hidden', true);
              d3.selectAll(hoverRectSelection).remove();
          })
        .on("click", function(d) {
              d3ScatterplotClick(d, xScale, yScale);
              function checkLabel(){
              for(i in jsonData) {
                if(jsonData[i].label == d.label ) {
                  return jsonData[i]
                }
              }
            }
        })
        dataCirclesI.selectAll('circle').on("mouseover", function(d) {
                d3ScatterplotMouseOver(d, xScale, yScale, yScale2);
            })
        .on("mouseout", function(d) {
              tooltip.classed('hidden', true);
              d3.selectAll(hoverRectSelection).remove();
          })
      }

      function findMaxXY(data){
          // find max value of xMax and yMax in data for Axis scales
          var i,j,xMaxX,yMaxY;
          var allX = [];
          var allY = [];
          for(i in data) {
            if(data[i].group == true){
              for(j in data[i].values) {
                allX.push(data[i].values[j].xMax)
                allY.push(data[i].values[j].yMax)
              }
              xMaxX = allX.reduce(function(a, b) { return Math.max(a, b); });
              yMaxY = allY.reduce(function(a, b) { return Math.max(a, b); });
            }
            else if(data[i].group == false){
            	for(j in data[i].values) {
                    allX.push(data[i].values[j].x)
                    allY.push(data[i].values[j].y)
                  }
        	xMaxX = allX.reduce(function(a, b) { return Math.max(a, b); });
            yMaxY = allY.reduce(function(a, b) { return Math.max(a, b); });
            }
          } 
          return [xMaxX, yMaxY];
        }

      function unGroupData(data){
          // Flatten or ungroup nested data
          var dataUnGrouped = [];

          data.forEach(function(d){
              d.values.forEach(function(e) {
              dataUnGrouped.push({
              "enabled": d.enabled,
              "group": d.group,
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
              "values": e.values // copies entire inner array values
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
            d3.selectAll('circle').remove();
            drawScatterplot(fDataUG, width, height)
           });
      }

      function d3ScatterplotMouseOver(d, xScale, yScale, yScale2){
          d3.selectAll("div"+chartId+">svg>g>rect").remove();
          // show tooltip and rectangles on mouse hover
          var parentDiv = d3.select(chartWrapper).node().getBoundingClientRect();
          var mouse = d3.mouse(svg.node()).map(function(d) {
              return parseInt(d);
          });

          var tooltipHtml = "<p class='text-capitalize'>Subject: <b>"+d.label+"</b></p><p>"+xLabel+": <b>"+d.x+"</b></p><p>"+yLabel+": <b>"+ d.y+"</b>";
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

          // Create min-max and 1st - 3rd quartile rectangles for datapoints on hover
          if(d.values != null && d.values.length >> 1){
            // Min Max Rectangle
            var mXp =  xScale(d.xMin);
            var mYp =  yScale(d.yMax);
            var mWidth = xScale(Math.abs(d.xMax - d.xMin))
            var mHeight = yScale2(Math.abs(d.yMax - d.yMin))
            // 1st 3rd Quartile Rectangle
            var xQ1 =xScale(d.xQ1);
            var yQ3 = yScale(d.yQ3);
            var qWidth = xScale(Math.abs(d.xQ3 - d.xQ1))
            var qHeight = yScale2(Math.abs(d.yQ3 - d.yQ1))

            g.append("svg:rect")
            .attr("x",mXp)
            .attr("y",mYp)
            .attr("width", mWidth)
            .attr("height", mHeight)
            .attr("stroke", "#444")
            .attr("fill", "none");

            g.append("svg:rect")
            .attr("x",xQ1)
            .attr("y",yQ3)
            .attr("width", qWidth)
            .attr("height", qHeight)
            .attr("stroke", "#444")
            .attr("fill", "none");
          }
        }

      function d3ScatterplotClick(d, xScale, yScale){
         // Show additional data points in a group - as new circles on svg
          var newValues;
          if(d.values !=null && d.values.length >>  1){
            d['newlyAdd'] = 1;
            if(d.color == "#008837")
            d['color']="#7fbf7b";
            else if(d.color == "#7b3294")
            d['color']="#af8dc3";
            newValues = d.values;
            for(i in newValues) {
               // add new key-value pairs to newValues
               newValues[i]['label'] = d.values[i].label;
             }
            var newlyAddedData = d;
             data.push(newlyAddedData);
             var ungroupNAD = unGroupData(data);
             d3.selectAll('circle').remove();

            drawScatterplot( ungroupNAD, width, height);
            // show highlight on click - add circle on top
            // g.append('svg:circle')
            // .attr("fill", d.color)
            // .attr('cx', xScale(d.x))
            // .attr('cy', yScale(d.y))
            // .attr('r', 8)
            // .style("stroke-width","3px").style("stroke","black");

            if(data.length ==3 && data[2].newlyAdd == 1){
                data.splice(2, 1);
              }
           }
        }
 }
