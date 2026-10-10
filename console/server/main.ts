import { createServer } from "node:http";
import { BFF_ERROR_STATUS } from "../contract/sandbox-api.ts";
import type { BffError } from "../contract/sandbox-api.ts";

const port = Number(process.env.PORT ?? 8781);

const notImplemented: BffError = {
  error: { code: "NOT_IMPLEMENTED", message: "The sandbox BFF is not implemented yet." },
};

const server = createServer((_request, response) => {
  const payload = JSON.stringify(notImplemented);
  response.writeHead(BFF_ERROR_STATUS.NOT_IMPLEMENTED, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`console BFF stub listening on 127.0.0.1:${port}`);
});
