// UI wiring: navigation, mode buttons, input/output handling, theme. Loaded last.
const inputs = {};
let tool = TOOLS[0], mode = 0, hasError = false, copyText = "", runId = 0;
const inEl = $("#in"), outEl = $("#out"), swatch = $("#swatch");
const regexOpts = () => ({ pattern: $("#rxPattern").value, flags: $("#rxFlags").value });

// A mode may return a string, a Promise of one (the Web Crypto API is async),
// or { html, text }: html is shown in the output panel, text is what Copy uses.
async function run() {
  const id = ++runId, t = tool, v = inEl.value;
  inputs[t.id] = v;
  let res = "", err = false;
  if (v.trim()) {
    try { res = await t.modes[mode][1](v, regexOpts()); }
    catch (e) { res = e.message; err = true; }
  }
  if (id !== runId) return; // a newer run has started, so drop this result
  hasError = err;
  outEl.classList.toggle("err", err);
  if (res && typeof res === "object") { outEl.innerHTML = res.html; copyText = res.text; }
  else { outEl.textContent = res; copyText = res; }
  const color = t.preview && v.trim() ? t.preview(v) : null;
  swatch.hidden = !color;
  if (color) swatch.firstElementChild.style.background = color;
  $("#copy").disabled = $("#swap").disabled = hasError || !copyText;
}

function renderModes() {
  const box = $("#modes");
  box.innerHTML = "";
  tool.modes.forEach(([label], idx) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.setAttribute("aria-pressed", idx === mode);
    b.onclick = () => { mode = idx; renderModes(); run(); };
    box.appendChild(b);
  });
  box.hidden = tool.modes.length < 2;
}

function select(id) {
  tool = TOOLS.find(t => t.id === id) || TOOLS[0];
  mode = 0;
  document.querySelectorAll("#nav button").forEach(b => b.setAttribute("aria-current", b.dataset.id === tool.id));
  inEl.value = inputs[tool.id] || "";
  $("label[for=in]").textContent = tool.inLabel || "Input";
  $("#rx").hidden = !tool.regex;
  $("#swap").hidden = !!tool.noSwap;
  renderModes();
  run();
}

TOOLS.forEach(t => {
  const b = document.createElement("button");
  b.dataset.id = t.id;
  b.innerHTML = `${t.name}<small>${t.desc}</small>`;
  b.onclick = () => { location.hash = t.id; };
  $("#nav").appendChild(b);
});

inEl.addEventListener("input", run);
$("#rxPattern").addEventListener("input", run);
$("#rxFlags").addEventListener("input", run);
$("#example").onclick = () => {
  inEl.value = tool.example;
  if (tool.exampleOpts) { $("#rxPattern").value = tool.exampleOpts.pattern; $("#rxFlags").value = tool.exampleOpts.flags; }
  run();
};
$("#clear").onclick = () => { inEl.value = ""; if (tool.regex) $("#rxPattern").value = ""; run(); inEl.focus(); };
$("#swap").onclick = () => { inEl.value = copyText; run(); };
$("#copy").onclick = async e => {
  try { await navigator.clipboard.writeText(copyText); e.target.textContent = "Copied"; }
  catch { e.target.textContent = "Copy failed"; }
  setTimeout(() => e.target.textContent = "Copy output", 1200);
};

// Theme: follows the system until the toggle is used, then the choice is saved.
const themeBtn = $("#theme"), darkQuery = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : darkQuery.matches;
function paintTheme() {
  const d = isDark();
  themeBtn.textContent = d ? "☾" : "☀";
  themeBtn.title = d ? "Switch to light theme" : "Switch to dark theme";
}
themeBtn.onclick = () => {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("devtoolbox-theme", next); } catch { /* storage blocked: the choice lasts until reload */ }
  paintTheme();
};
darkQuery.addEventListener("change", paintTheme);
paintTheme();

window.addEventListener("hashchange", () => select(location.hash.slice(1)));
select(location.hash.slice(1));
