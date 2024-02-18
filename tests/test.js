import { expect } from "chai";
import { scenarios, readFile, buildApp } from "./setup.js";

describe("Embroider build", function () {
  let indexHtml;

  for (const scenario of scenarios) {
    describe(`Scenario: ${scenario}`, function () {
      before(async function () {
        indexHtml = await readFile(scenario);
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

      expect(error.cause.message).to.include(
        '<script src="http://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>',
      );

      expect(error.cause.message).to.include(
        '<script src="//ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>',
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
      indexHtml = indexHtml = await readFile(
        "external-resource-with-integrity-hash",
      );
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
