var path = require('path');
var fs = require('fs');


module.exports = function (Logger) {


    Logger.openFile = function (file, cb) {
        var filePath = path.join('logs',  file);
        fs.readFile(filePath, 'utf8', function (err, data) {
            if (err){
                return cb(err);
            }

            return cb(null, data);
        });
    };
    Logger.remoteMethod('openFile', {
        description: 'Read file from file system',
        accepts: [
            {arg: 'file', type: 'string', required: true, description: ['Name of file']}
        ],
        returns: {arg: 'data', type: 'object'},
        http: {verb: 'get', path: '/openFile'}
    });


};
