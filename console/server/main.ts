import { createBffServer } from "./bff-server.ts";
import { parseConfig } from "./config.ts";

const configResult = parseConfig(process.env);
if (!configResult.ok) {
  console.error(JSON.stringify({ level: "error", event: "config", reason: configResult.reason }));
  process.exit(1);
}
const { port, distDir } = configResult.config;

const server = createBffServer({ distDir });
let stopping = false;

function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  console.log(JSON.stringify({ level: "info", event: "shutdown", signal }));
  server.close(); // the server close event also closes every sandbox session
  server.closeAllConnections();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.listen(port, "127.0.0.1", () => {
  console.log(JSON.stringify({ level: "info", event: "listening", host: "127.0.0.1", port }));
});
