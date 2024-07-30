import { expect } from "chai";
import { scenarios, getIndexHtml, buildApp } from "./setup.js";

describe("Embroider build", function () {
  let indexHtml;

  function isInlineScript(el) {
    return !el.hasAttribute("src");
  }

  for (const scenario of scenarios) {
    describe(`Scenario: ${scenario}`, function () {
      before(async function () {
        indexHtml = await getIndexHtml(scenario);
      });

      it("adds integrity attribute to link elements for stylesheets", function () {
        for (const el of indexHtml.querySelectorAll('link[rel="stylesheet"]')) {
          expect(el.hasAttribute("integrity")).to.be.true;
          expect(el.getAttribute("integrity")).to.be.a("string");
        }
      });

      it("adds integrity attribute to script elements", function () {
        for (const el of indexHtml.querySelectorAll("script")) {
          if (isInlineScript(el)) {
            expect(el.hasAttribute("integrity")).to.be.false;
          } else {
            expect(el.hasAttribute("integrity")).to.be.true;
            expect(el.getAttribute("integrity")).to.be.a("string");
          }
        }
      });

      it("adds crossorigin attribute to link elements for stylesheets", function () {
        for (const el of indexHtml.querySelectorAll('link[rel="stylesheet"]')) {
          expect(el.hasAttribute("crossorigin")).to.be.true;
          expect(el.getAttribute("crossorigin")).to.be.a("string");
          expect(el.getAttribute("crossorigin")).to.equal("anonymous");
        }
      });

      it("adds crossorigin attribute to script elements", function () {
        for (const el of indexHtml.querySelectorAll("script")) {
          if (isInlineScript(el)) {
            expect(el.hasAttribute("crossorigin")).to.be.false;
          } else {
            expect(el.hasAttribute("crossorigin")).to.be.true;
            expect(el.getAttribute("crossorigin")).to.be.a("string");
            expect(el.getAttribute("crossorigin")).to.equal("anonymous");
          }
        }
      });

      if (scenario === "default") {
        it("adds integrity attribute to link elements for alternate stylesheets", function () {
          for (const el of indexHtml.querySelectorAll(
            'link[rel="alternate stylesheet"]',
          )) {
            expect(el.hasAttribute("integrity")).to.be.true;
            expect(el.getAttribute("integrity")).to.be.a("string");
          }
        });

        it("adds integrity attribute to link elements for modules", function () {
          for (const el of indexHtml.querySelectorAll('link[rel="module"]')) {
            expect(el.hasAttribute("integrity")).to.be.true;
            expect(el.getAttribute("integrity")).to.be.a("string");
          }
        });

        it("adds integrity attribute to link elements for modulepreloads", function () {
          for (const el of indexHtml.querySelectorAll(
            "link[rel=modulepreload]",
          )) {
            expect(el.hasAttribute("integrity")).to.be.true;
            expect(el.getAttribute("integrity")).to.be.a("string");
          }
        });

        it("adds crossorigin attribute to link elements for alternate stylesheets", function () {
          for (const el of indexHtml.querySelectorAll(
            'link[rel="alternate stylesheet"]',
          )) {
            expect(el.hasAttribute("crossorigin")).to.be.true;
            expect(el.getAttribute("crossorigin")).to.be.a("string");
            expect(el.getAttribute("crossorigin")).to.equal("anonymous");
          }
        });

        it("adds crossorigin attribute to link elements for modules", function () {
          for (const el of indexHtml.querySelectorAll('link[rel="module"]')) {
            expect(el.hasAttribute("crossorigin")).to.be.true;
            expect(el.getAttribute("crossorigin")).to.be.a("string");
            expect(el.getAttribute("crossorigin")).to.equal("anonymous");
          }
        });

        it("adds crossorigin attribute to link elements for modulepreloads", function () {
          for (const el of indexHtml.querySelectorAll(
            "link[rel=modulepreload]",
          )) {
            expect(el.hasAttribute("crossorigin")).to.be.true;
            expect(el.getAttribute("crossorigin")).to.be.a("string");
            expect(el.getAttribute("crossorigin")).to.equal("anonymous");
          }
        });

        it("does not add integrity or crossorigin to unsupported links", function () {
          const dnsPrefetch = indexHtml.querySelector(
            'link[rel="dns-prefetch"]',
          );
          expect(dnsPrefetch.hasAttribute("integrity")).to.be.false;
          expect(dnsPrefetch.hasAttribute("crossorigin")).to.be.false;

          const manifest = indexHtml.querySelector('link[rel="manifest"]');
          expect(manifest.hasAttribute("integrity")).to.be.false;
          expect(manifest.hasAttribute("crossorigin")).to.be.false;

          const icon = indexHtml.querySelector('link[rel="icon"]');
          expect(icon.hasAttribute("integrity")).to.be.false;
          expect(icon.hasAttribute("crossorigin")).to.be.false;

          const appleTouchIcon = indexHtml.querySelector(
            'link[rel="apple-touch-icon"]',
          );
          expect(appleTouchIcon.hasAttribute("integrity")).to.be.false;
          expect(appleTouchIcon.hasAttribute("crossorigin")).to.be.false;
        });
      }
    });
  }
});

describe("When rootURL and publicPath do not match", function () {
  let indexHtml, stylesheets;

  before(async function () {
    indexHtml = await getIndexHtml("rooturl-and-publicpath-differ");
    stylesheets = indexHtml.querySelectorAll('link[rel="stylesheet"]');
  });

  it("Some links start with publicPath, some start with rootURL", function () {
    for (const stylesheet of stylesheets) {
      const href = stylesheet.getAttribute("href");
      expect(href.startsWith("/a-different-public-path/")).to.be.true;
    }
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
