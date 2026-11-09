// Shared helpers. Loaded first; everything here is used by tools.js and app.js.
const $ = s => document.querySelector(s);

const toB64 = s => { let r = ""; new TextEncoder().encode(s).forEach(x => r += String.fromCharCode(x)); return btoa(r); };
const fromB64 = s => { s = s.trim().replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); };
const urlSafe = s => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const pretty = o => JSON.stringify(o, null, 2);

function relative(d) {
  const s = Math.round((d - Date.now()) / 1000), a = Math.abs(s);
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const [name, sec] = units.find(u => a >= u[1]) || units[5];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(s / sec), name);
}
