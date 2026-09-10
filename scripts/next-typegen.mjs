import { spawn } from "node:child_process";
import { resolve } from "node:path";

const nextCli =
  process.env.NODE_ENV === "test" &&
  process.env.AUTOMARKET_NEXT_TYPEGEN_TEST_CLI
    ? resolve(process.env.AUTOMARKET_NEXT_TYPEGEN_TEST_CLI)
    : resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const hiddenFailurePatterns = [
  /Environment contract violation/u,
  /Invalid environment variables/u,
  /Unhandled Rejection/u,
];
const deploymentEnvironments = new Set(["preview", "production"]);
let recentOutput = "";
let hiddenFailureDetected = false;
const localToolingOrigins = {
  NEXT_PUBLIC_API_URL: "http://localhost:3002",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_WEB_URL: "http://localhost:3001",
};

const inspectOutput = (chunk, destination) => {
  const text = chunk.toString();
  destination.write(text);
  recentOutput = `${recentOutput}${text}`.slice(-16_384);
  hiddenFailureDetected ||= hiddenFailurePatterns.some((pattern) =>
    pattern.test(recentOutput)
  );
};

if (deploymentEnvironments.has(process.env.VERCEL_ENV ?? "")) {
  console.error(
    "Provider-free route type generation is local/CI tooling and refuses Vercel Preview or Production environments."
  );
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, [nextCli, "typegen"], {
    env: {
      ...process.env,
      ...Object.fromEntries(
        Object.entries(localToolingOrigins).map(([name, fallback]) => [
          name,
          process.env[name] || fallback,
        ])
      ),
      // Route type generation does not need live provider credentials. Runtime
      // builds and release preflight continue to validate the real environment.
      SKIP_ENV_VALIDATION: "true",
    },
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => inspectOutput(chunk, process.stdout));
  child.stderr.on("data", (chunk) => inspectOutput(chunk, process.stderr));

  child.on("error", (error) => {
    console.error("Failed to start Next.js route type generation.", error);
    process.exitCode = 1;
  });

  child.on("close", (exitCode, signal) => {
    if (signal) {
      console.error(`Next.js route type generation stopped by ${signal}.`);
      process.exitCode = 1;
      return;
    }

    if (exitCode !== 0 || hiddenFailureDetected) {
      if (hiddenFailureDetected && exitCode === 0) {
        console.error(
          "Next.js route type generation reported a hidden runtime failure."
        );
      }
      process.exitCode = exitCode || 1;
    }
  });
}
