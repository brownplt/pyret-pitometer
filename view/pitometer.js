function getLabels(data) {
  const s = new Set();
  data.forEach((d) =>
    d.labels.forEach((l) =>
      s.add(l)));
  return [... s].sort();
}


function render(data, filterLabels) {

  data = data.filter((d) => {
    var hasAllLabels = true;
    filterLabels.forEach((l) => {
      hasAllLabels = hasAllLabels && (d.labels.indexOf(l) !== -1);
    });
    return hasAllLabels;
  });

  const unit = data[0].unit;

  const HEIGHT = 400;
  const WIDTH = 600;
  const XPADDING = 100;
  const YPADDING = 150;

  const codeDates = data.map(function(d) {
    return d.code_date;
  });
  const uniqueCodeDates = [... new Set(codeDates)].sort();

  const plucker = (s) => (d) => d[s];

  const yScale = d3.scale.linear()
    .domain([
      d3.max(data, plucker("measurement")),
      0
    ])
    .range([ 0 + YPADDING, HEIGHT ]);
  const xScale = d3.scale.linear()
    .domain([0, uniqueCodeDates.length - 1])
    .range([ XPADDING, WIDTH ]);

  const xAxis = d3.svg.axis()
    .ticks(uniqueCodeDates.length)
    .tickFormat((index) => new Date(uniqueCodeDates[index]).toLocaleString())
    .scale(xScale)
    .orient("bottom");

  const yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");

  const svg = d3.select(".chart")
    .attr("width", WIDTH + XPADDING)
    .attr("height", HEIGHT + YPADDING);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + HEIGHT + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-60)");

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + XPADDING + ",0)")
    .call(yAxis);

  svg.append("text")
      .style("text-anchor", "end")
      .attr("transform",
        "translate(0," + (HEIGHT / 2) + ") " +
        "rotate(-90) "
        )
      .attr("dy", "1em")
      .text(unit);

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => {
      var index = uniqueCodeDates.indexOf(d.code_date)
      console.log("Index was: ", index, " for ", d);
      return xScale(index);
    })
    .attr("cy", (d) => yScale(d.measurement))
    .attr("r", 5)
    .attr("fill", "#90a090");

  console.log(data);
}

