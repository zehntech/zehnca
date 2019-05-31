var path = require('path'),
    fs = require("fs");

exports.privateKey = fs.readFileSync(path.join(__dirname, './private/server.key')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, './private/server.crt')).toString();
