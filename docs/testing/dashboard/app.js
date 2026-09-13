const state = { events: [] };
const $ = (id) => document.getElementById(id);
const statuses = ["pass", "fail", "block", "skip", "not_run"];
const colors = { pass: "#35e06f", fail: "#ff3b9d", block: "#ff7438", skip: "#00d9ff", not_run: "#111111" };

async function loadSource() {
  try {
    const response = await fetch("../events.ndjson", { cache: "no-store" });
    if (!response.ok) throw new Error("source unavailable");
    loadText(await response.text(), "events.ndjson loaded");
  } catch (_) {
    state.events = [];
    render("Use file picker to load events.ndjson when opened from disk.");
  }
}

function loadText(text, message) {
  const events = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    try { events.push(JSON.parse(line)); }
    catch (_) { throw new Error(`Invalid JSON on line ${index + 1}`); }
  });
  state.events = events;
  render(message);
}

function render(message = "") {
  const tests = state.events.filter((e) => e.t === "test");
  const runs = state.events.filter((e) => e.t === "run");
  const results = state.events.filter((e) => e.t === "result");
  const defects = state.events.filter((e) => e.t === "defect" && e.s !== "closed");
  const executed = results.filter((e) => ["pass", "fail"].includes(e.s));
  const evidence = results.filter((e) => Array.isArray(e.ev) && e.ev.length);
  const pass = results.filter((e) => e.s === "pass").length;

  $("tests-count").textContent = tests.length;
  $("runs-count").textContent = runs.length;
  $("results-count").textContent = results.length;
  $("pass-rate").textContent = `${percent(pass, executed.length)}`;
  $("evidence-rate").textContent = `${percent(evidence.length, results.length)}`;
  $("open-defects").textContent = defects.length;
  $("message").textContent = `${message || "Updated"} ${state.events.length} event(s).`;
  $("updated").textContent = new Date().toLocaleString();

  renderLatestRun(runs, results);
  renderAreas(tests, results);
  renderDefects(defects);
  drawStatuses(results);
  drawAreas(tests, results);
}

function renderLatestRun(runs, results) {
  const latest = [...runs].sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))[0];
  const body = $("latest-run");
  if (!latest) { body.innerHTML = '<tr><td class="empty">No runs recorded.</td></tr>'; return; }
  const items = results.filter((e) => e.run === latest.id);
  const pass = items.filter((e) => e.s === "pass").length;
  body.innerHTML = `<tr><th>ID</th><td>${esc(latest.id)}</td></tr><tr><th>Date</th><td>${esc(latest.at || "-")}</td></tr><tr><th>Build</th><td><code>${esc(latest.build || "-")}</code></td></tr><tr><th>Results</th><td>${pass}/${items.length} passed</td></tr>`;
}

function renderAreas(tests, results) {
  const areas = [...new Set(tests.map((e) => e.area || "unassigned").concat(results.map((e) => areaFor(e, tests))))].sort();
  const rows = areas.map((area) => {
    const items = results.filter((e) => areaFor(e, tests) === area);
    const count = (status) => items.filter((e) => e.s === status).length;
    return `<tr><td>${esc(area)}</td><td>${count("pass")}</td><td>${count("fail")}</td><td>${count("block")}</td><td>${items.length}</td><td>${percent(count("pass"), items.filter((e) => ["pass", "fail"].includes(e.s)).length)}</td></tr>`;
  });
  $("area-results").innerHTML = rows.join("") || '<tr><td colspan="6" class="empty">No test results recorded.</td></tr>';
}

function renderDefects(defects) {
  $("defects").innerHTML = defects.map((e) => `<tr><td><code>${esc(e.id)}</code></td><td>${esc(e.sev || "-")}</td><td>${esc(e.test || "-")}</td><td>${esc(e.run || "-")}</td><td>${esc(e.name || "-")}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">No open defects recorded.</td></tr>';
}

function drawStatuses(results) {
  const values = statuses.map((status) => results.filter((e) => e.s === status).length);
  drawBars($("status-chart"), values, statuses, colors);
  $("status-legend").textContent = statuses.map((s, i) => `${s}: ${values[i]}`).join(" · ") || "No results.";
}

function drawAreas(tests, results) {
  const areas = [...new Set(results.map((e) => areaFor(e, tests)))].sort();
  drawBars($("area-chart"), areas.map((area) => results.filter((e) => areaFor(e, tests) === area && e.s === "pass").length), areas, { pass: colors.pass });
}

function drawBars(canvas, values, labels, palette) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width; const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...values, 1); const slot = width / Math.max(values.length, 1);
  values.forEach((value, i) => {
    const barHeight = (value / max) * 105;
    ctx.fillStyle = palette[labels[i]] || ["#ffd400", colors.cyan, colors.magenta][i % 3];
    ctx.fillRect(i * slot + 9, height - 25 - barHeight, Math.max(slot - 18, 8), barHeight);
    ctx.fillStyle = "#111111"; ctx.font = "10px Arial"; ctx.textAlign = "center";
    ctx.fillText(String(value), i * slot + slot / 2, height - 31 - barHeight);
    ctx.fillText(String(labels[i]).slice(0, 10), i * slot + slot / 2, height - 9);
  });
}

function areaFor(result, tests) { return (tests.find((test) => test.id === result.test) || {}).area || "unassigned"; }
function percent(value, total) { return total ? `${Math.round((value / total) * 100)}%` : "0%"; }
function esc(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }

$("events-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { loadText(reader.result, `${file.name} loaded`); } catch (error) { render(error.message); } };
  reader.readAsText(file);
});
$("reload").addEventListener("click", loadSource);
loadSource();
