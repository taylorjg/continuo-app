const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    port: 3400
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/index.html'
        },
        {
          from: 'assets/**/*'
        }
      ]
    }),
    new webpack.DefinePlugin({
      'typeof CANVAS_RENDERER': JSON.stringify(true),
      'typeof WEBGL_RENDERER': JSON.stringify(true)
    })
  ]
}
