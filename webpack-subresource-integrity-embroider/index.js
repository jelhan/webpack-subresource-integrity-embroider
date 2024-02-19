const { JSDOM } = require("jsdom");
const { readFile, writeFile } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const path = require("node:path");

class SubresourceIntegrityPlugin {
  apply(compiler) {
    compiler.hooks.done.tapPromise(
      "WriteSRIToIndexHtmlPlugin",
      async (stats) => {
        const { outputPath, publicPath } = stats.toJson();
        const indexHtmlPath = path.join(outputPath, "index.html");
        const indexHtmlContent = await readFile(indexHtmlPath, "utf-8");
        const indexHtml = new JSDOM(indexHtmlContent);
        const environmentMeta = indexHtml.window.document.querySelector(
          'meta[name$="/config/environment"]',
        );
        const { rootURL } = JSON.parse(
          indexHtml.window.unescape(environmentMeta.getAttribute("content")),
        );
        const rootURLOrPublicPathRegex = new RegExp(
          `^(${rootURL}|${publicPath})`,
        );
        const scriptElements =
          indexHtml.window.document.querySelectorAll("script");
        const linkElements = indexHtml.window.document.querySelectorAll("link");
        const fileErrors = [];
        await Promise.all(
          [...scriptElements, ...linkElements].map(async (element) => {
            // calculate integrity
            const hashAlgorithm = "sha384";
            const assetLocation =
              element.tagName === "SCRIPT"
                ? element.getAttribute("src")
                : element.getAttribute("href");
            // strip rootURL or publishPath from locations
            const fileName = assetLocation.replace(
              rootURLOrPublicPathRegex,
              "/",
            );
            const currentIntegrity = element.getAttribute("integrity");
            if (fileName === "/ember-cli-live-reload.js") {
              // ember-cli-live-reload.js does not exist on disk
              return;
            }

            if (fileName.startsWith("http") || fileName.startsWith("//")) {
              if (currentIntegrity && currentIntegrity.trim() !== "") return;

              fileErrors.push(element);

              return;
            }

            const fileHash = createHash(hashAlgorithm)
              .update(await readFile(path.join(outputPath, fileName)))
              .digest("base64");

            // set integrity attribute
            element.setAttribute("integrity", `${hashAlgorithm}-${fileHash}`);
            // set crossorigin attribute
            element.setAttribute("crossorigin", "anonymous");
          }),
        );

        if (fileErrors.length > 0) {
          let errorMessages = `🚨🚨 The following external resources do not have an integrity hash:\n`;

          for (const element of fileErrors) {
            errorMessages += `\n${element.outerHTML}`;
          }

          errorMessages +=
            "\n\nYou should generate an integrity hash for these files and apply it to the <script> or <link> tag in your index.html file.";
          errorMessages +=
            "\n\nLearn more about generating an integrity hash here:\nhttps://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity#tools_for_generating_sri_hashes";

          throw new Error(errorMessages);
        }

        await writeFile(indexHtmlPath, indexHtml.serialize());
      },
    );
  }
}

module.exports = SubresourceIntegrityPlugin;
