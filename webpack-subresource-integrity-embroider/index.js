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
        const scriptElements =
          indexHtml.window.document.querySelectorAll("script");
        const linkElements = indexHtml.window.document.querySelectorAll("link");
        await Promise.all(
          [...scriptElements, ...linkElements].map(async (element) => {
            // calculate integrity
            const hashAlgorithm = "sha384";
            const assetLocation =
              element.tagName === "SCRIPT"
                ? element.getAttribute("src")
                : element.getAttribute("href");
            // strip publishPath from locations
            const fileName = assetLocation.replace(publicPath, "/");

            if (fileName === "/ember-cli-live-reload.js") {
              // ember-cli-live-reload.js does not exist on disk
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
        await writeFile(indexHtmlPath, indexHtml.serialize());
      },
    );
  }
}

module.exports = SubresourceIntegrityPlugin;
