// Kleine testserver: serveert de statische testpagina en simuleert de
// Firestore-opslag (documenten en deelverzamelingen), omdat de echte
// Firestore-emulator in deze omgeving geen bestanden kan downloaden.
// De echte Firebase Authentication-emulator draait er wél naast (poort 9099).
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const store = Object.create(null); // { "collection/id/sub/id": {...data...} }

function send(res, status, body, contentType){
  res.writeHead(status, { "Content-Type": contentType || "application/json" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  // Alle directe kinddocumenten onder een pad (voor collection().get()/.onSnapshot()).
  if(url.pathname.startsWith("/fsfake-collection/")){
    const prefix = decodeURIComponent(url.pathname.slice("/fsfake-collection/".length)).replace(/\/$/, "");
    if(req.method === "GET"){
      const docs = [];
      Object.keys(store).forEach((key) => {
        if(key.indexOf(prefix + "/") === 0){
          const rest = key.slice(prefix.length + 1);
          if(rest.indexOf("/") === -1){
            docs.push({ id: rest, data: store[key] });
          }
        }
      });
      send(res, 200, JSON.stringify({ docs }));
      return;
    }
    send(res, 405, JSON.stringify({ error: "method not allowed" }));
    return;
  }

  if(url.pathname.startsWith("/fsfake/")){
    const key = decodeURIComponent(url.pathname.slice("/fsfake/".length));
    if(req.method === "GET"){
      if(Object.prototype.hasOwnProperty.call(store, key)){
        send(res, 200, JSON.stringify(store[key]));
      } else {
        send(res, 404, JSON.stringify({ error: "not found" }));
      }
      return;
    }
    if(req.method === "PUT"){
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", () => {
        try{
          const parsed = JSON.parse(body);
          const existing = store[key] || {};
          store[key] = parsed.merge ? Object.assign({}, existing, parsed.data) : parsed.data;
          send(res, 200, JSON.stringify({ ok: true }));
        } catch(e){
          send(res, 400, JSON.stringify({ error: "bad request" }));
        }
      });
      return;
    }
    if(req.method === "DELETE"){
      delete store[key];
      send(res, 200, JSON.stringify({ ok: true }));
      return;
    }
    send(res, 405, JSON.stringify({ error: "method not allowed" }));
    return;
  }

  // statische bestanden
  let filePath = path.join(ROOT, url.pathname === "/" ? "/index.html" : url.pathname);
  fs.readFile(filePath, (err, data) => {
    if(err){ send(res, 404, "not found", "text/plain"); return; }
    const ext = path.extname(filePath);
    const types = { ".html":"text/html", ".js":"application/javascript", ".json":"application/json", ".css":"text/css" };
    send(res, 200, data, types[ext] || "application/octet-stream");
  });
});

const PORT = 8090;
server.listen(PORT, "127.0.0.1", () => console.log("test server up on http://127.0.0.1:" + PORT));
