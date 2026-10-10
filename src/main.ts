import { parsePort } from "./config.ts";
import { createServer } from "./http/server.ts";

const token = process.env["TEAM_TOKEN"];
const port = parsePort(process.env["PORT"]);

if (token === undefined || token === "") {
  console.error("TEAM_TOKEN environment variable is required");
  process.exitCode = 1;
} else if (port === null) {
  console.error("PORT must be an integer between 1 and 65535");
  process.exitCode = 1;
} else {
  createServer(token).listen(port, "0.0.0.0", () => {
    console.log(`listening on 0.0.0.0:${port}`);
  });
}
