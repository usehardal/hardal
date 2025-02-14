const path = require('path');

module.exports = {
  entry: './src/Hardal.ts',
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'Hardal',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  optimization: {
    minimize: true
  }
}; 