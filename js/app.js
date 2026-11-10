// UI wiring: navigation, mode buttons, input/output handling. Loaded last.
const inputs = {};
let tool = TOOLS[0], mode = 0, hasError = false;
const inEl = $("#in"), outEl = $("#out");

function run() {
  const v = inEl.value;
  inputs[tool.id] = v;
  outEl.classList.remove("err");
  hasError = false;
  if (!v.trim()) { outEl.textContent = ""; }
  else {
    try { outEl.textContent = tool.modes[mode][1](v); }
    catch (e) { outEl.textContent = e.message; outEl.classList.add("err"); hasError = true; }
  }
  const empty = !outEl.textContent;
  $("#copy").disabled = $("#swap").disabled = hasError || empty;
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
$("#example").onclick = () => { inEl.value = tool.example; run(); };
$("#clear").onclick = () => { inEl.value = ""; run(); inEl.focus(); };
$("#swap").onclick = () => { inEl.value = outEl.textContent; run(); };
$("#copy").onclick = async e => {
  try { await navigator.clipboard.writeText(outEl.textContent); e.target.textContent = "Copied"; }
  catch { e.target.textContent = "Copy failed"; }
  setTimeout(() => e.target.textContent = "Copy output", 1200);
};
window.addEventListener("hashchange", () => select(location.hash.slice(1)));
select(location.hash.slice(1));
