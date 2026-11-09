# Dev Toolbox

Everyday developer conversions in one page. It runs entirely in your browser, so nothing you paste is uploaded anywhere.

## Tools

- **JSON**: format, minify, and validate
- **Base64**: encode (standard or URL-safe) and decode, with full UTF-8 support
- **URL**: encode, decode, and parse into protocol, host, path, and query parameters
- **JWT**: decode the header and payload and check expiry (the signature is not verified)
- **Timestamp**: convert Unix seconds or milliseconds and ISO dates to UTC, local time, and relative time

## Use it

Open `index.html` in a browser. There is no build step and no dependencies.

To host it for free, go to **Settings → Pages** in your repo, choose the `main` branch, and your tool will be live at `https://<your-username>.github.io/<repo-name>/`.

## Add a tool

Each tool is one entry in the `TOOLS` array in `index.html`: a name, a description, an example input, and a list of modes. A mode is a function that takes the input text and returns the output text, or throws an `Error` with a message to show.

## License

MIT
