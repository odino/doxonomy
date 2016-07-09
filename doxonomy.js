let yaml = require('js-yaml')
let markdown = require('markdown').markdown
let d3 = require('d3')
require('./doxonomy.css')

/**
 * Converts object-like nodes to a list.
 *
 * {node: {...}, ...} becomes [{id: node, ...}, ...]
 */
function formatNodes({nodes, components, width, height}) {
  var formattedNodes = []
  var node = {}

  Object.keys(nodes).forEach((n) => {
    node = nodes[n];
    node.id = n;

    if (components[n]) {
      node.component = components[n]
    }

    formattedNodes.push(node)
  });

  assignPosition(formattedNodes, width, height)

  return formattedNodes;
}

/**
 * Assigns a position (x,y) to each node
 * on the canvas.
 */
function assignPosition(nodes = [], width, height) {
  nodes.forEach(function(d, i) {
    var siblings = (nodes.filter((n) => n.level === d.level));
    var max = Math.max.apply(Math, nodes.map(function(o){return o.level;}))
    var scale = height / max;
    var midpoint = scale / 2
    d.y = (scale * d.level) - midpoint

    var position = siblings.findIndex((n) => n.id === d.id) + 1;
    var scaleX = width / (siblings.length + 1);
    d.x = scaleX * position
  });
}

/**
 * Created a badge to be appended at the beginning of
 * the docs.
 */
function formatBadge(name, link) {
  return `[![${name}](https://img.shields.io/badge/${name}-${link}-blue.svg)](${link})\n`
}

/**
 * Called when clicking on a node:
 * if there is any documentation for
 * that node, display it.
 */
function onClickOnNode(node) {
  if (node.component) {
      var el = document.getElementById('doc');
      var  content = ''

      for (k in node.component) {
        if (k === 'content') {
          content = content + '\n' + node.component[k]
        } else {
          content = formatBadge(k, node.component[k]) + content
        }
      }


      el.innerHTML = markdown.toHTML(content)
      el.className += el.className ? ' active' : 'active';

      handleClicks()
  }
}

/**
 * When a doc is displayed we need to
 * handle click links on the document:
 * - if we click an anchor, open it in a
 *   new tab
 * - if we click anywhere else, close the
 *   doc
 * @return {[type]} [description]
 */
function handleClicks() {
  var anchorClicked = false;

  var anchors =document.getElementsByTagName("a");
  for(var y = 0; y < anchors.length; y++){
      var elem = anchors[y];
      elem.onclick = function(e){
          window.open(this.getAttribute('href'), "_blank")
          anchorClicked = true
          return false;
      };
  }

  setTimeout(() => {
    function clear(e) {
      if (anchorClicked) {
        anchorClicked = false;
        return;
      }

      document.getElementById("doc").innerHTML = "";
      document.getElementById("doc").className = "markdown-body";
      document.removeEventListener("click", clear)
    }

    document.addEventListener("click", clear);
  }, 0)
}

function draw({nodes = {}, relations = [], components = {}}) {
  var width  = window.innerWidth * 99 / 100,
      height = window.innerHeight * 97 / 100;

  nodes = formatNodes({nodes, components, width, height})

  var svg = d3.select('#graph')
    .append('svg')
    .attr('oncontextmenu', 'return false;')
    .attr('width', width)
    .attr('height', height);

    var links = []

    relations.forEach((r) => {
      var source = nodes.find((n) => r.from === n.id);
      var target = nodes.find((n) => n.id === r.to);

      if (source && target) {
        links.push({
          source: source,
          target: target,
          left: false,
          right: true,
          label: r.label,
        })
      }
    })

  var force = d3.layout.force()
      .on('tick', tick)

  // define arrow markers for graph links
  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 5)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#000');

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'start-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 4)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M10,-5L0,0L10,5')
      .attr('fill', '#000');

  // handles to link and node element groups
  var path = svg.append('svg:g').selectAll('path'),
      circle = svg.append('svg:g').selectAll('g');

  // mouse event vars
  var selected_node = null,
      selected_link = null,
      mousedown_link = null,
      mousedown_node = null,
      mouseup_node = null;


  // update force layout (called automatically each iteration)
  function tick() {
    // draw directed edges with proper padding from node centers
    svg.selectAll('.link').attr('d', function(d) {
      var deltaX = d.target.x - d.source.x,
          deltaY = d.target.y - d.source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourcePadding = d.left ? 100 : 100,
          targetPadding = d.right ? 100 : 100,
          sourceX = d.source.x + (sourcePadding * normX),
          sourceY = d.source.y + (sourcePadding * normY),
          targetX = d.target.x - (targetPadding * normX),
          targetY = d.target.y - (targetPadding * normY);
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    svg.selectAll('.link-label').attr("transform",function(d){
        return "translate("+(0.51 * (d.source.x+d.target.x))+"," + (0.5*(d.source.y+d.target.y))+")";
    });

    circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  }

  function start() {
    path = path.data(links);

    path.enter().append('svg:g').attr('class', 'edge')

    svg.selectAll('.edge').append('svg:path')
      .attr('class', 'link')
      .classed('selected', function(d) { return d === selected_link; })
      .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
      .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })


    svg.selectAll('.edge')
      .append("svg:text")
      .attr("class", "link-label")
      .text(function(e) {
          return e.label || null;
      });

    circle = circle.data(nodes, function(d) { return d.id; });

    var g = circle.enter().append('svg:g');

    var img = g.append("svg:image")
        .attr("xlink:href", (d) => d.icon)
        .attr("width", 120)
        .attr("height", 120)
        .attr("x", -60)
        .attr("y", -60)
        .on('click', onClickOnNode)

    // show node label / ID
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 80)
        .attr('class', 'id')
        .text(function(d) { return d.label || d.id; });

    force.start();
  }

  start();
}

function initDom(id) {
  let container = document.getElementById(id) || document.getElementsByTagName('body')[0]

  container.innerHTML = `<div id="doc" class="markdown-body"></div><div id="graph"></div>`
}

function getComponents(components) {
  return fetch(components).then(res => res.text()).then((components) => {
    return yaml.load(components)
  })
}

var doxonomy = {}

doxonomy.init = function({id = null, url, components}) {
  initDom(id)

  fetch(url).then((res) => res.text()).then((data) => {
    var doc = yaml.load(data);
    doc.components = {}

    if (components) {
      return getComponents(components).then((components) => {
        doc.components = components;

        return doc;
      })
    }

    doc.components = {}

    return doc;
  }).then(doc => {
    draw(doc)
  })
}

module.exports = doxonomy;
