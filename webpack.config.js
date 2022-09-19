var path = require("path");

module.exports = {

    entry: "./src/js/viewer-core.js",
    output: {

        path: path.resolve(__dirname + "/src/js/"),
        filename: "viewer-core-compiled.js"

    }

};