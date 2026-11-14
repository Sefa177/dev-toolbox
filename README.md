# Dev Toolbox

![Dev Toolbox demo](assets/demo.gif)

**[Try it live](https://sefa177.github.io/dev-toolbox/)**

Everyday developer conversions in one page. It runs entirely in your browser, so nothing you paste is uploaded anywhere.

## Tools

* **JSON**: format, minify, and validate
* **Base64**: encode (standard or URL-safe) and decode, with full UTF-8 support
* **URL**: encode, decode, and parse into protocol, host, path, and query parameters
* **JWT**: decode the header and payload and check expiry (the signature is not verified)
* **Timestamp**: convert Unix seconds or milliseconds and ISO dates to UTC, local time, and relative time
* **UUID**: generate v4 UUIDs (type how many, up to 100) and check whether a UUID is valid
* **Hash**: SHA-256 and SHA-1 (built-in Web Crypto API) and MD5, or all three at once. MD5 and SHA-1 are fine for checksums but not for security
* **Color**: convert between HEX, RGB, and HSL (with optional alpha) and see a live preview swatch
* **Regex**: test a pattern with flags against your text, with matches highlighted and capture groups listed
* **Theme toggle**: switch between light and dark. It follows your system until you choose, then remembers your choice

## Project structure

```
index.html        page markup
css/styles.css    styles
js/helpers.js     shared helpers (Base64, relative time, MD5)
js/tools.js       tool definitions (add new tools here)
js/app.js         UI wiring
assets/           demo image and static assets
```

## Add a tool

Each tool is one entry in the `TOOLS` array in `js/tools.js`: a name, a description, an example input, and a list of modes. A mode is a function that takes the input text and returns the output text, or throws an Error to show a message. A mode may also return a Promise (the Hash tool does), or `{ html, text }` to show formatted output (the Regex tool does).

## License

MIT
