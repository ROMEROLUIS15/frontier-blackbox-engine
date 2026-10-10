import { createServer } from "./http/server.ts";

const token = process.env["TEAM_TOKEN"];
if (token === undefined || token === "") {
  console.error("TEAM_TOKEN environment variable is required");
  process.exitCode = 1;
} else {
  const port = Number(process.env["PORT"] ?? "3000");
  createServer(token).listen(port, "0.0.0.0", () => {
    console.log(`listening on 0.0.0.0:${port}`);
  });
}
