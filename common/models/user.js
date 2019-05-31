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

module.exports = function (user) {


    user.observe('before save', function (ctx, next) {

        if (ctx.instance) {
            ctx.instance.status = 'created';
            ctx.instance.created = Date.now();
            logger.log('info', 'register new  user '+ ctx.instance.email+ ' company ', {id: ctx.instance.companyId});
        }
        next();

    });

    //send verification email after registration
    user.afterRemote('create', function (ctx, user, next) {

        logger.log('info', 'registration completed, sending verification email %s', user.email );
        console.log('registration completed, sending verification email %s'+ user.email );

        var options = {
            type: 'email',
            to: user.email,
            from: config.from,
            subject: 'Welcome to ZehnCA. Please activate your account',
            template: path.resolve(__dirname, '../../server/views/verify.ejs'),
            user: user,
            verifyHref: config.domain+'/api/users/confirm?uid='+user.id+'&redirect=/verified'
        };

        user.verify(options, function (err) {
            if (err) {
                 logger.log('error', 'error in sending email to '+user.email, err );
                next(err);
                return;
            }
            logger.log('info', 'verification email sent: ', user );
            console.log('verification email sent:' );
            console.log( user );

            ctx.res.send({data : user.id});
        });
    });

    //send password reset link when requested
    user.on('resetPasswordRequest', function (info) {
         logger.log('info',' request for password reset ', info);

        var url = config.domain+'/reset-password?access_token=' + info.accessToken.id;

         logger.log('info',' password reset url %s', url);

        var html = '<body style=\'padding: 0; margin: 0;\'>' +
            '<div align=\'center\'>' +
            '<table width=\'100%\' border=\'0\' cellspacing=\'0\' cellpadding=\'0\' bgcolor=\'#eff3f8\'><tr><td>&nbsp;' +
            '</td></tr><tr><td align=\'center\'>' +
            '<span style=\'font-family: Arial, Helvetica, sans-serif; color:#4db3a4;font-size:26px;\'>ZehnCA</span></td>' +
            '</tr><tr><td>&nbsp;</td></tr>' +
            '<tr><td><table align=\'center\' width=\'700\' border=\'0\' bgcolor=\'#ffffff\'><tr><td><div style=\'color:#646464;font-size:13px;margin:20px;\'>' +
            '<div style=\'color:#646464;font-size:13px;margin:20px;\'>' +
            '<div><div style=\'float:left;width:auto;display:inline-block;\'></div>' +
            '<div>Hi, <br><br>We have received a request to reset the password for your account.</div></div>' +
            '<br></b>If you made this request, please click on the link below or paste this into your browser to complete the process: <br><br>' +
            '<div style=\'margin-top:20px;\'><a style=\'text-decoration: none;background-color:#4db3a4;color:#fff;display:inline-block;padding: 6px;\' ' +
            'href="' + url + '">' + 'Click to reset your password</a>' + '</div>' +
            '<br><hr><span style=\'float: left;\'>Powered by ZehnCA</span>' +
            '<a style=\'color:#57697e;float:right;text-decoration: none;\' ' +
            'target="_blank" href="http://www.zehntech.com">Zehntech Technologies<a></div>' +
            '<br></div></tr></table><br><span style=\'color:#999999;font-size:12px;margin-left:40%;\'>' +
            '2015 &copy; Zehntech Technologies. ALL Rights Reserved.</span></td></tr><tr><td>&nbsp;</td></tr>' +
            '</table></div></body>';

        user.app.models.Email.send({
            to: info.email,
            from: config.from,
            subject: 'Resetting the password',
            html: html
        }, function (err) {
            if (err) {
                logger.log('error', 'error sending password reset email ', err );
                return ;
            }
           logger.log('info',' sending password reset email to:', info.email);
        });
    });





    /**
     * Function to sync AWS data in local storage
     * @param id
     * @param cb
     */
    user.sync = function (id,  cb) {

         var Instance = user.app.models.Instance;
         var Snapshot = user.app.models.Snapshot;
         var Volume = user.app.models.Volume;
         Instance.getInstances(id);
         Snapshot.getSnapshots(id);
         Volume.getVolumes(id);
        return cb(null, 'done');

    };
    user.remoteMethod('sync', {
        description: 'Sync AWS data in local storage.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'get', path: '/sync'}
    });
};
