const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd());
module.exports = {
    entry: path.resolve(appDirectory, "src/game.ts"),
    output: {
        filename: "js/[name].js",
        chunkFilename: "js/[name].chunk.js",
        clean: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".glsl", ".vert", ".frag"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080,
        static: path.resolve(appDirectory, "public"),
        hot: true,
        devMiddleware: {
            publicPath: "/",
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.wgsl$/,
                use: 'raw-loader',
            }
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'public',
                    to: '.',
                    globOptions: {
                        ignore: ['**/*.html'],
                    },
                },
            ],
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html"),
        })
    ],
    mode: "development",
    optimization: {
        splitChunks: {
            chunks: 'all',
            maxSize: 10000000, // limit is 25MB, way lower value to be sure
        },
    }
};
