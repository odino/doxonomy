var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        index: './doxonomy.js'
    },
    output: {
        filename: 'doxonomy.bundle.js',
        libraryTarget: "var",
        library: ["doxonomy"],
    },
    module: {
      loaders: [
        {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract("style-loader", "css-loader")
        },
      ]
    },
    plugins: [
        new ExtractTextPlugin("doxonomy.bundle.css")
    ]
}
