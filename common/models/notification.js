var later = require('later');

var config = require('../../server/config.json');

var path = require('path');

var winston = require('winston');

var transports = [];

transports.push(new winston.transports.DailyRotateFile({
    name: 'file',
    datePattern: '.yyyy-MM-dd',
    filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});

var HashMap = require('hashmap');
var async = require('async');

module.exports = function (Notification) {

    Notification.map = new HashMap();

        Notification.observe('after delete', function (ctx, next) {

        if (Notification.map.get('startNotify'+ ctx.where.id)) {
            Notification.map.get('startNotify' + ctx.where.id).clear();
            Notification.map.remove('startNotify' + ctx.where.id);
        }
        if (Notification.map.get('stopNotify' + ctx.where.id)) {
            Notification.map.get('stopNotify' + ctx.where.id).clear();
            Notification.map.remove('stopNotify' + ctx.where.id);
        }

        next();
    });

    function startNotifySchedule(notifyObj) {
        var instance;
        if (notifyObj.name) {
            instance = notifyObj.name;
        } else {
            instance = notifyObj.instanceId;
        }


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
            '<div>Dear <b>' + notifyObj.notifyName + '</b>,<br>' +
            '</div> ' +
            '</div> <br> Following <b>' + instance + '</b> instance in ' + notifyObj.region + ' region is soon to start after ' +
            notifyObj.startNotifyTime + ' minutes. <br><br> Regards from ZehnCA team ' +
            '</div> </div> ' +
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

        Notification.app.models.Email.send({
            to: notifyObj.notifyEmailID,
            from: config.from,
            subject: 'Your Instance is about to start',
            html: html
        }, function (err) {
            if (err) {
                logger.log('error', 'Err in sending notification mail', err);
            }
            logger.log('info', 'sending status email to:', notifyObj.notifyEmailID);

        });

    }


    function stopNotifySchedule(notifyObj) {
        var instance;
        if (notifyObj.name) {
            instance = notifyObj.name;
        } else {
            instance = notifyObj.instanceId;
        }

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
            '<div>Dear <b>' + notifyObj.notifyName + '</b>,' +
            '</div> ' +
            '</div> <br> Following <b>' + instance + '</b> instance in ' + notifyObj.region + ' region is soon to shutdown after ' +
            notifyObj.startNotifyTime + ' minutes. <br><br> Regards from ZehnCA team ' +
            '</div> </div> ' +
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

        Notification.app.models.Email.send({
            to: notifyObj.notifyEmailID,
            from: config.from,
            subject: 'Your Instance is about to shotdown',
            html: html
        }, function (err) {
            if (err) {
                logger.log('error', 'Err in sending notification mail', err);
            }
            logger.log('info', 'sending status email to:', notifyObj.notifyEmailID);

        });

    }

    function parseDate(exp, timeToReduce) {

        var time = exp.substring(3, exp.indexOf('m') + 1);
        var hour = parseInt((time.substring(0, time.indexOf(':'))).trim());
        var minute = parseInt((time.substring(time.indexOf(':') + 1, time.indexOf(':') + 3)).trim());
        var period = (time.substring(time.indexOf(':') + 3)).trim();

        var givenTime = parseInt(timeToReduce);

        if (minute >= givenTime) {
            minute = minute - givenTime;
        } else {
            minute = 60 - givenTime;
            hour = hour - 1;
        }

        time = hour + ':' + minute + ' ' + period;

        var newExp = 'at ' + time + exp.substring(exp.indexOf('m') + 1);
        return newExp;
    }

    Notification.observe('before save', function (ctx, next) {

        var notify;

        if (ctx.instance) {
            notify = ctx.instance;

        } else if (ctx.data) {
            notify = ctx.data;
            if (Notification.map.get('startNotify' + notify.id)) {
                Notification.map.get('startNotify' + notify.id).clear();
                Notification.map.remove('startNotify' + notify.id);
            }
            if (Notification.map.get('stopNotify' + notify.id)) {
                Notification.map.get('stopNotify' + notify.id).clear();
                Notification.map.remove('stopNotify' + notify.id);
            }
        } else {
            next();
        }

        var InstanceScheduler = Notification.app.models.InstanceSchedule;
        var Scheduler = Notification.app.models.Scheduler;

        InstanceScheduler.find({where: {instanceId: notify.instanceId}}, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving schedule instance from database by id ' + notify.instanceId, err);
                console.log(err);
                next();
            }
            if (data && data.length > 0) {
                async.each(data, function (result) {

                    Scheduler.findOne({
                        where: {
                            schedulerName: result.schedulerName, companyId: notify.companyId, schedulerType: 'instance'
                        }
                    }, function (err, scheduler) {
                        if (err) {
                            logger.log('error', 'There was an error retrieving schedule instance from database by id ' + notify.instanceId, err);
                            console.log(err);
                            next();
                        }
                        if (data) {

                            if (notify.startNotifyTime && scheduler.startScheduleExp) {
                                logger.log('info', 'Create notify scheduler instance' + notify.instanceId);

                                var newExp = parseDate(scheduler.startScheduleExp, notify.startNotifyTime);
                                logger.log('info', 'new exp ' + newExp);

                                var notifySchedule = later.parse.text(newExp);
                                notify.startExp = newExp;
                            }
                            if (notify.stopNotifyTime && scheduler.stopScheduleExp) {
                                logger.log('info', 'Create notify scheduler instance' + notify.instanceId);

                                var newExp1 = parseDate(scheduler.stopScheduleExp, notify.stopNotifyTime);
                                logger.log('info', 'new exp ' + newExp1);
                                notify.stopExp = newExp1;
                            }

                            next();
                        }
                    });
                });
            }
        });

    });

   Notification.observe('after save', function (ctx, next) {
         var notify;
         if (ctx.instance) {
            notify = ctx.instance;

        } else if (ctx.data) {
            notify = ctx.data;

        } else {
            next();
        }

       if (notify.startExp) {
           var notifySchedule = later.parse.text(notify.startExp);
           var t1 = later.setInterval(function () {
               startNotifySchedule(notify);
           }, notifySchedule);

            Notification.map.set('startNotify' + notify.id, t1);
       }
       if (notify.stopExp) {

           var notifySchedule1 = later.parse.text(notify.stopExp);
           var t2 = later.setInterval(function () {
               stopNotifySchedule(notify);
           }, notifySchedule1);

           Notification.map.set('stopNotify' + notify.id, t2);

       }
         next();
     });
};
