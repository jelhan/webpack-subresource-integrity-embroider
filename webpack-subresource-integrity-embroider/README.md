# Webpack Subresource Integrity plugin for Embroider

[Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (SRI) support for [Ember](https://emberjs.com/) applications using [Embroider](https://github.com/embroider-build/embroider).

## Motivation

The [ember-cli-sri](https://github.com/jonathanKingston/ember-cli-sri) addon provided Subresource Integrity support for Ember applications. Nowadays the Ember community migrates to Embroider, which uses [Webpack](https://webpack.js.org/) as bundler. The ember-cli-sri addon does not provide Ember applications using Embroider.

The [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) package is the de facto standard for Subresource Integrity support in Webpack ecosystem. Sadly, it cannot be used for Ember apps using Embroider (yet):

1. Some JavaScript and CSS files generated by an Embroider app are _not_ managed through Webpack. Those are invisible to the webpack-subresource-integrity plugin.
2. The `index.html` file generated by Embroider is _not_ managed by Webpack. This prevents using the [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/) for adding the `integrity` values calculated by webpack-subresource-integrity`to the generated`index.html`.

## Usage

The `webpack-subresource-integrity-embroider` plugin should be added to Webpack build pipeline as any other Webpack plugin. To do so, add it to `packagerOptions.webpackConfig.plugins` array of your Embroider configuration in the `ember-cli-build.js`:

```js
const EmberApp = require("ember-cli/lib/broccoli/ember-app");
const SubresourceIntegrityPlugin = require("webpack-subresource-integrity-embroider");

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});

  const { maybeEmbroider } = require("@embroider/test-setup");
  return maybeEmbroider(app, {
    packagerOptions: {
      webpackConfig: {
        plugins: [new SubresourceIntegrityPlugin()],
      },
    },
  });
};
```

## License

This project is licensed under the MIT License.
