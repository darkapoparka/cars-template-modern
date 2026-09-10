import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const nextCommand = process.argv[2];
if (nextCommand !== "dev" && nextCommand !== "start") {
  throw new Error("Public web server command must be dev or start");
}

const publicPort = Number.parseInt(process.env.E2E_PUBLIC_PORT ?? "3001", 10);
if (!Number.isInteger(publicPort) || publicPort < 1024 || publicPort > 65_535) {
  throw new Error("E2E_PUBLIC_PORT must be a valid non-privileged port");
}

const publicWebRoot = resolve(import.meta.dirname, "../web");
const publicNextCli = resolve(publicWebRoot, "node_modules/next/dist/bin/next");
process.chdir(publicWebRoot);

process.on("message", (message) => {
  if (message === "shutdown") {
    process.emit("SIGTERM");
  }
});

process.argv = [
  process.execPath,
  publicNextCli,
  nextCommand,
  publicWebRoot,
  "-H",
  "127.0.0.1",
  "-p",
  String(publicPort),
];

await import(pathToFileURL(publicNextCli).href);
