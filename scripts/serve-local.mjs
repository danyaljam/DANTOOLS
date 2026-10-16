import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { exec } from "node:child_process";

const host = "127.0.0.1";
const port = Number(process.env.PORT ?? 4173);
const outputDirectory = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "out"
);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' blob: data:",
  "font-src 'self' data:",
  "form-action 'self'",
  "img-src 'self' blob: data:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' wasm-unsafe-eval",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob: data:",
].join("; ");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

function openBrowser(targetUrl) {
  if (process.env.OPEN_BROWSER === "false" || process.argv.includes("--no-browser")) {
    return;
  }
  const platform = process.platform;
  let command;
  if (platform === "win32") {
    // Attempt Edge App mode, fallback to default browser
    command = `start "" "${targetUrl}"`;
  } else if (platform === "darwin") {
    command = `open "${targetUrl}"`;
  } else {
    command = `xdg-open "${targetUrl}"`;
  }
  try {
    exec(command, () => {});
  } catch {
    // Ignore browser open errors
  }
}

function findPage(pathname) {
  const normalizedPath = normalize(decodeURIComponent(pathname)).replace(
    /^[/\\]+/,
    ""
  );
  const relativePath = normalizedPath || "index.html";
  const filePath = resolve(outputDirectory, relativePath);

  if (filePath !== outputDirectory && !filePath.startsWith(`${outputDirectory}${sep}`)) {
    return null;
  }

  const candidates = [filePath];
  if (!extname(filePath)) {
    candidates.push(`${filePath}.html`, resolve(filePath, "index.html"));
  }

  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url ?? "/", `http://${host}`).pathname;
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  let filePath;
  try {
    filePath = findPage(pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    "Content-Security-Policy": contentSecurityPolicy,
    "X-Content-Type-Options": "nosniff",
  });

  if (request.method === "HEAD") {
    response.end();
  } else {
    createReadStream(filePath).pipe(response);
  }
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`DAN Tools is available at ${url}`);
  console.log("This server accepts connections from this device only.");
  openBrowser(url);
});