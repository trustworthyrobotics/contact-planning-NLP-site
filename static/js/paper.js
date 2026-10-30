"use strict";

const tasks = ["Box pushing", "Circle pushing", "Square knob", "Planar finger", "Sphere in-hand", "Pen in-hand"];

// Table II. Values are in task order. Goal errors and solve times are means.
const benchmark = {
  single: {
    label: "Single shooting",
    color: "first",
    success: [0, 0, 0, 0, 7, 0],
    error: [0.4238, 0.1733, 0.7010, 0.5814, 0.3155, 0.2303],
  },
  multiple: {
    label: "Multiple shooting",
    color: "second",
    success: [40, 33.5, 61.5, 89.5, 13, 20],
    error: [0.2573, 0.1334, 0.2728, 0.0551, 0.2734, 0.1647],
  },
  ipopt: {
    label: "IPOPT",
    color: "first",
    success: [98.5, 95.5, 100, 99.5, 94.5, 95.5],
    error: [0.0129, 0.0212, 0.0120, 0.0120, 0.0056, 0.0437],
    time: [2.43, 2.64, 3.49, 2.17, 15.3, 21.6],
  },
  scholtes: {
    label: "IPOPT (Scholtes)",
    color: "first",
    success: [47.5, 25.5, 92, 35, 14, 32.5],
  },
  impact: {
    label: "IMPACT",
    color: "third",
    success: [96, 100, 81.5, 93, null, null],
  },
  fatrop: {
    label: "FATROP",
    color: "second",
    success: [96, 100, 94, 96.5, 90.5, 91],
    error: [0.0237, 0.0049, 0.0921, 0.0105, 0.0211, 0.0763],
    time: [1.58, 1.68, 1.98, 2.00, 12.6, 17.6],
  },
  pas: {
    label: "IP-PAS",
    color: "lifted",
    success: [96.5, 99.5, 96, 91.5, 92, 92.5],
    error: [0.0249, 0.0118, 0.1033, 0.0493, 0.0242, 0.0683],
    time: [1.43, 1.23, 1.22, 1.84, 4.80, 5.66],
  },
};

const lifted = { ...benchmark.ipopt, label: "Lifted multiple shooting", color: "lifted" };
const metrics = {
  success: { label: "Success rate (%)", max: 100, format: (value) => value + "%" },
  error: { label: "Mean terminal goal error", max: 0.8, format: (value) => value.toFixed(4) },
  time: { label: "Mean solve time (s)", max: 24, format: (value) => value.toFixed(2) },
};

function element(tag, className, label) {
  const item = document.createElement(tag);
  item.className = className;
  if (label !== undefined) item.textContent = label;
  return item;
}

function renderChart(id, groups, series, metric) {
  const { label, max, format } = metric;
  const target = document.getElementById(id);
  const legend = element("ul", "chart-legend");
  legend.setAttribute("aria-label", "Chart legend");
  for (const entry of series) {
    const legendItem = element("li", "", entry.label);
    const key = element("span", "chart-key-" + entry.color);
    key.setAttribute("aria-hidden", "true");
    legendItem.prepend(key);
    legend.append(legendItem);
  }

  const axis = element("div", "chart-axis");
  axis.setAttribute("aria-hidden", "true");
  axis.append(element("span", "", "0"), element("span", "", label), element("span", "", String(max)));

  const chart = element("ul", "chart-groups");
  chart.setAttribute("aria-label", label);
  for (const [index, group] of groups.entries()) {
    const row = element("li", "chart-group");
    const bars = element("ul", "chart-bars");
    for (const entry of series) {
      const value = entry.values[index];
      const error = entry.errors?.[index];
      const display = value === null ? "N/A" : format(value);
      const bar = element("li", "chart-bar");
      const text = element("span", "chart-value", display);
      const track = element("span", "chart-track");
      track.setAttribute("aria-hidden", "true");
      if (value !== null) {
        const fill = element("span", "chart-fill chart-key-" + entry.color);
        fill.style.width = (100 * value / max) + "%";
        track.append(fill);
      }
      if (error !== undefined) {
        const whisker = element("span", "chart-whisker");
        whisker.style.left = (100 * (value - error) / max) + "%";
        whisker.style.width = (200 * error / max) + "%";
        track.append(whisker);
      }
      text.setAttribute("aria-hidden", "true");
      const measurement = value === null ? "not evaluated" : display;
      const errorLabel = error === undefined ? "" : " ± " + format(error);
      const spokenValue = element("span", "is-sr-only", entry.label + ", " + measurement + errorLabel);
      bar.title = spokenValue.textContent;
      bar.append(track, text, spokenValue);
      bars.append(bar);
    }
    row.append(element("span", "chart-group-label", group), bars);
    chart.append(row);
  }
  target.replaceChildren(legend, axis, chart);
}

function renderBenchmark(id, series, metric) {
  renderChart(id, tasks, series.map((entry) => ({ ...entry, values: entry[metric] })), metrics[metric]);
}

function setupMetricChart(control, chart, series) {
  const selector = document.getElementById(control);
  const updateChart = () => {
    renderBenchmark(chart, series, selector.value);
  };
  selector.addEventListener("change", updateChart);
  updateChart();
  document.getElementById(control + "-control").hidden = false;
}

function setupResults() {
  setupMetricChart("shooting-metric", "chart-shooting", [benchmark.single, benchmark.multiple, lifted]);
  setupMetricChart("solver-metric", "chart-solvers", [benchmark.ipopt, benchmark.fatrop, benchmark.pas]);
  renderBenchmark("chart-contact", [benchmark.scholtes, benchmark.impact, { ...lifted, label: "IPOPT lifted" }], "success");

  // Figure 3 source values and symmetric error bars, in order of increasing horizon.
  renderChart("chart-scaling", ["2,000", "4,000", "8,000", "20,000", "40,000"], [
    {
      ...benchmark.ipopt,
      values: [12.7657, 21.6874, 37.2484, 85.3011, 150.5065],
      errors: [1.1144, 1.1959, 1.4406, 7.2804, 9.4186],
    },
    {
      ...benchmark.fatrop,
      values: [13.5635, 18.1887, 31.5120, 71.4024, 145.0371],
      errors: [0.3866, 0.4847, 0.7178, 0.9437, 1.4424],
    },
    {
      ...benchmark.impact,
      values: [3.4684, 8.8956, 18.8884, 49.6190, 97.0590],
      errors: [0.3766, 0.7245, 0.8431, 1.2498, 5.3313],
    },
    {
      ...benchmark.pas,
      values: [2.9379, 3.0650, 4.2635, 6.5440, 9.5109],
      errors: [0.0388, 0.0313, 0.2309, 0.0417, 0.1624],
    },
  ], { label: "Mean solve time (s)", max: 160, format: (value) => value.toFixed(4) });
}

const svgNamespace = "http://www.w3.org/2000/svg";
const treeDepth = 3;
const scanEnd = 2 ** treeDepth;
const scanStages = [
  { phase: 0, title: "Leaves", description: "Each leaf starts with a tuple linking adjacent stages. The last tuple encodes the terminal condition at stage 7 and ends at the dummy stage 8." },
  { phase: 1, level: 1, title: "Up-pass · Combine adjacent steps", description: "Each pair becomes a single interval. All four pairs compose their local relationships in parallel." },
  { phase: 1, level: 2, title: "Up-pass · Combine adjacent intervals", description: "Each parent combines the relationships in its two children. The left and right halves of the tree are composed in parallel." },
  { phase: 1, level: 3, title: "Up-pass · Reach the root", description: "The root now represents the composition of the full horizon, including the terminal boundary." },
  { phase: 2, level: 2, title: "Down-pass · Split the root", description: "The right child copies the parent’s suffix. The left child prepends its right sibling’s interval to that suffix, keeping the intervals in time order." },
  { phase: 2, level: 1, title: "Down-pass · Split both halves", description: "The same rule runs in parallel for both halves. The down-pass reuses the interval compositions already computed during the up-pass." },
  { phase: 2, level: 0, title: "Down-pass · Carry a suffix to every leaf", description: "Each leaf now has the composition of every interval after it. The terminal leaf receives an empty suffix." },
  { phase: 3, title: "Postfix results", description: "Each leaf prepends its own local relation to the carried suffix. This includes the starting step in every postfix result." },
];

function intervalLabel({ start, end }) {
  return start + "→" + end;
}

function scanTuple(interval) {
  return "\\mathcal{E}_{" + interval.start + "\\to " + interval.end + "}";
}

function inlineMath(tex) {
  return "\\(" + tex + "\\)";
}

// The up-pass gives each subtree an interval. Prepending a contiguous
// interval to a suffix composes them in chronological order.
function prependInterval(interval, suffix) {
  return { start: interval.start, end: suffix.end };
}

function svgElement(tag, attributes) {
  const node = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function setTreeTuple(label, interval) {
  if (!interval) {
    label.textContent = "–";
    return;
  }
  const subscript = svgElement("tspan", { class: "tree-subscript", dy: 4 });
  subscript.textContent = intervalLabel(interval);
  label.replaceChildren("ℰ", subscript);
}

function buildTree() {
  const svg = svgElement("svg", {
    class: "scan-tree-svg",
    viewBox: "0 0 640 296",
    role: "img",
    "aria-label": "Binary scan tree. Every node shows its up-scan tuple above its down-scan tuple.",
  });
  const defs = svgElement("defs", {});
  for (const [direction, color] of [["up", "#1d4ed8"], ["down", "#92400e"]]) {
    const marker = svgElement("marker", {
      id: "scan-arrow-" + direction, viewBox: "0 0 8 8", markerWidth: 6, markerHeight: 6,
      refX: 7, refY: 4, orient: "auto",
    });
    marker.append(svgElement("path", { d: "M 0 0 L 8 4 L 0 8 Z", fill: color }));
    defs.append(marker);
  }
  svg.append(defs);
  const links = svgElement("g", { "aria-hidden": "true" });
  const labels = svgElement("g", { "aria-hidden": "true" });
  svg.append(links, labels);
  const nodes = [];

  for (let level = 0; level <= treeDepth; level++) {
    const span = 2 ** level;
    const row = [];
    for (let start = 0; start < scanEnd; start += span) {
      const interval = { start, end: start + span };
      const x = 40 + 80 * (start + (span - 1) / 2);
      const y = 260 - 76 * level;
      const group = svgElement("g", { class: "tree-node", transform: "translate(" + x + " " + y + ")" });
      const upLabel = svgElement("text", { class: "tree-interval", y: -13 });
      const downLabel = svgElement("text", { class: "tree-suffix", y: 12 });
      group.append(
        svgElement("path", { class: "tree-half-up", d: "M -34 0 V -17 Q -34 -25 -26 -25 H 26 Q 34 -25 34 -17 V 0 Z" }),
        svgElement("path", { class: "tree-half-down", d: "M -34 0 H 34 V 17 Q 34 25 26 25 H -26 Q -34 25 -34 17 Z" }),
        svgElement("rect", { class: "tree-border", x: -34, y: -25, width: 68, height: 50, rx: 8 }),
        svgElement("line", { class: "tree-divider", x1: -34, y1: 0, x2: 34, y2: 0 }),
        upLabel,
        downLabel,
      );
      labels.append(group);
      row.push({ group, upLabel, downLabel, interval, x, y, edge: null, children: [] });
    }
    nodes.push(row);
  }

  for (let level = 0; level < treeDepth; level++) {
    for (const [index, node] of nodes[level].entries()) {
      const parent = nodes[level + 1][Math.floor(index / 2)];
      parent.children.push(node);
      const bottom = node.x + " " + (node.y - 26);
      const top = parent.x + " " + (parent.y + 26);
      const up = "M " + bottom + " L " + top;
      const down = "M " + top + " L " + bottom;
      const group = svgElement("g", { class: "tree-edge" });
      const guide = svgElement("path", { class: "guide", d: up });
      const flow = svgElement("path", { class: "flow", d: up });
      group.append(guide, flow);
      links.append(group);
      node.edge = { group, guide, flow, up, down };
    }
  }

  nodes[treeDepth][0].after = { start: scanEnd, end: scanEnd };
  for (let level = treeDepth; level > 0; level--) {
    for (const parent of nodes[level]) {
      const [left, right] = parent.children;
      right.after = parent.after;
      left.after = prependInterval(right.interval, parent.after);
    }
  }
  return { svg, nodes };
}

function createSplit(parent) {
  const [left, right] = parent.children;
  const split = element("li", "scan-split");
  const received = scanTuple(right.interval) + " \\circ " + scanTuple(parent.after) + " = " + scanTuple(left.after);
  split.append(
    element("strong", "", "Split " + inlineMath(scanTuple(parent.interval))),
    element("span", "", "Left receives " + inlineMath(received) + "."),
    element("span", "", "Right copies " + inlineMath(scanTuple(parent.after)) + "."),
  );
  return split;
}

function setupScan() {
  const tree = buildTree();
  document.getElementById("scan-tree").append(tree.svg);

  const stages = document.querySelectorAll(".scan-phases li");
  const title = document.getElementById("scan-stage");
  const description = document.getElementById("scan-description");
  const position = document.getElementById("scan-position");
  const local = document.getElementById("scan-local");
  const downDetail = document.getElementById("scan-down-detail");
  const splits = document.getElementById("scan-splits");
  const output = document.getElementById("scan-output");
  const suffixes = document.getElementById("scan-suffixes");
  const play = document.getElementById("scan-play");
  const previous = document.getElementById("scan-previous");
  const next = document.getElementById("scan-next");
  const reset = document.getElementById("scan-reset");
  const lastStep = scanStages.length - 1;
  let step = 0;
  let timer = null;

  // Keep the equations in the DOM so MathJax can typeset them at startup.
  const splitRows = tree.nodes.slice(1).map((parents) => parents.map(createSplit));
  splits.append(...splitRows.flat());

  for (const leaf of tree.nodes[0]) {
    const value = scanTuple(prependInterval(leaf.interval, leaf.after));
    const composition = scanTuple(leaf.interval) + " \\circ " + scanTuple(leaf.after);
    suffixes.append(element("li", "", inlineMath(value + " = " + composition)));
  }

  function render() {
    const { phase, level, title: heading, description: caption } = scanStages[step];
    const direction = phase >= 2 ? "down" : "up";
    const frontier = phase === 3 ? 0 : level ?? 0;
    tree.svg.dataset.direction = direction;
    tree.svg.dataset.playing = String(timer !== null);
    for (const [depth, row] of tree.nodes.entries()) {
      for (const { group, upLabel, downLabel, interval, after, edge } of row) {
        const showUp = phase >= 2 || depth <= frontier;
        const showAfter = phase >= 2 && depth >= frontier;
        const showResult = phase === 3 && depth === 0;
        group.classList.toggle("has-up", showUp);
        group.classList.toggle("has-down", showAfter);
        group.classList.toggle("is-active", depth === frontier);
        setTreeTuple(upLabel, showUp ? interval : null);
        const downInterval = showResult ? prependInterval(interval, after) : after;
        setTreeTuple(downLabel, showAfter ? downInterval : null);
        if (!edge) continue;
        const active = (phase === 1 && depth === level - 1) || (phase === 2 && depth === level);
        edge.group.classList.toggle("is-active", active);
        edge.guide.setAttribute("d", edge[direction]);
        edge.flow.setAttribute("d", edge[direction]);
        if (active) {
          edge.guide.setAttribute("marker-end", "url(#scan-arrow-" + direction + ")");
        } else {
          edge.guide.removeAttribute("marker-end");
        }
      }
    }
    for (const [index, item] of stages.entries()) {
      if (index === phase) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    }
    title.textContent = heading;
    description.textContent = caption;
    position.textContent = "Step " + (step + 1) + " of " + scanStages.length;
    local.hidden = step !== 0;
    downDetail.hidden = phase !== 2;
    for (const [depth, rows] of splitRows.entries()) {
      for (const row of rows) row.hidden = depth !== level;
    }
    output.hidden = step !== lastStep;
    previous.disabled = step === 0;
    next.disabled = step === lastStep;
    play.textContent = timer !== null ? "Pause" : step === lastStep ? "Replay" : "Play";
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
  }

  function goTo(index) {
    stop();
    step = index;
    render();
  }

  play.addEventListener("click", () => {
    if (timer !== null) {
      stop();
    } else {
      if (step === lastStep) step = 0;
      timer = window.setInterval(() => {
        step++;
        if (step === lastStep) stop();
        render();
      }, 1600);
    }
    render();
  });
  previous.addEventListener("click", () => goTo(step - 1));
  next.addEventListener("click", () => goTo(step + 1));
  reset.addEventListener("click", () => goTo(0));
  document.getElementById("scan-controls").hidden = false;
  render();
}

setupScan();
setupResults();
