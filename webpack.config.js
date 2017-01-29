module.exports = {
  entry: './src/script.ts',
  output: {
    filename: 'shwww/bundle.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js', '.tsx', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'babel-loader!ts-loader' },
      { test: /\.scss$/, loaders: ['style', 'css', 'sass'] },
      { test: /\.peg$/, loader: 'raw-loader'}
    ]
  }
}
