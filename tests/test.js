import { expect } from "chai";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "url";
import { execa } from "execa";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const testApps = readdirSync(path.join(__dirname, "..", "test-apps"));

async function buildApp(scenario) {
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

const scenarios = testApps.filter((file) => {
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

describe("Embroider build", function () {
  let indexHtml;

  for (const scenario of scenarios) {
    describe(`Scenario: ${scenario}`, function () {
      before(async function () {
        try {
          const indexHtmlContent = readFileSync(
            path.join("..", "test-apps", scenario, "dist", "index.html"),
            {
              encoding: "utf8",
            },
          );
          indexHtml = new JSDOM(indexHtmlContent).window.document;
        } catch (error) {
          throw new Error(
            "Parsing index.html of test-app build failed. Double check that test-app has been built successfully.",
            { cause: error },
          );
        }
      });

      it("adds integrity attribute to link elements for stylesheets", function () {
        for (const el of indexHtml.querySelectorAll("link")) {
          expect(el.hasAttribute("integrity")).to.be.true;
          expect(el.getAttribute("integrity")).to.be.a("string");
        }
      });

      it("adds integrity attribute to script elements", function () {
        for (const el of indexHtml.querySelectorAll("script")) {
          expect(el.hasAttribute("integrity")).to.be.true;
          expect(el.getAttribute("integrity")).to.be.a("string");
        }
      });

      it("adds crossorigin attribute to link elements for stylesheets", function () {
        for (const el of indexHtml.querySelectorAll("script")) {
          expect(el.hasAttribute("crossorigin")).to.be.true;
          expect(el.getAttribute("crossorigin")).to.be.a("string");
          expect(el.getAttribute("crossorigin")).to.equal("anonymous");
        }
      });

      it("adds crossorigin attribute to script elements", function () {
        for (const el of indexHtml.querySelectorAll("script")) {
          expect(el.hasAttribute("crossorigin")).to.be.true;
          expect(el.getAttribute("crossorigin")).to.be.a("string");
          expect(el.getAttribute("crossorigin")).to.equal("anonymous");
        }
      });
    });
  }
});

describe("External resource handling", function () {
  it("Build throws an error if integrity hash is missing", async function () {
    this.timeout(60000);
    try {
      await buildApp("external-resource-missing-integrity-hash");
      expect(false, "Build should have failed").to.be.ok;
    } catch (error) {
      expect(error.cause.message).to.include(
        '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>',
      );
    }
  });

  it("Build does not throw an error if integrity hash is present", async function () {
    this.timeout(60000);
    const buildOutput = await buildApp("external-resource-with-integrity-hash");
    expect(buildOutput.exitCode).to.equal(0);
  });

  describe("Existing integrity and origin", function () {
    let indexHtml;

    before(async function () {
      try {
        const indexHtmlContent = readFileSync(
          path.join(
            "..",
            "test-apps",
            "external-resource-with-integrity-hash",
            "dist",
            "index.html",
          ),
          {
            encoding: "utf8",
          },
        );
        indexHtml = new JSDOM(indexHtmlContent).window.document;
      } catch (error) {
        throw new Error(
          "Parsing index.html of test-app build failed. Double check that test-app has been built successfully.",
          { cause: error },
        );
      }
    });

    it("Leaves existing crossorigin attribute as is", function () {
      for (const el of indexHtml.querySelectorAll(
        "script[src='https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js']",
      )) {
        expect(el.hasAttribute("crossorigin")).to.be.true;
        expect(el.getAttribute("crossorigin")).to.be.a("string");
        expect(el.getAttribute("crossorigin")).to.equal("anonymous");
      }
    });

    it("Leaves existing integrity as is", function () {
      for (const el of indexHtml.querySelectorAll(
        "script[src='https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js']",
      )) {
        expect(el.hasAttribute("integrity")).to.be.true;
        expect(el.getAttribute("integrity")).to.be.a("string");
        expect(el.getAttribute("integrity")).to.equal(
          "sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs",
        );
      }
    });
  });
});
