function getLabels(data) {
  const s = new Set();
  data.forEach((d) =>
    d.labels.forEach((l) =>
      s.add(l)));
  return [... s].sort();
}

const plucker = (s) => (d) => d[s];

function tooltipInfo(d) {
  return "Measurement Id: " + d.uuid + "\n"
    + "Measurement: " + d.measurement + "\n"
    + "Labels: " + d.labels.join(",") + "\n"
    + d.commitInfo;
}

function filterOnLabels(data, filterLabels) {
  return data.filter((d) => {
    let hasAllLabels = true;
    filterLabels.forEach((l) => {
      hasAllLabels = hasAllLabels && (d.labels.indexOf(l) !== -1);
    });
    return hasAllLabels;
  });
}

function filterOnIds(data, skipIds) {
  return data.filter((d) => {
    let hasId = false;
    skipIds.forEach((id) => {
      hasId = hasId || (d.uuid.indexOf(id) !== -1);
    });
    if(hasId) { debugger; }
    return !hasId;
  });
}


function filterOnCommits(data, commits) {
  return data.filter((d) => {
    let hasCommit = false;
    commits.forEach((c) => {
      hasCommit = hasCommit || (d.commit === c);
    });
    return hasCommit;
  });
}

let startR = 0;
let startG = 100;
let startB = 200;

function nextColor() {
  startR = (startR + 70) % 255;
  startG = (startG + 80) % 255;
  startB = (startB + 90) % 255;
  return "rgb(" + startR + "," + startG + "," + startB + ")";
}

function compare(data, commits, filterLabels, skipIds) {

  const colors = {};
  commits.forEach(function(c) {
    colors[c] = nextColor();
  });

  data = filterOnCommits(data, commits);
  data = filterOnLabels(data, filterLabels);
  data = filterOnIds(data, skipIds);

  const HEIGHT = 400;
  const WIDTH = 600;
  const XPADDING = 100;
  const YPADDING = 150;

  const unit = data[0].unit;
  
  const labels = data.map(function(d) {
    return d.labels.sort().join(",");
  });
  const uniqueLabels = [... new Set(labels)];

  const yScale = d3.scale.linear()
    .domain([
      d3.max(data, plucker("measurement")),
      d3.min(data, plucker("measurement"))
    ])
    .range([ 0 + YPADDING, HEIGHT ]);

  const xScale = d3.scale.linear()
    .domain([0, uniqueLabels.length - 1])
    .range([ XPADDING, WIDTH ]);

  const xAxis = d3.svg.axis()
    .ticks(uniqueLabels.length)
    .tickFormat((index) => uniqueLabels[index])
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

  const tip = d3.tip().attr('class', 'd3-tip').html(tooltipInfo);

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => {
      let index = uniqueLabels.indexOf(d.labels.sort().join(","))
      return xScale(index);
    })
    .attr("cy", (d) => yScale(d.measurement))
    .attr("r", 5)
    .attr("fill", (d) => colors[d.commit])
    .on('click', (d) => {
      showing ? tip.hide(d) : tip.show(d);
      showing = !showing;
    });

  console.log(data);
}


function render(data, filterLabels, skipIds) {

  data = filterOnLabels(data, filterLabels);
  data = filterOnIds(data, skipIds);

  const unit = data[0].unit;

  const HEIGHT = 400;
  const WIDTH = 600;
  const XPADDING = 100;
  const YPADDING = 150;

  const codeDates = data.map(function(d) {
    return d.codeDate;
  });
  const uniqueCodeDates = [... new Set(codeDates)].sort();

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

  const tip = d3.tip().attr('class', 'd3-tip').html(tooltipInfo);

  svg.call(tip);

  let showing = false;

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => {
      let index = uniqueCodeDates.indexOf(d.codeDate)
      console.log("Index was: ", index, " for ", d);
      return xScale(index);
    })
    .attr("cy", (d) => yScale(d.measurement))
    .attr("r", 5)
    .attr("fill", "#90a090")
    .on('click', (d) => {
      showing ? tip.hide(d) : tip.show(d);
      showing = !showing;
    });

  console.log(data);
}

