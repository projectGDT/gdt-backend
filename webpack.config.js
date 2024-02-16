// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');

const CopyPlugin = require("copy-webpack-plugin");

const config = {
    entry: './src/app.ts',
    mode: "production",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "index.js",
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "./node_modules/.prisma/client/query_engine-*node",
                    to: path.resolve(__dirname, 'dist')
                },
            ],
        })
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
    },
    target: "node",
    externals: {
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
    },
};

module.exports = () => config;
