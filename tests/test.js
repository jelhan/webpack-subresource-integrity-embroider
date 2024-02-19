import { expect } from "chai";
import { scenarios, getIndexHtml, buildApp } from "./setup.js";

describe("Embroider build", function () {
  let indexHtml;

  for (const scenario of scenarios) {
    describe(`Scenario: ${scenario}`, function () {
      before(async function () {
        indexHtml = await getIndexHtml(scenario);
      });

      it("adds integrity attribute to link elements for stylesheets", function () {
        for (const el of indexHtml.querySelectorAll("link[rel=stylesheet]")) {
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
        for (const el of indexHtml.querySelectorAll("link[rel=stylesheet]")) {
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

describe("When rootURL and publicPath do not match", function () {
  let indexHtml, manifest, favicons;

  before(async function () {
    indexHtml = await getIndexHtml("rooturl-and-publicpath-differ");
    favicons = indexHtml.querySelectorAll(
      'link[rel="icon"], link[rel="apple-touch-icon"]',
    );
    manifest = indexHtml.querySelector('link[rel="manifest"]');
  });

  it("Favicons have integrity hash", async function () {
    for (const favicon of favicons) {
      expect(favicon.hasAttribute("integrity")).to.be.true;
      expect(favicon.getAttribute("integrity")).to.be.a("string");
    }
  });

  it("Favicons have crossorigin attribute", async function () {
    for (const favicon of favicons) {
      expect(favicon.hasAttribute("crossorigin")).to.be.true;
      expect(favicon.getAttribute("crossorigin")).to.be.a("string");
      expect(favicon.getAttribute("crossorigin")).to.equal("anonymous");
    }
  });

  it("Manifest has integrity hash", async function () {
    expect(manifest.hasAttribute("integrity")).to.be.true;
    expect(manifest.getAttribute("integrity")).to.be.a("string");
  });

  it("Manifest has crossorigin attribute", async function () {
    expect(manifest.hasAttribute("crossorigin")).to.be.true;
    expect(manifest.getAttribute("crossorigin")).to.be.a("string");
    expect(manifest.getAttribute("crossorigin")).to.equal("anonymous");
  });
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
      indexHtml = await getIndexHtml("external-resource-with-integrity-hash");
    });

    it("Leaves existing crossorigin attribute as is", function () {
      const el = indexHtml.querySelector(
        "script[src='https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js']",
      );
      expect(el.hasAttribute("crossorigin")).to.be.true;
      expect(el.getAttribute("crossorigin")).to.be.a("string");
      expect(el.getAttribute("crossorigin")).to.equal("anonymous");
    });

    it("Leaves existing integrity as is", function () {
      const el = indexHtml.querySelector(
        "script[src='https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js']",
      );
      expect(el.hasAttribute("integrity")).to.be.true;
      expect(el.getAttribute("integrity")).to.be.a("string");
      expect(el.getAttribute("integrity")).to.equal(
        "sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs",
      );
    });
  });
});
