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
    modes: [["Convert", timestamp]] }
];
