'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const SubresourceIntegrityPlugin = require('webpack-subresource-integrity-embroider');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    // Add options here
  });

  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    staticEmberSource: true,
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
    packagerOptions: {
      webpackConfig: {
        plugins: [new SubresourceIntegrityPlugin()],
      },
    },
  });
};
