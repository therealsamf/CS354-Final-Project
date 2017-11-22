
/**
 * Webpack config file for building the client
 */
const path = require('path');

module.exports = {
    entry: './src/index.js',

    context: __dirname,

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/'),
        publicPath: path.resolve(__dirname, 'dist/')
    },

    module: {
        rules: [
            {test: /\.js$/, loader: 'babel-loader', exclude: [/node_modules/, /dependencies/], query: { presets: ["stage-0"] }}
        ]
    },
    devtool: 'inline-source-map'
}