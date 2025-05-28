const Path = require("path")
const FS = require("fs")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const WebpackShellPluginNext = require("webpack-shell-plugin-next")
const Webpack = require("webpack")
const Package = require("./package.json")

const USE_ESBUILD = true

const config = (env) => {
    if (typeof Package.port !== "number") {
        // Define a random port number for dev server.
        Package.port = 1204 + Math.floor(Math.random() * (0xffff - 1024))
        FS.writeFileSync(
            Path.resolve(__dirname, "package.json"),
            JSON.stringify(Package, null, "    ")
        )
        console.log("A random port has been set for dev server:", Package.port)
    }

    const isProdMode = env.production === true
    if (isProdMode) {
        console.log("+-----------------+")
        console.log("| Production Mode |")
        console.log("+-----------------+")
    }
    return {
        cache: {
            type: "memory",
        },
        output: {
            clean: true,
            filename: "scr/[name].[contenthash].js",
            path: Path.resolve(__dirname, "build"),
            devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        },
        entry: {
            app: "./src/index.tsx",
        },
        target: "web",
        resolve: {
            extensions: [".tsx", ".ts", ".js", ".jsx", ".wasm"],
            enforceExtension: false,
            alias: {
                "@": Path.resolve(__dirname, "src/"),
                "react/jsx-runtime": Path.resolve(
                    __dirname,
                    "/node_modules/react/jsx-runtime.js"
                ),
                react: Path.resolve(__dirname, "/node_modules/react/index.js"),
            },
        },
        devtool: isProdMode ? false : "inline-source-map",
        devServer: {
            compress: env.production,
            static: {
                directory: Path.resolve(__dirname, "./public"),
            },
            client: {
                logging: "none",
                overlay: env.production
                    ? false
                    : { errors: true, runtimeErrors: true, warnings: false },
                progress: true,
            },
            devMiddleware: {
                writeToDisk: true,
            },
            hot: true,
            // Open WebBrowser.
            open: true,
            host: "0.0.0.0",
            port: env.PORT || Package.port,
            server: "http",
        },
        stats: {
            colors: true,
            errorDetails: false,
        },
        plugins: [
            new Webpack.ProgressPlugin(),
            new WebpackShellPluginNext({
                onBeforeCompile: {
                    scripts: ["npm run generate"],
                    blocking: true,
                    parallel: false,
                },
            }),

            // // List of the needed files for later caching.
            // new WebpackManifestPlugin({
            //     filter: (file) => {
            //         if (file.name.endsWith(".map")) return false
            //         if (file.name.endsWith(".ts")) return false
            //         return true
            //     },
            // }),
            new CleanWebpackPlugin({
                // We don't want to remove the "index.html" file
                // after the incremental build triggered by watch.
                cleanStaleWebpackAssets: false,
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: Path.resolve(__dirname, "public"),
                        filter: async (path) => {
                            // Allow non-root index.html to be copied verbatim.
                            return !path.endsWith("/public/index.html")
                        },
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                template: "public/index.html",
                filename: "index.html",
                version: Package.version,
                title: Package.name,
                minify: {
                    collapseInlineTagWhitespace: isProdMode,
                    collapseWhitespace: isProdMode,
                    decodeEntities: isProdMode,
                    minifyCSS: isProdMode,
                    removeComments: isProdMode,
                },
            }),
        ],
        performance: {
            hints: "warning",
            maxAssetSize: 300000,
            maxEntrypointSize: 200000,
            assetFilter: (filename) => {
                // PNG are just fallbacks for WEBP images.
                if (filename.endsWith(".png")) return false
                if (filename.endsWith(".map")) return false
                return true
            },
        },
        optimization: {
            splitChunks: {
                chunks: "all",
                cacheGroups: {
                    defaultVendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            },
            // Prevent "libs.[contenthash].js" from changing its hash if not needed.
            moduleIds: "deterministic",
        },
        module: {
            rules: [
                USE_ESBUILD
                    ? {
                          test: /\.tsx?$/,
                          loader: "esbuild-loader",
                          options: {
                              loader: "tsx", // Or 'ts' if you don't need tsx
                              target: "es2015",
                          },
                      }
                    : {
                          test: /\.tsx?$/,
                          use: [
                              {
                                  loader: "ts-loader",
                                  options: {
                                      transpileOnly: false,
                                  },
                              },
                          ],
                          exclude: /node_modules/,
                      },
                ,
                {
                    test: /\.(png|jpe?g|gif|webp|avif|svg|mp4)$/i,
                    // More information here https://webpack.js.org/guides/asset-modules/
                    type: "asset",
                    generator: {
                        filename: "img/[name].[hash][ext][query]",
                    },
                },
                {
                    test: /\.(bin|glb)$/i,
                    // More information here https://webpack.js.org/guides/asset-modules/
                    type: "asset",
                    generator: {
                        filename: "bin/[name].[hash][ext][query]",
                    },
                },
                {
                    test: /\.(eot|ttf|woff|woff2)$/i,
                    // More information here https://webpack.js.org/guides/asset-modules/
                    type: "asset/resource",
                    generator: {
                        filename: "fnt/[name].[hash][ext][query]",
                    },
                },
                {
                    test: /\.(vert|frag|obj)$/i,
                    // More information here https://webpack.js.org/guides/asset-modules/
                    type: "asset/source",
                },
                {
                    test: /\.(py|txt|sh|md)$/i,
                    // More information here https://webpack.js.org/guides/asset-modules/
                    type: "asset/source",
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: "style-loader",
                            options: {
                                injectType: "styleTag",
                            },
                        },
                        {
                            loader: "css-loader",
                            options: {
                                modules: {
                                    auto: true,
                                    localIdentName: isProdMode
                                        ? "[hash:base64]"
                                        : "[path][name]_[local]_[hash:base64:6]",
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.mdx?$/,
                    use: [
                        // `babel-loader` is optional:
                        { loader: "babel-loader", options: {} },
                        {
                            loader: "@mdx-js/loader",
                            /** @type {import('@mdx-js/loader').Options} */
                            options: {
                                /* jsxImportSource: …, otherOptions… */
                            },
                        },
                    ],
                },
            ],
        },
    }
}

module.exports = config
