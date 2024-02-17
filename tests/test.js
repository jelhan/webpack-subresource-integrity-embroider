import { expect } from "chai";
import { readdirSync, readFileSync } from "node:fs";
import path from 'node:path';
import { JSDOM } from "jsdom";
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe("Embroider build", function () {
  let indexHtml;

  const scenarios = readdirSync(path.join(__dirname, '..', 'test-apps'));

  for (const scneario of scenarios) {
    describe(`Scenario: ${scneario}`, function() {
      before(function () {
        try {
          const indexHtmlContent = readFileSync(path.join('..', 'test-apps', scneario, 'dist', 'index.html'), {
            encoding: "utf8",
          });
          indexHtml = new JSDOM(indexHtmlContent).window.document;
        } catch (error) {
          throw new Error(
            "Parsing index.html of test-app build failed. Double check that test-app has been build successfuly.",
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
