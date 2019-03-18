function StackedBarChart(data, chartWrapper, chartId, xAxisLabel, yAxisLabel) {
//data format sample
/** [{"date":"2015-02-11 ","group":"deep-sleep","value":107,"total":600,"deep-sleep":107},{"date":"2015-02-11 ","group":"nap","value":0,"total":600,"nap":0},{"date":"2015-02-11 ","group":"sedentary","value":95,"total":600,"sedentary":95},{"date":"2015-02-11 ","group":"light","value":250,"total":600,"light":250},{"date":"2015-02-11 ","group":"moderate","value":122,"total":600,"moderate":122},{"date":"2015-02-11 ","group":"rem-sleep","value":26,"total":600,"rem-sleep":26}] **/

  // Create/Set DOM selectors, margins and chart dimensions
  const margin = { top: 30, right: 35, bottom: 70, left: 70 };
  const parentDiv = d3
    .select(chartWrapper)
    .node()
    .getBoundingClientRect();
  const containerheight = 200;
  const width = parentDiv.width - margin.left - margin.right;
  const height = containerheight - margin.top - margin.bottom;
  const xLabel = xAxisLabel;
  const yLabel = yAxisLabel;

  // Remove svg under this div, if any
  d3.selectAll(`div${chartId}>svg`).remove();

  const allKeys = [
    "sleep",
    "nap",
    "sedentary",
    "light",
    "moderate",
    "vigorous"
  ];
console.log(data)
  // DATA MANIPULATION & MODELLING
  for (i in data) {
    data[i].enabled = true;
    var groupData = d3
        .nest()
        .key(d => d.date)
        .sortKeys(d3.ascending)
        .entries(data);
  }
  groupData = formatGroupData(groupData);
  groupData.forEach(d => {
    d.enabled = true;
  });
  const newGroupData = d3.stack().keys(allKeys)(groupData);

  // Add enabled key - for legend toggling functionality
  newGroupData.forEach(d => {
    d.enabled = true;
  });
  console.log(newGroupData);
  const colorScale = d3
    .scaleOrdinal()
    .range(["#3182bd", "#9ecae1", "#fee5d9", "#fcae91", "#fb6a4a", "#de2d26"]);
  colorScale.domain(allKeys);

  //drawLegend appends to the chartId div and does not require SVG
  drawLegend(data, groupData, newGroupData, colorScale);

  // Create SVG with chart dimensions
  const svg = d3
    .select(chartId)
    .append("svg")
    .attr("width", parentDiv.width)
    .attr("height", containerheight);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const gSelection = `div${chartId}>svg>g`;
  const maxY = d3.max(groupData, d => d.total);
  //  Create tool tip
  const tooltip = d3
    .select(chartId)
    .append("div")
    .attr("class", "d3-stack-barchart-tooltip hidden");

  // fn call to generate StackedBarChart
  drawStackedBar(newGroupData, width, height);

  // FEATURE - Redraw chart on window resize
  $(window).on("resize", () => {
    const margin = { top: 30, right: 35, bottom: 70, left: 70 };
    const parentDiv = d3
      .select(chartWrapper)
      .node()
      .getBoundingClientRect();
    const containerheight = 200;
    const width = parentDiv.width - margin.left - margin.right;
    const height = containerheight - margin.top - margin.bottom;

    drawStackedBar(newGroupData, width, height);
  });

  // ############## ALL FUNCTIONS ##################

  function drawStackedBar(jsonData, width, height) {
    //  clear existing data points, rectangles or tooltips on svg if any
    d3.selectAll(`${gSelection}>g`).remove();
    d3.selectAll(`${gSelection}>g.data-rectangles`).remove();
    tooltip.classed("hidden", true);
    d3.select(`${gSelection}>g.xAxisG>text`).remove();
    d3.select(`${gSelection}>g.yAxisG>text`).remove();

    // Create Chart Axis scales
    const xScale = d3
      .scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1);
    const xTickValues = groupData.map(d => d.key);
    //    console.log(xTickValues)

    xScale.domain(groupData.map(d => d.key));
    const mult = Math.max(1, Math.floor(width / xScale.domain().length));
    xScale.rangeRound([0, xScale.domain().length * mult], 0.1, 0);
    const newWidth = xScale.domain().length * mult; // new width based on xAxis - to be used for y Axis ticks size

    const xAxis = d3
      .axisBottom()
      .tickValues(xTickValues)
      .scale(xScale)
      .tickPadding(2)
      .tickSize(-height)
      .tickFormat((d, i) => {
        const x = new Date(d);
        if (isNaN(d)) {
          //d is not number (i.e. it is date)
          if (xScale.domain().length > 10)
            return i == 0 ||
              i == Math.ceil((xScale.domain().length - 1) / 5) ||
              i == Math.ceil((2 * (xScale.domain().length - 1)) / 5) ||
              i == Math.ceil((3 * (xScale.domain().length - 1)) / 5) ||
              i == Math.ceil((4 * (xScale.domain().length - 1)) / 5) ||
              i == xScale.domain().length - 1
              ? d
              : "";
          else return d;
        }
        if (isNaN != x.getTime()) {
          //d is not date/time
          return d;
        }
      });

    const yScale = d3.scaleLinear().range([height, 0]);
    const yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(5)
      .tickPadding(15)
      .tickSize(-newWidth);
    yScale.domain([0, maxY]);

    //  Create groups for x and y axis labels and add text labels
    const xAxisG = d3
      .select(gSelection)
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "xAxisG");
    xAxisG
      .append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", 70)
      .text(xLabel);
    const yAxisG = d3
      .select(gSelection)
      .append("g")
      .attr("class", "yAxisG");
    yAxisG
      .append("text")
      .attr("class", "axis-label")
      .attr("x", -height / 2)
      .attr("y", -55)
      .attr("transform", `rotate(-90)`)
      .style("text-anchor", "middle")
      .text(yLabel);

    const xAxisTickSelection = `div${chartId}>svg>g>g.xAxisG>g.tick>text`;
    // call functions from this file to generate axis & legend
    xAxisG
      .call(xAxis)
      .selectAll(xAxisTickSelection)
      .attr("dx", "-1.5em")
      .attr("dy", "1.1em")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-35)");

    yAxisG.call(yAxis);

    const dataRect = g.append("g").attr("class", "data-rectangles");

    // exit the whole group before adding points
    dataRect.exit().remove();

    dataRect
      .selectAll(".stack")
      .data(jsonData)
      .enter()
      .append("g")
      .attr("class", "stack")
      .attr("fill", d => colorScale(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.data.key))
      .attr("y", d => yScale(d[1]))
      .attr("height", d => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth());

    const hoverRectSelection = `div${chartId}>svg>g>g.data-rectangles`;
    dataRect
      .selectAll(".stack>rect")
      .on("mouseover", d => {
        d3StackedBarMouseOver(d);
      })
      .on("mouseout", d => {
        tooltip.classed("hidden", true);
        // d3.selectAll(hoverRectSelection).remove();
      });
  }

  function formatGroupData(data) {
    const xData = [];

    xData.forEach(d => {
      if (d.group == allKeys[0]) allKeys[0] =
                                   d.value;
      if (d.group == allKeys[1]) allKeys[1] =
                                   d.value;
      if (d.group == allKeys[2]) allKeys[2] =
                                   d.value;
      if (d.group == allKeys[3]) allKeys[3] =
                                   d.value;
      if (d.group == allKeys[4]) allKeys[4] =
                                   d.value;
      if (d.group == allKeys[5]) allKeys[5] =
                                   d.value;
    });

    data.forEach(d => {
      d.values.forEach(e => {
        xData.push({
          key: d.key,
          group: e.group,
          value: e.value,
          total: e.total
        });
      });
    });
    var cat1 = allKeys[0];
    for (i in data) {
      for (j in xData) {
        if (xData[j].key == data[i].key) {
          data[i].total = xData[j].total;
          if (xData[j].group == allKeys[0]) data[i][allKeys[0]] = xData[j].value;
          if (xData[j].group == allKeys[1])
            data[i][allKeys[1]] = xData[j].value;
          if (xData[j].group == allKeys[2])
            data[i][allKeys[2]] = xData[j].value;
          if (xData[j].group == allKeys[3])
            data[i][allKeys[3]] = xData[j].value;
          if (xData[j].group == allKeys[4])
            data[i][allKeys[4]] = xData[j].value;
          if (xData[j].group == allKeys[5])
            data[i][allKeys[5]] = xData[j].value;
        }
      }
    }
    return data;
  }

  function drawLegend(data, groupData, jsonData, colorScale) {
    //  Generate legend based on datapoints
    d3.select(`div${chartId}`)
      .append("ul")
      .attr("class", "legend float-sm-right");

    const legendSelection = `div${chartId}>ul.legend`;
    d3.selectAll(`${legendSelection}>li`).remove();
    const legendItem = d3
      .select(legendSelection)
      .selectAll("li")
      .data(jsonData)
      .enter()
      .append("li");
    legendItem
      .append("span")
      .attr("id", "color-circle")
      .style("background", (d, i) => colorScale(d.key));
    legendItem.append("span").text(d => d.key);
    const keyValue = [];
    legendItem.on("click", function(d) {
      // data Filter - onClick functionality for Legend based on d.enabled (legend filtering)
      d3.select(this)
        .select("span")
        .classed(
          "legend-active",
          d3
            .select(this)
            .select("span")
            .classed("legend-active")
            ? false
            : true
        );
      d.enabled = !d.enabled;
      const filteredKey = d.key;
      groupData.forEach(e => {
        if (d.enabled == false) {
          keyValue.push({
            index: d.index,
            key: e.key,
            [filteredKey]: e[filteredKey],
            total: e.total
          });
          e[filteredKey] = null;
        } else if (d.enabled == true) {
          groupData.forEach(e => {
            keyValue.forEach(f => {
              if (d.index == f.index && e.key == f.key) {
                e[filteredKey] = f[filteredKey];
              }
            });
          });
        }
      });
      const fData = d3.stack().keys(allKeys)(groupData);
      d3.selectAll(`div${chartId}>svg>g>g.data-rectangles`).remove();
      drawStackedBar(fData, width, height);
    });
  }

  function d3StackedBarMouseOver(d) {
    // show tooltip on mouse hover
    const parentDiv = d3
      .select(chartWrapper)
      .node()
      .getBoundingClientRect();
    const mouse = d3.mouse(svg.node()).map(d => parseInt(d));
    const yVal = d[1] - d[0];
    const tooltipHtml = `<p>${xLabel}: <b>${
      d.data.key
    }</b></p><p>${yLabel}: <b>${yVal}</b></p>`;
    tooltip.html(tooltipHtml).classed("hidden", false);

    if (mouse[0] < parentDiv.width / 2) {
      tooltip.style("left", `${mouse[0] + 50}px`).style("top", `${mouse[1]}px`);
    } else {
      tooltip
        .style("left", `${mouse[0] - 150}px`)
        .style("top", `${mouse[1]}px`);
    }
  }
}
