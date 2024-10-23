const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.wasm']
  },
  experiments: {
    asyncWebAssembly: true
  },
  externals: {
    'electrum-client': 'commonjs electrum-client'
  }
};
