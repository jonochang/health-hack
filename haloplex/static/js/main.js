(function() {

var width = 800;

var section_height = 20;
var left_column_width = 0;
var left_column_initial_offset = 200;
var right_column_width = width - left_column_width;
var left_column_fader_width = 200;
var left_label_padding = 20;
var top_padding = 20;

var svg = d3.select("body").append("svg");
var axis_svg = d3.select("body").append("svg");

svg
  .attr("height", 0)
  .attr("width",  width)
  .attr("class", "main");

axis_svg
  .attr("width",  width)
  .attr("class", "axis");

var data_url = transform_url(window.location.search);
data_url = "/data/ordered?o=dsc&c=50";

d3.json(data_url, function(error, data) {
  var section_count = data.start.length;

  var gene = data.gene;
  var indicies = d3.range(section_count);

  var samples_flat = _.flatten(_.values(data.samples));
  var min = _.min(samples_flat);
  var max = _.max(samples_flat);

  var samples_data = []
  _.each(indicies, function(id) {
    samples_data[id] = _.map(data.samples, function(val, key) {
      return { key: key, val: val[id] }
    })
  })

  var height = section_height * section_count;
  svg.attr("height", height);

  var section_x = d3.scale.linear()
    .domain([min, max/2])
    .range([left_column_initial_offset, right_column_width])

  var fader_gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "fader-gradient")

  fader_gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#000")
    .attr("stop-opacity", "1")

  fader_gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#000")
    .attr("stop-opacity", "0")

  var container = svg
    .append("g")
    .attr("transform", "translate(0,"+top_padding+")")

  var current_sample = null

  container
    .append("rect")
    .attr("class", "overlay")
    .attr("x", left_column_width)
    .attr("width", right_column_width)
    .attr("height", height)
    .on("dblclick", function() { current_sample = null; redraw() })

  var highlights = container.append("g")
  for(var i = 0; i < section_count; i = i + 2) {
    highlights
      .append("rect")
      .attr("y", i * section_height)
      .attr("width", right_column_width)
      .attr("height", section_height)
      .on("dblclick", function() { current_sample = null; redraw() })
  }

  var xAxis = d3.svg.axis()
      .scale(section_x)
      .tickSize(-height)
      .orient("top");

  var section_group = container.append("g").attr("class", "sections")

  container.append("rect")
    .attr("class", "fader")
    .attr("width", left_column_fader_width)
    .attr("height", height)

  var section_labels_group = container.append("g").attr("class", "section-labels")

  var redraw = function() {
    var sections = section_group.selectAll("g.section").data(indicies)

    sections.enter()
      .append("g")
      .attr("class", "section")
      .attr("transform", function(id, i) { return "translate(0,"+(section_height * id)+")" })

    sections.each(samples)
    line(current_sample)

    var section_labels = section_labels_group.selectAll("g.section-label").data(indicies)

    section_labels.enter()
      .append("g")
      .attr("class", "section-label")
      .attr("transform", function(id, i) { return "translate(0,"+(section_height * id)+")" })

    section_labels.each(draw_section_labels)

    var axis_group = axis_svg.select("g.axis")
    if(axis_group.empty()) {
      axis_group = axis_svg
        .append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,20)")

      axis_group.append("rect")
        .attr("class", "top-axis-fader")
        .attr("width", width)
        .attr("height", top_padding)
        .attr("y", -top_padding)
    }

    axis_group.call(xAxis);
  }

  var zoom = d3.behavior.zoom()
    .x(section_x)
    .scaleExtent([0.01, 100])
    .on("zoom", redraw)

  container
    .call(zoom)
    .on("dblclick.zoom", null)

  var draw_section_labels = function(id, i) {
    var elem = d3.select(this);
    var label = elem.select("text.label");

    if(label.empty()) {
      elem
        .append("text")
        .attr("class", "label")
        .attr("dy", "0.5ex")
        .text(gene[id])
        .attr("x", left_label_padding)
        .attr("y", section_height / 2);
    }
  }

  var samples = function(id, i) {
    var elem = d3.select(this);

    var samples_group = elem.select("g.samples")
    var right_column

    if(samples_group.empty()) {
      right_column = elem
        .append("g")
        .attr("class", "samples")
        .attr("transform", function(id, i) { return "translate("+left_column_width+",0)" });
    } else {
      right_column = samples_group
    }

    var circles = right_column.selectAll("circle").data(samples_data[id])

    circles.enter()
      .append("circle")
      .attr("r", 5)
      .attr("class", "sample-point")
      .on("click", function(d) { current_sample = d.key; redraw() })

    circles
      .attr("cx", function(d) { return section_x(d.val) })
      .attr("cy", section_height / 2)
      .attr("class", function(d) { return d.key == current_sample ? "selected" : "" })

    circles.exit()
      .remove()

    var selected_circle = right_column.select("circle.selected")
    if(!selected_circle.empty()) {
      var node = selected_circle.node()
      node.parentNode.appendChild(node)
    }
  };

  var line = function(key) {
    var lineFunction = d3.svg.line()
      .x(function(d) { return section_x(d) })
      .y(function(d, i) { return section_height * (i + 0.5) })
      .interpolate("cardinal");

    var path = container.select("path.pick-line")
    if(path.empty()) { path = container.append("path").attr("class", "pick-line") }

    if(key) {
      path
        .datum(data.samples[key])
        .attr("d", lineFunction)
    } else {
      path.remove()
    }
  }

  redraw()
})

}());
