module.exports = {
  entry: './src/script.ts',
  output: {
    filename: 'shwww/bundle.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.scss$/, loaders: ['style', 'css', 'sass'] }
    ]
  }
}
