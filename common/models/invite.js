var config = require('../../server/config.json');
var crypto = require('crypto');
var path = require('path');
var winston = require('winston');

var transports  = [];

transports.push(new winston.transports.DailyRotateFile({
  name: 'file',
  datePattern: '.yyyy-MM-dd',
  filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});

module.exports = function (Invite) {


    Invite.observe('before save', function (ctx, next) {

        if (ctx.instance) {
            ctx.instance.createdDate = Date.now();
             logger.log('info', 'invite new  user '+ ctx.instance.email,  ctx.instance.companyId);
        } else if (ctx.currentInstance) {
            ctx.currentInstance.updatedDate = Date.now();
             logger.log('info', 'update invite user '+ ctx.currentInstance.email, ctx.currentInstance);
        } else {
            next();
        }
        next();

    });

    //send verification email after registration
    Invite.afterRemote('create', function (ctx, user, next) {
          logger.log('info', 'invitation completed, sending email %s', user.email );
        var token;
        crypto.randomBytes(20, function (err, buf) {
            if (err) {
                console.log(err);
                next(err);
            }

            token = buf.toString('hex');
            console.log('token' + token);

            user.token = token;
            //noinspection UnterminatedStatementJS
            user.save(function (err) {
                if (err) {
                    console.log(err);
                    next(err);
                }
            });
            if (user.message === undefined || user.message === 'undefined') {
                user.message = 'Please accept the invitation';
            }
            if (user.name === undefined || user.name === 'undefined') {
                user.name = '';
            }


            var url = config.domain+'/invite?token=' + token;
            var html = '<body style="padding: 0; margin: 0;">' +
                '<div align="center">' +
                ' <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#eff3f8"> ' +
                '<tr><td>&nbsp;</td></tr> ' +
                '<tr><td> ' +
                '<table align="center" width="700;" border="0" bgcolor="#ffffff">' +
                '<tr>' +
                '<td> <div style="color:#646464;font-size:13px;margin:20px;">' +
                ' <div style="color:#646464;font-size:13px;margin:20px;"> ' +
                '<div> ' +
                '<div style="float:left;width:auto;display:inline-block;"> ' +
                '</div>' +
                '<div>Hi <b>' + user.name + '</b>,<br>' +
                '<br> <b>' + user.createdBy +
                '</b> invited you to join ZehnCA</div> ' +
                '</div> <br>' + user.message + ' <br><br> ' +
                '<div  style="margin-top:20px;">' +
                '<a style="text-decoration: none;background-color:#4db3a4; color:#fff;display:inline-block;padding: 6px;" ' +
                'href="' + url + '">ACCEPT INVITATION</a> ' +
                '</div> </div> </div> ' +
                '</tr> ' +
                '</table><br>' +
                '<span style=\'color:#999999;font-size:12px;margin-left:35%;\'>2015 &copy; Zehntech Technologies. ALL Rights Reserved.</span> ' +
                '</td>' +
                '</tr>' +
                '<tr><td>&nbsp;</td> ' +
                '</tr> ' +
                '</table> ' +
                '</div> ' +
                '</body>';

            Invite.app.models.Email.send({
                to: user.email,
                from: user.createdBy + ' via ' + config.from,
                subject: 'You\'ve been invited to join the ZehnCA',
                html: html
            }, function (err) {
                if (err) {
                     logger.log('error', 'error in sending email to '+user.email, err );
                    next(err);
                    return;
                }
                logger.log('info','sending invitation email ', user);
                ctx.res.send('success');
            });
        });

    });


};

