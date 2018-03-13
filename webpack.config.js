const path = require('path');

export default {
  entry: './src/app.js',

  output: {
    path: path.resolve(__dirname, "dist"),
  },
 
  // webpack-dev-middleware options 
  // See https://github.com/webpack/webpack-dev-middleware 
  assets: {},
 
  // webpack-hot-middleware options 
  // See https://github.com/glenjamin/webpack-hot-middleware 
  hot: {}
};
