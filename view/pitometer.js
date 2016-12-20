function render(data) {

  const HEIGHT = 400;
  const WIDTH = 600;
  const XPADDING = 100;
  const YPADDING = 20;

  const codeDates = data.map(function(d) {
    return d.code_date;
  });
  const uniqueCodeDates = [... new Set(codeDates)].sort();

  const plucker = (s) => (d) => d[s];

  const yScale = d3.scale.linear()
    .domain([
      d3.max(data, plucker("measurement")),
      d3.min(data, plucker("measurement"))
    ])
    .range([ 0 + YPADDING, HEIGHT ]);
  const xScale = d3.scale.linear()
    .domain([0, uniqueCodeDates.length - 1])
    .range([ XPADDING, WIDTH ]);

  const xAxis = d3.svg.axis()
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
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + XPADDING + ",0)")
    .call(yAxis);


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

