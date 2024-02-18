import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "url";
import { execa } from "execa";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export async function readFile(scenario) {
  try {
    const indexHtmlContent = readFileSync(
      path.join("..", "test-apps", scenario, "dist", "index.html"),
      {
        encoding: "utf8",
      },
    );
    return new JSDOM(indexHtmlContent).window.document;
  } catch (error) {
    throw new Error(
      "Parsing index.html of test-app build failed. Double check that test-app has been built successfully.",
      { cause: error },
    );
  }
}
export async function buildApp(scenario) {
  try {
    return await execa("pnpm", ["build"], {
      cwd: path.join(__dirname, "..", "test-apps", scenario),
    });
  } catch (error) {
    throw new Error(
      "Building the test app failed. Please test manually running `pnpm build` for that test app",
      { cause: error },
    );
  }
}
export const scenarios = readdirSync(
  path.join(__dirname, "..", "test-apps"),
).filter((file) => {
  // skip this app as it's intended to fail the build
  return file !== "external-resource-missing-integrity-hash";
});
console.log("Building scenarios:");
await Promise.all(
  scenarios.map((scenario) =>
    (async () => {
      try {
        await buildApp(scenario);
        console.log(`✅ Built ${scenario}`);
      } catch (error) {
        console.error(`❌ Failed to build ${scenario}`);
        throw error;
      }
    })(),
  ),
);
