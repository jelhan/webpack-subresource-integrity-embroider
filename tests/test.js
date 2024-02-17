import { expect } from "chai";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "url";
import { execa } from "execa";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("Embroider build", function () {
  let indexHtml;

  const scenarios = readdirSync(path.join(__dirname, "..", "test-apps")).filter(
    (file) =>
      [
        // skip these test apps
        "external-resource-missing-integrity-hash",
        "external-resource-with-integrity-hash",
      ].includes(file) === false,
  );

  for (const scenario of scenarios) {
    describe(`Scenario: ${scenario}`, function () {
      before(async function () {
        this.timeout(60000);
        try {
          await execa("pnpm", ["build"], {
            cwd: path.join(__dirname, "..", "test-apps", scenario),
          });

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

describe("Build error on missing integrity hash for external resources", function () {
  let buildOutput;

  beforeEach(async function () {
    this.timeout(60000);
    try {
      await execa("pnpm", ["build"], {
        cwd: path.join(
          __dirname,
          "..",
          "test-apps",
          "external-resource-missing-integrity-hash",
        ),
      });
    } catch (error) {
      buildOutput = error.message;
    }
  });

  it("Throws an error if integrity hash is missing", function () {
    expect(buildOutput).to.include(
      "🚨🚨 The following external resources do not have an integrity hash:\n" +
        '\n<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>\n',
    );
  });
});

describe("No build error when integrity hash present for external resources", function () {
  let buildOutput;

  beforeEach(async function () {
    this.timeout(60000);
    try {
      const output = await execa("pnpm", ["build"], {
        cwd: path.join(
          __dirname,
          "..",
          "test-apps",
          "external-resource-with-integrity-hash",
        ),
      });
      buildOutput = output.stdout;
    } catch (error) {
      buildOutput = error.message;
    }
  });

  it("Does not throw an error if integrity hash is present", function () {
    expect(buildOutput).to.not.include(
      "🚨🚨 The following external resources do not have an integrity hash:\n",
    );
  });
});
