// Tool definitions. To add a tool, add an entry to TOOLS at the bottom.
// Each mode is [label, fn]: fn takes the input text and returns the output text, or throws an Error to show a message.

function jwt(i) {
  const p = i.trim().split(".");
  if (p.length < 2) throw new Error("A JWT has three parts separated by dots (header.payload.signature).");
  const h = JSON.parse(fromB64(p[0])), b = JSON.parse(fromB64(p[1]));
  let out = "Header\n" + pretty(h) + "\n\nPayload\n" + pretty(b) + "\n";
  ["iat", "nbf", "exp"].forEach(k => { if (typeof b[k] === "number") out += `\n${k.padEnd(4)} ${new Date(b[k] * 1000).toISOString()}`; });
  if (typeof b.exp === "number") out += "\n\nStatus: " + (b.exp * 1000 < Date.now() ? "expired" : "not expired");
  return out + "\n\nThe signature is not verified.";
}

function timestamp(i) {
  i = i.trim();
  const d = /^-?\d+(\.\d+)?$/.test(i) ? new Date(Math.abs(+i) < 1e11 ? +i * 1000 : +i) : new Date(i);
  if (isNaN(d)) throw new Error("Enter a Unix timestamp or a date such as 2026-11-09T12:00:00Z.");
  return [
    ["Unix (s)", Math.floor(d / 1000)], ["Unix (ms)", d.getTime()],
    ["UTC", d.toISOString()], ["Local", d.toString()], ["Relative", relative(d)]
  ].map(([k, v]) => k.padEnd(10) + v).join("\n");
}

function parseUrl(i) {
  const u = new URL(i.trim());
  let out = ["Protocol  " + u.protocol, "Host      " + u.host, "Path      " + u.pathname, "Hash      " + (u.hash || "(none)")].join("\n");
  const q = [...u.searchParams];
  out += "\n\nQuery parameters" + (q.length ? "" : "\n(none)");
  q.forEach(([k, v]) => out += `\n${k} = ${v}`);
  return out;
}

function uuidV4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function uuidGenerate(i) {
  const n = Number(i.trim());
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Enter how many UUIDs to generate, from 1 to 100.");
  return Array.from({ length: n }, uuidV4).join("\n");
}

function uuidCheck(i) {
  const v = i.trim();
  const m = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(v);
  if (!m) throw new Error("Not a valid UUID. Expected 8-4-4-4-12 hex characters, e.g. 3f2b8c1e-9a4d-4e7b-8c15-2d6f0a9b7e41.");
  const version = parseInt(m[3][0], 16), variant = parseInt(m[4][0], 16);
  const nil = /^0{8}(-0{4}){3}-0{12}$/.test(v);
  return [
    ["Valid", "yes"], ["Version", nil ? "nil (all zeros)" : version],
    ["Variant", (variant & 0xc) === 0x8 ? "RFC 4122" : "other"], ["Lowercase", v.toLowerCase()]
  ].map(([k, x]) => k.padEnd(10) + x).join("\n");
}

// ---- Hash ----

async function digest(algo, text) {
  if (!(globalThis.crypto && crypto.subtle)) throw new Error("The Web Crypto API only works on https:// pages or localhost.");
  return toHex(await crypto.subtle.digest(algo, new TextEncoder().encode(text)));
}

const md5Text = t => md5(new TextEncoder().encode(t));

async function hashAll(i) {
  const rows = [["SHA-256", await digest("SHA-256", i)], ["SHA-1", await digest("SHA-1", i)], ["MD5", md5Text(i)]];
  return rows.map(([k, v]) => k.padEnd(8) + v).join("\n");
}

// ---- Color ----

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map(x => Math.round(x * 255));
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// Reads #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba(), hsl()/hsla() or a bare "r, g, b". Returns { r, g, b, a }.
function parseColor(input) {
  const s = input.trim().toLowerCase();
  const bad = new Error("Could not read that color. Try #2b59ff, rgb(43, 89, 255) or hsl(228, 100%, 58%).");
  let m = /^#?([0-9a-f]+)$/.exec(s);
  if (m && [3, 4, 6, 8].includes(m[1].length)) {
    let h = m[1];
    if (h.length < 5) h = [...h].map(c => c + c).join("");
    const n = i => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  let kind, body;
  if ((m = /^(rgb|hsl)a?\s*\((.*)\)$/.exec(s))) { kind = m[1]; body = m[2]; }
  else if (/^[\d.\s,%\/-]+$/.test(s)) { kind = "rgb"; body = s; }
  else throw bad;
  const p = body.split(/[\s,\/]+/).filter(Boolean);
  if (p.length < 3 || p.length > 4) throw bad;
  const parts = p.map(t => {
    const x = /^(-?\d*\.?\d+)(%|deg)?$/.exec(t);
    if (!x) throw new Error(`"${t}" is not a number.`);
    return { v: parseFloat(x[1]), unit: x[2] };
  });
  let a = 1;
  if (parts[3]) {
    a = parts[3].unit === "%" ? parts[3].v / 100 : parts[3].v;
    if (a < 0 || a > 1) throw new Error("Alpha must be between 0 and 1 (or 0% and 100%).");
  }
  if (kind === "rgb") {
    const [r, g, b] = parts.slice(0, 3).map(({ v, unit }) => Math.round(unit === "%" ? v * 2.55 : v));
    if ([r, g, b].some(x => x < 0 || x > 255)) throw new Error("RGB values must be between 0 and 255.");
    return { r, g, b, a };
  }
  const h = ((parts[0].v % 360) + 360) % 360, sat = parts[1].v, lig = parts[2].v;
  if (sat < 0 || sat > 100 || lig < 0 || lig > 100) throw new Error("HSL saturation and lightness must be between 0% and 100%.");
  const [r, g, b] = hslToRgb(h, sat, lig);
  return { r, g, b, a };
}

function colorFormats(i) {
  const c = parseColor(i), [h, s, l] = rgbToHsl(c.r, c.g, c.b);
  const hasA = c.a < 1, a = +c.a.toFixed(3);
  const hex = "#" + [c.r, c.g, c.b, ...(hasA ? [Math.round(c.a * 255)] : [])].map(x => x.toString(16).padStart(2, "0")).join("");
  return {
    HEX: hex,
    RGB: hasA ? `rgba(${c.r}, ${c.g}, ${c.b}, ${a})` : `rgb(${c.r}, ${c.g}, ${c.b})`,
    HSL: hasA ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`
  };
}

const colorAll = i => Object.entries(colorFormats(i)).map(([k, v]) => k.padEnd(5) + v).join("\n");
const colorOne = key => i => colorFormats(i)[key];

function colorPreview(i) {
  try { const c = parseColor(i); return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`; }
  catch { return null; }
}

// ---- Regex ----

// The second argument comes from the Pattern and Flags boxes above the editor.
function regexTest(text, { pattern, flags }) {
  if (!pattern) throw new Error("Type a pattern in the box above, for example (\\w+)@(\\w+)\\.com");
  const re = new RegExp(pattern, [...new Set(flags.replace(/\s/g, ""))].join(""));
  const LIMIT = 1000, matches = [];
  if (re.global) { for (const m of text.matchAll(re)) { matches.push(m); if (matches.length >= LIMIT) break; } }
  else { const m = re.exec(text); if (m) matches.push(m); }

  let html = "", pos = 0;
  matches.forEach((m, i) => {
    html += esc(text.slice(pos, m.index));
    html += m[0] === "" ? '<mark class="z"></mark>' : `<mark class="${i % 2 ? "b" : "a"}">${esc(m[0])}</mark>`;
    pos = m.index + m[0].length;
  });
  html += esc(text.slice(pos));

  const n = matches.length;
  const lines = [`${n} match${n === 1 ? "" : "es"}${n >= LIMIT ? ` (showing the first ${LIMIT})` : ""}`];
  const show = v => v === undefined ? "(no match)" : JSON.stringify(v);
  matches.forEach((m, i) => {
    lines.push(`#${i + 1}  ${show(m[0])} at ${m.index}`);
    for (let g = 1; g < m.length; g++) lines.push(`      group ${g}: ${show(m[g])}`);
    if (m.groups) Object.entries(m.groups).forEach(([k, v]) => lines.push(`      ${k}: ${show(v)}`));
  });
  const summary = lines.join("\n");
  return { html: html + "\n\n" + esc(summary), text: summary };
}

const TOOLS = [
  { id: "json", name: "JSON", desc: "Format and validate",
    example: '{"name":"dev-toolbox","tags":["json","base64"],"private":false}',
    modes: [["Format", i => pretty(JSON.parse(i))], ["Minify", i => JSON.stringify(JSON.parse(i))]] },
  { id: "base64", name: "Base64", desc: "Encode and decode",
    example: "Hello, Dev Toolbox!",
    modes: [["Encode", toB64], ["Encode (URL-safe)", i => urlSafe(toB64(i))], ["Decode", fromB64]] },
  { id: "url", name: "URL", desc: "Encode, decode, parse",
    example: "https://example.com/search?q=hello world&lang=en#results",
    modes: [["Encode", encodeURIComponent], ["Decode", decodeURIComponent], ["Parse", parseUrl]] },
  { id: "jwt", name: "JWT", desc: "Decode tokens",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.signature",
    modes: [["Decode", jwt]] },
  { id: "time", name: "Timestamp", desc: "Unix time and dates",
    example: String(Math.floor(Date.now() / 1000)),
    modes: [["Convert", timestamp]] },
  { id: "uuid", name: "UUID", desc: "Generate and check",
    example: "5",
    modes: [["Generate (v4)", uuidGenerate], ["Check", uuidCheck]] },
  { id: "hash", name: "Hash", desc: "SHA-256, SHA-1, MD5",
    example: "hello world",
    modes: [["SHA-256", i => digest("SHA-256", i)], ["SHA-1", i => digest("SHA-1", i)], ["MD5", md5Text], ["All", hashAll]] },
  { id: "color", name: "Color", desc: "HEX, RGB, HSL",
    example: "#2b59ff",
    preview: colorPreview,
    modes: [["All formats", colorAll], ["HEX", colorOne("HEX")], ["RGB", colorOne("RGB")], ["HSL", colorOne("HSL")]] },
  { id: "regex", name: "Regex", desc: "Test and highlight",
    example: "Contact ada@example.com or linus@example.org for details.",
    exampleOpts: { pattern: "(\\w+)@(\\w+)\\.(com|org)", flags: "g" },
    regex: true, noSwap: true, inLabel: "Test text",
    modes: [["Test", regexTest]] }
];
