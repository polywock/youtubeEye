const { resolve } = require("path")
const { env } = require("process")

const common = {
  entry: {
    preamble: "./src/preamble.ts",
    raccoon: "./src/raccoon/index.tsx",
    background: "./src/background.ts"
  },
  output: {
    path: resolve(__dirname, env.FIREFOX ? "buildFf" : "build", "unpacked")
  },
  resolve: {
    extensions: [".tsx", ".ts", '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
            {
              loader: "css-loader",
              options: {
                url: false,
                importLoaders: 1
              }
            },
            "postcss-loader"
        ]
      }
    ]
  }
}

if (env.NODE_ENV === "production") {
  module.exports = {
    ...common,
    mode: "production"
  }
} else {
  module.exports = {
    ...common,
    mode: "development",
    devtool: false
  }
}