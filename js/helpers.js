// Shared helpers. Loaded first; everything here is used by tools.js and app.js.
const $ = s => document.querySelector(s);

const toB64 = s => { let r = ""; new TextEncoder().encode(s).forEach(x => r += String.fromCharCode(x)); return btoa(r); };
const fromB64 = s => { s = s.trim().replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); };
const urlSafe = s => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const pretty = o => JSON.stringify(o, null, 2);
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

// MD5 is not in the Web Crypto API (it is broken for security use), so it is implemented here.
// Takes a Uint8Array and returns the hash as a hex string.
function md5(bytes) {
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296));
  const buf = new Uint8Array((((bytes.length + 8) >>> 6) + 1) * 64), view = new DataView(buf.buffer);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  view.setUint32(buf.length - 8, (bytes.length * 8) >>> 0, true);
  view.setUint32(buf.length - 4, Math.floor(bytes.length / 536870912), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < buf.length; off += 64) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const s = S[(i >> 4) * 4 + (i % 4)];
      F = (F + A + K[i] + view.getUint32(off + g * 4, true)) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map(w => [0, 8, 16, 24].map(sh => ((w >>> sh) & 255).toString(16).padStart(2, "0")).join("")).join("");
}

function relative(d) {
  const s = Math.round((d - Date.now()) / 1000), a = Math.abs(s);
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const [name, sec] = units.find(u => a >= u[1]) || units[5];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(s / sec), name);
}
