const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const envPath = path.join(root, ".env");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function loadLocalEnvironment() {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    process.env[match[1]] = value;
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function handleApi(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }

  if (request.method === "POST") {
    let rawBody = "";
    for await (const chunk of request) {
      rawBody += chunk;
      if (Buffer.byteLength(rawBody) > 16384) {
        sendJson(response, 413, { error: "O pedido excede o tamanho permitido." });
        return;
      }
    }
    try {
      request.body = JSON.parse(rawBody || "{}");
    } catch {
      sendJson(response, 400, { error: "O corpo da solicitação precisa ser JSON válido." });
      return;
    }
  }

  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (payload) => {
    if (!response.headersSent) response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(payload));
    return response;
  };

  try {
    await require("./api/generate.js")(request, response);
  } catch (error) {
    console.error("A rota local da IA falhou:", error.message);
    if (!response.headersSent) sendJson(response, 500, { error: "Erro interno ao processar a solicitação." });
  }
}

function serveStatic(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  if (decodedPath.split(/[\\/]/).some((part) => part.startsWith("."))) {
    response.writeHead(404);
    response.end();
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(root, relativePath);
  const relative = path.relative(root, filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !mimeTypes[extension]) {
    response.writeHead(404);
    response.end();
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    });
    response.end(request.method === "HEAD" ? undefined : content);
  });
}

loadLocalEnvironment();
const port = Number(process.env.PORT) || 3000;
const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  if (requestUrl.pathname === "/api/generate") {
    void handleApi(request, response);
    return;
  }
  serveStatic(request, response, requestUrl.pathname);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`KAW Generetor disponível em http://127.0.0.1:${port}`);
});
