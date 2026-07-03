const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/renderer/workbench/workbench.ts',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'workbench.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/workbench/workbench.html',
      filename: 'workbench.html'
    })
  ],
  devtool: 'source-map'
};
