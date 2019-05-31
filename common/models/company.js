var path = require('path');
var winston = require('winston');

var transports  = [];

transports.push(new winston.transports.DailyRotateFile({
  name: 'file',
  datePattern: '.yyyy-MM-dd',
  filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});

module.exports = function (Company) {

        Company.observe('before save', function (ctx, next) {

        if (ctx.instance) {

            logger.log('info', 'register new  company %j', ctx.instance);
        }
        next();

    });
};
