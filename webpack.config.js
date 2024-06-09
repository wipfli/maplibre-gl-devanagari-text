// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/maplibre-gl-devanagari-text.js',
  output: {
    filename: 'maplibre-gl-devanagari-text.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.txt$/,
        loader: 'raw-loader',
      },
      {
        test: /\.csv$/,
        loader: 'raw-loader',
      },
      {
        test: /\.wasm$/,
        loader: 'wasm-loader'
      }
    ]
  },
  mode: 'development',
};
