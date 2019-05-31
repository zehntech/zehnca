var crypto = require('crypto');
var config = require('../../server/config.json');
var path = require('path');
var winston = require('winston');

var transports  = [];

transports.push(new winston.transports.DailyRotateFile({
  name: 'file',
  datePattern: '.yyyy-MM-dd',
  filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});

module.exports = function (KeyManagement) {

    KeyManagement.observe('before save', function (ctx, next) {

      logger.log('info','request for update Access and secret keys ');

        var key = {};
        if (ctx.instance) {
            key = ctx.instance;

        } else if (ctx.data) {
            key = ctx.data;
        } else {
            next();
        }
        logger.log('info','keys detail ', key);



        var cipher = crypto.createCipher(config.algorithm, config.password);

        var cryptedAccKey = cipher.update(key.accessKey, 'utf8', 'hex');
        cryptedAccKey += cipher.final('hex');

        var cipher1 = crypto.createCipher(config.algorithm, config.password1);

        var cryptedScretKey = cipher1.update(key.secretKey, 'utf8', 'hex');
        cryptedScretKey += cipher1.final('hex');


        key.accessKey = cryptedAccKey;
        key.secretKey = cryptedScretKey;
        logger.log('info','access and secret keys are encrypted successfully',{company : key.companyId});

        key.createdDate = Date.now();
        next();
    });


        /**
     * Function to get key for a specified company ID
     * @param id
     * @param cb
     */
    KeyManagement.getKey = function (id,  cb) {

        KeyManagement.findOne({
            where: {
                companyId: id
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'Err in getting key from database for company Id ' + id, err);
                return cb(err);
            }
            if (data) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');
                data.accessKey = dec1;

                var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');
                data.secretKey = dec2;

                return cb(null, data);

            } else {
                logger.log('info', 'No key found');

                return cb(null,'Key doesn\'t exist');
            }
        });

    };
    KeyManagement.remoteMethod('getKey', {
        description: 'Returns a decrypted key for a specified company ID.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'get', path: '/getKey'}
    });


};
