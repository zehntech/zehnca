var AWS = require('aws-sdk');
var later = require('later');

var config = require('../../server/config.json');
var crypto = require('crypto');
var path = require('path');
var uuid = require('uuid');
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


module.exports = function (Scheduler) {

    Scheduler.map = new HashMap();

    Scheduler.observe('after delete', function (ctx, next) {
        if (Scheduler.map.get('start' + ctx.where.id)) {
            Scheduler.map.get('start' + ctx.where.id).clear();
            Scheduler.map.remove('start' + ctx.where.id);
        }
        if (Scheduler.map.get('stop' + ctx.where.id)) {
            Scheduler.map.get('stop' + ctx.where.id).clear();
            Scheduler.map.remove('stop' + ctx.where.id);
        }

        next();
    });


    //send email after scheduler success or fail
    Scheduler.sendMail = function (companyId, type, startstop) {

        var User = Scheduler.app.models.user;
        User.find({
            where: {
                companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving users from database', err);
            }
            if (data.length > 0) {
                var msg;
                if (type === 'error' && startstop === 'start') {
                    msg = 'Your schedule for start instances is failure';
                } else if (type === 'error' && startstop === 'stop') {
                    msg = 'Your schedule for stop instances is failure';
                } else if (type === 'success' && startstop === 'start') {
                    msg = 'Your schedule instance get started successfully';
                } else {
                    msg = 'Your schedule instance get stopped successfully';
                }

                async.each(data, function (result) {
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
                        '<div>Hi <b>' + result.name + '</b>,<br>' +
                        '<br></div> ' +
                        '</div> <br>' + msg + ' <br><br> ' +
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

                    Scheduler.app.models.Email.send({
                        to: result.email,
                        from: config.from,
                        subject: 'Scheduler of status',
                        html: html
                    }, function (err) {
                        if (err) {
                            logger.log('error', 'Err in sending mail', err);
                        }
                        logger.log('info', 'sending status email to:', result.email);

                    });

                }, function () {
                    console.log('Send email Callback');

                });


            }
        });
    };

    Scheduler.scheduleStartInstance = function (schedulerName, companyId) {
        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(schedulerName + ' start trigger called', {companyId: companyId});

        var InstanceSchedule = Scheduler.app.models.InstanceSchedule;
        var KeyManagement = Scheduler.app.models.KeyManagement;
        var Logger = Scheduler.app.models.Logger;

        logger.log('info', schedulerName + ' trigger to start schedule instance, company %s', companyId);
        InstanceSchedule.find({
            where: {
                startSchedulerName: schedulerName, companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving instance from database %j', err);
            }
            if (data.length > 0) {
                logger.log('info', data.length + ' instances found for start under trigger ' + schedulerName);


                KeyManagement.findOne({
                    where: {
                        companyId: companyId
                    }
                }, function (err, key) {
                    if (err) {
                        logger.log('error', 'There was an error retrieving key from database %j', err);
                    }
                    if (key) {
                        var decipher = crypto.createDecipher(config.algorithm, config.password);
                        var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                        var dec1 = decipher.update(key.accessKey, 'hex', 'utf8');
                        dec1 += decipher.final('utf8');

                        var dec2 = decipher1.update(key.secretKey, 'hex', 'utf8');
                        dec2 += decipher1.final('utf8');
                        logger.log('debug', ' Decrypting AWS keys ');
                        var count = 0;
                        async.each(data, function (result) {
                            var params = {
                                InstanceIds: [result.instanceId]
                            };

                            new AWS.EC2({
                                accessKeyId: dec1,
                                secretAccessKey: dec2,
                                region: result.instanceRegion
                            }).startInstances(params, function (error, data1) {
                                    var logObj = {
                                        instanceId: result.instanceId,
                                        region: result.instanceRegion,
                                        createdAt: new Date(),
                                        companyId: companyId,
                                        schedulerName: schedulerName,
                                        event: 'start',
                                        file: uid + '_file.log',
                                        logType: 'instance'
                                    };


                                    if (error) {
                                        //  Scheduler.sendMail(companyId, 'error', 'start');

                                        logger.log('error', 'There was an error start instance', error);
                                        logObj.result = 'failure';

                                    } else {
                                        //  Scheduler.sendMail(companyId, 'success', 'start');

                                        logger.log('info', 'Instance start successfully', data1);
                                        logObj.result = 'success';

                                    }
                                    var log = new Logger(logObj);
                                    log.save();
                                    count++;

                                    if (data.length === count) {
                                        logger.remove(uid);
                                    }
                                });

                        }, function (err) {
                            console.log('Callback '+err);

                        });
                    }
                });


            } else {
                logger.log('info', 'No instances found under scheduler ' + schedulerName);
            }
        });

    };

    Scheduler.scheduleStopInstance = function (schedulerName, companyId) {

        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(schedulerName + ' stop trigger called', {companyId: companyId});


        var InstanceSchedule = Scheduler.app.models.InstanceSchedule;
        var KeyManagement = Scheduler.app.models.KeyManagement;
        var Logger = Scheduler.app.models.Logger;

        logger.log('info', schedulerName + ' trigger to stop schedule instance, company %s', companyId);
        InstanceSchedule.find({
            where: {
                stopSchedulerName: schedulerName, companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving instance from database', err);
            }
            if (data.length > 0) {
                logger.log('info', data.length + ' instances found for stop under scheduler ' + schedulerName);

                KeyManagement.findOne({
                    where: {
                        companyId: companyId
                    }
                }, function (err, key) {
                    if (err) {
                        logger.log('error', 'There was an error retrieving key from database', err);
                    }
                    if (key) {
                        var decipher = crypto.createDecipher(config.algorithm, config.password);
                        var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                        var dec1 = decipher.update(key.accessKey, 'hex', 'utf8');
                        dec1 += decipher.final('utf8');

                        var dec2 = decipher1.update(key.secretKey, 'hex', 'utf8');
                        dec2 += decipher1.final('utf8');
                        var count = 0;
                        async.each(data, function (result) {
                            var params = {
                                InstanceIds: [result.instanceId]
                            };

                            new AWS.EC2({
                                accessKeyId: dec1,
                                secretAccessKey: dec2,
                                region: result.instanceRegion
                            }).stopInstances(params, function (error, data1) {
                                    var logObj = {
                                        instanceId: result.instanceId,
                                        region: result.instanceRegion,
                                        createdAt: new Date(),
                                        companyId: companyId,
                                        schedulerName: schedulerName,
                                        event: 'stop',
                                        file: uid + '_file.log',
                                        logType: 'instance'
                                    };

                                    if (error) {
                                        //   Scheduler.sendMail(companyId, 'error', 'stop');
                                        logger.log('error', 'There was an error stop instance', error);

                                        logObj.result = 'failure';


                                    } else {
                                        //    Scheduler.sendMail(companyId, 'success', 'stop');
                                        logger.log('info', 'Instance stop successfully', data1);
                                        logObj.result = 'success';


                                    }
                                    var log = new Logger(logObj);
                                    log.save();
                                    count++;

                                    if (data.length === count) {
                                        logger.remove(uid);
                                    }
                                });

                        }, function (err) {
                            console.log('Callback '+err);

                        });
                    }
                });


            } else {
                logger.log('info', 'No instances found under scheduler ' + schedulerName);
            }
        });

    };


    function instanceScheduler(schedulerName, companyId, startText, stopText) {
        if (startText) {
            logger.log('info', 'Create start ' + schedulerName + ' instance, schedule at ' + startText);
            var startInstanceSchedule = later.parse.text(startText);
            var t1 = later.setInterval(function () {
                Scheduler.scheduleStartInstance(schedulerName, companyId);
            }, startInstanceSchedule);
        }

        if (stopText) {
            logger.log('info', 'Create stop ' + schedulerName + ' instance, schedule at ' + stopText);
            var stopInstanceSchedule = later.parse.text(stopText);
            var t2 = later.setInterval(function () {
                Scheduler.scheduleStopInstance(schedulerName, companyId);
            }, stopInstanceSchedule);
        }

        Scheduler.findOne({
            where: {
                schedulerName: schedulerName, companyId: companyId, schedulerType: 'instance'
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving trigger from database', err);
            }
            if (data) {
                logger.log('info', 'load data for ' + schedulerName);
                if (startInstanceSchedule) {
                    data.start = true;
                    data.startSchedulerInstance = startInstanceSchedule;
                    Scheduler.map.set('start' + data.id, t1);
                }

                if (stopInstanceSchedule) {
                    data.stop = true;
                    data.stopSchedulerInstance = stopInstanceSchedule;
                    Scheduler.map.set('stop' + data.id, t2);
                }

                data.save(function (err) {
                    if (err) {
                        logger.log('error', 'Error in updating schedule instance data for ' + schedulerName, err);

                    } else {
                        logger.log('info', 'Save scheduler object into database for :' + schedulerName);
                    }
                });
            } else {
                logger.log('info', 'No data found for scheduler ' + schedulerName);

            }
        });
    }


    /**
     * Function to schedule create snapshot
     * @param schedulerName
     * @param companyId
     */
    Scheduler.scheduleCreateSnapshot = function (schedulerName, companyId) {

        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(schedulerName + ' create trigger called', {companyId: companyId});


        var SnapshotSchedule = Scheduler.app.models.SnapshotSchedule;
        var KeyManagement = Scheduler.app.models.KeyManagement;
        var Logger = Scheduler.app.models.Logger;

        SnapshotSchedule.find({
            where: {
                startSchedulerName: schedulerName, companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving schedule snapshots from database', err);
            }
            if (data.length > 0) {
                logger.log('info', data.length + ' snapshot found for create under scheduler ' + schedulerName);

                KeyManagement.findOne({
                    where: {
                        companyId: companyId
                    }
                }, function (err, key) {
                    if (err) {
                        logger.log('error', 'Err in getting key from database for company ' + companyId, err);
                    }
                    if (key) {
                        var decipher = crypto.createDecipher(config.algorithm, config.password);
                        var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                        var dec1 = decipher.update(key.accessKey, 'hex', 'utf8');
                        dec1 += decipher.final('utf8');

                        var dec2 = decipher1.update(key.secretKey, 'hex', 'utf8');
                        dec2 += decipher1.final('utf8');
                        var count = 0;
                        async.each(data, function (result) {


                            var params = {
                                VolumeId: result.volume,
                                Description: result.description
                            };

                            new AWS.EC2({
                                accessKeyId: dec1,
                                secretAccessKey: dec2,
                                region: result.region
                            }).createSnapshot(params, function (error, data1) {
                                    var logObj = {
                                        volumeId: result.volume,
                                        region: result.region,
                                        createdAt: new Date(),
                                        companyId: companyId,
                                        schedulerName: schedulerName,
                                        event: 'create',
                                        file: uid + '_file.log',
                                        logType: 'snapshot'
                                    };


                                    if (error) {
                                        logger.log('error', 'Err in create snapshot from volume ' + result.volume, error);
                                        logObj.result = 'failure';
                                    } else {
                                        logger.log('info', 'Snapshot create successfully', data1);
                                        logObj.result = 'success';
                                    }
                                    var log = new Logger(logObj);
                                    log.save();
                                    count++;
                                    if (data.length === count) {
                                        logger.remove(uid);
                                    }
                                });

                        }, function (err) {
                            console.log('Callback ' +err);

                        });
                    }
                });


            } else {
                logger.log('info', 'No snapshot found under scheduler ' + schedulerName);
            }
        });

    };

    /**
     * Function to schedule delete snapshot
     * @param schedulerName
     * @param companyId
     */
    Scheduler.scheduleDeleteSnapshot = function (schedulerName, companyId) {
        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(schedulerName + ' delete trigger called', {companyId: companyId});


        var KeyManagement = Scheduler.app.models.KeyManagement;
        var Logger = Scheduler.app.models.Logger;

        Scheduler.findOne({
            where: {
                schedulerName: schedulerName, companyId: companyId, schedulerType: 'snapshot', stop: true
            }
        }, function (err, schedulerData) {
            if (err) {
                logger.log('error', 'There was an error retrieving schedule snapshot from database', err);
            }
            if (schedulerData) {

                KeyManagement.findOne({
                    where: {
                        companyId: companyId
                    }
                }, function (err, key) {
                    if (err) {
                        logger.log('error', 'There was an error retrieving key from database', err);
                    }
                    if (key) {
                        var decipher = crypto.createDecipher(config.algorithm, config.password);
                        var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                        var dec1 = decipher.update(key.accessKey, 'hex', 'utf8');
                        dec1 += decipher.final('utf8');

                        var dec2 = decipher1.update(key.secretKey, 'hex', 'utf8');
                        dec2 += decipher1.final('utf8');

                        var count = 0;
                        var snapshots = [];
                        async.each(config.regions, function (result) {

                            var params = {
                                OwnerIds: ['self']
                            };

                            new AWS.EC2({
                                accessKeyId: dec1,
                                secretAccessKey: dec2,
                                region: result
                            }).describeSnapshots(params, function (error, data1) {

                                    if (error) {
                                        logger.log('error', 'Error in retrieving all snapshots for ' + result, {company: companyId}, error);

                                    } else {
                                        if (data1.Snapshots.length > 0) {
                                            for (var i = 0; i < data1.Snapshots.length; i++) {
                                                snapshots.push(data1.Snapshots[i]);
                                            }
                                            logger.log('info', 'Retrieving all snapshots for ' + result + ' region', {company: companyId});
                                        }
                                    }
                                    count++;

                                    if (count === 8 && snapshots.length > 0) {
                                        var d = new Date();
                                        var count1 = 0;
                                        async.each(snapshots, function (result1) {
                                            if ((d.setDate(d.getDate() - schedulerData.deleteOtherThan)) > result1.StartTime) {
                                                logger.log('info', result1.SnapshotId + ' snapshot found for delete', result1);
                                                logger.log('info', result1.SnapshotId + ' snapshot created older ' + schedulerData.deleteOtherThan + ' days');
                                                var params = {
                                                    SnapshotId: result1.SnapshotId
                                                };
                                                new AWS.EC2({
                                                    accessKeyId: dec1,
                                                    secretAccessKey: dec2,
                                                    region: result
                                                }).deleteSnapshot(params, function (error) {
                                                        var logObj = {
                                                            snapshotId: result1.SnapshotId,
                                                            region: result,
                                                            createdAt: new Date(),
                                                            companyId: companyId,
                                                            schedulerName: schedulerName,
                                                            event: 'delete',
                                                            file: uid + '_file.log',
                                                            logType: 'snapshot'
                                                        };
                                                        if (error) {
                                                            logger.log('error', 'Err in deleting snapshot by ' + result1.SnapshotId, error);
                                                            logObj.result = 'failure';
                                                        } else {
                                                            logger.log('info', 'Snapshot delete successfully' + result1.SnapshotId);
                                                            logObj.result = 'success';

                                                        }

                                                        var log = new Logger(logObj);
                                                        log.save();
                                                        count1++;
                                                        if (snapshots.length === count1) {
                                                            logger.remove(uid);
                                                        }
                                                    });
                                            } else {
                                                logger('info', 'No snapshot found created before given date', {company: companyId});
                                            }


                                        }, function (err) {
                                            console.log('Callback '+err);
                                        });
                                    }

                                });



                        }, function (err) {
                            console.log('Callback '+err);


                        });
                    } else {
                        logger.log('info', 'Key does not exist for company  : ' + companyId);
                    }

                });
            }
        });

    };

    function snapshotScheduler(schedulerName, companyId, startText, deleteText) {
        if (startText) {
            logger.log('info', 'Add create  ' + schedulerName + ' snapshot, schedule at ' + startText);
            var startInstanceSchedule = later.parse.text(startText);
            var t1 = later.setInterval(function () {
                Scheduler.scheduleCreateSnapshot(schedulerName, companyId);
            }, startInstanceSchedule);
        }

        if (deleteText) {
            logger.log('info', 'Create delete  ' + schedulerName + ' snapshot, schedule at ' + deleteText);
            var deleteInstanceSchedule = later.parse.text(deleteText);
            var t2 = later.setInterval(function () {
                Scheduler.scheduleDeleteSnapshot(schedulerName, companyId);
            }, deleteInstanceSchedule);
        }

        Scheduler.findOne({
            where: {
                schedulerName: schedulerName, companyId: companyId, schedulerType: 'snapshot'
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving trigger from database', err);
            }
            if (data) {
                logger.log('info', 'load data for ' + schedulerName);
                if (startInstanceSchedule) {
                    data.start = true;
                    data.startSchedulerInstance = startInstanceSchedule;
                    Scheduler.map.set('start' + data.id, t1);
                }

                if (deleteInstanceSchedule) {
                    data.stop = true;
                    data.stopSchedulerInstance = deleteInstanceSchedule;
                    Scheduler.map.set('stop' + data.id, t2);
                }

                data.save(function (err) {
                    if (err) {
                        logger.log('error', 'Error in updating schedule snapshot data for ' + schedulerName, err);

                    } else {
                        logger.log('info', 'Save scheduler object into database for :' + schedulerName);
                    }
                });
            } else {
                logger.log('info', 'No data found for scheduler ' + schedulerName);

            }
        });
    }


    /**
     * API for save scheduler for instance
     * @param obj
     * @param cb
     */
    Scheduler.saveScheduler = function (obj, cb) {

        Scheduler.findOne({
            where: {
                schedulerName: obj.schedulerName, companyId: obj.companyId, schedulerType: 'instance'
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving trigger from database', err);
            }


            if (!data) {

                obj.createdDate = new Date();
                obj.updatedDate = new Date();
                obj.schedulerType = 'instance';

                var schedule = new Scheduler(obj);
                schedule.save(function (err, scheduleObj) {
                    if (err) {
                        logger.log('error', 'Error in saving scheduler detail for company id ' + obj.companyId, err);
                        return cb(err);
                    }
                    if (obj.startScheduleExp && obj.stopScheduleExp) {

                        instanceScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, obj.stopScheduleExp);
                    } else if (obj.startScheduleExp) {
                        instanceScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, undefined);
                    } else {
                        instanceScheduler(obj.schedulerName, obj.companyId, undefined, obj.stopScheduleExp);
                    }

                    logger.log('info', ' scheduler saved.. ');
                    return cb(null, scheduleObj);

                });
            } else {
                logger.log('info', 'Instance scheduler already exist.');
                data.updatedDate = new Date();
                if ((data.startScheduleExp !== obj.startScheduleExp) && (data.stopScheduleExp !== obj.stopScheduleExp)) {
                    logger.log('info', 'Both instance scheduler time is changed.. ');

                    data.startScheduleExp = obj.startScheduleExp;
                    data.stopScheduleExp = obj.stopScheduleExp;

                    if (Scheduler.map.get('start' + data.id)) {
                        Scheduler.map.get('start' + data.id).clear();
                        Scheduler.map.remove('start' + data.id);
                    }


                    if (Scheduler.map.get('stop' + data.id)) {
                        Scheduler.map.get('stop' + data.id).clear();
                        Scheduler.map.remove('stop' + data.id);
                    }

                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating scheduler detail for company id ' + obj.companyId +
                                ' err: ' + err);
                            return cb(err);
                        }
                        logger.log('info', 'Instance scheduler is updated.. ');
                        instanceScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, obj.stopScheduleExp);
                        return cb(null, scheduleObj);
                    });


                } else if (data.startScheduleExp !== obj.startScheduleExp) {
                    logger.log('info', 'Start scheduler time is changed.. ');
                    data.startScheduleExp = obj.startScheduleExp;

                    if (Scheduler.map.get('start' + data.id)) {
                        Scheduler.map.get('start' + data.id).clear();
                        Scheduler.map.remove('start' + data.id);
                    }
                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating scheduler detail for company id ' + obj.companyId, err);
                            return cb(err);
                        }
                        logger.log('info', 'Instance scheduler is updated.. ');
                        instanceScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, undefined);
                        return cb(null, scheduleObj);
                    });

                }
                else if (data.stopScheduleExp !== obj.stopScheduleExp) {
                    logger.log('info', 'Stop scheduler time is changed.. ');
                    data.stopScheduleExp = obj.stopScheduleExp;

                    if (Scheduler.map.get('stop' + data.id)) {
                        Scheduler.map.get('stop' + data.id).clear();
                        Scheduler.map.remove('stop' + data.id);
                    }
                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating scheduler detail for company id ' + obj.companyId, err);
                            return cb(err);
                        }
                        logger.log('info', 'Instance scheduler is updated.. ');
                        instanceScheduler(obj.schedulerName, obj.companyId, undefined, obj.stopScheduleExp);
                        return cb(null, scheduleObj);
                    });

                }


            }
        });
    };

    Scheduler.remoteMethod('saveScheduler', {
        description: 'Save or update scheduler detail for instance',
        accepts: [
            {arg: 'obj', type: 'object', required: true, description: ['Object of schedule model']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'post', path: '/saveScheduler'}
    });


    Scheduler.startStartScheduler = function (_id, cb) {
        Scheduler.findById(
            _id, function (err, data) {
                if (err) {
                    logger.log('error', 'There was an error retrieving trigger from database', err);
                    return cb(err);
                }
                if (data) {
                    data.start = true;
                    data.updatedDate = new Date();

                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating start scheduler detail for id ' + _id, err);
                            return cb(err);
                        }
                        Scheduler.map.remove('start' + _id);
                        instanceScheduler(data.schedulerName, data.companyId, data.startScheduleExp, undefined);
                        logger.log('info', 'Start scheduler successfully started..');
                        return cb(null, scheduleObj);
                    });


                } else {
                    logger.log('info', 'No data found for scheduler by id ' + _id);
                    return cb(null, new Error('Schedule does not exist'));
                }


            });
    };
    Scheduler.remoteMethod('startStartScheduler', {
        description: 'Start instance start scheduler.',
        accepts: [
            {arg: '_id', type: 'string', required: true, description: ['ID of schedule model']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'post', path: '/startStartScheduler'}
    });


    Scheduler.stopStartScheduler = function (_id, cb) {
        Scheduler.findById(
            _id, function (err, data) {
                if (err) {
                    logger.log('error', 'Error in stop, start-scheduler id :' + _id, err);
                    return cb(err);
                }

                if (data) {
                    data.start = false;
                    data.updatedDate = new Date();

                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating start scheduler detail for id ' + _id, err);
                            return cb(err);
                        }
                        Scheduler.map.get('start' + _id).clear();
                        logger.log('info', 'Start scheduler successfully stopped..');
                        return cb(null, scheduleObj);
                    });


                } else {
                    logger.log('info', 'No data found for scheduler by id ' + _id);
                    return cb(null, new Error('Schedule does not exist'));
                }
            });
    };
    Scheduler.remoteMethod('stopStartScheduler', {
        description: 'Stop instance start scheduler.',
        accepts: [
            {arg: '_id', type: 'string', required: true, description: ['ID of schedule model']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'post', path: '/stopStartScheduler'}
    });


    Scheduler.startStopScheduler = function (_id, cb) {
        Scheduler.findById(
            _id, function (err, data) {
                if (err) {
                    logger.log('error', 'Error in start, stop-scheduler id :' + _id, err);
                    return cb(err);
                }
                if (data) {
                    data.stop = true;
                    data.updatedDate = new Date();

                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating stop scheduler detail for id ' + _id, err);
                            return cb(err);
                        }
                        Scheduler.map.remove('stop' + _id);
                        instanceScheduler(data.schedulerName, data.companyId, undefined, data.stopScheduleExp);
                        logger.log('info', 'Stop scheduler successfully started..');
                        return cb(null, scheduleObj);
                    });


                } else {
                    logger.log('info', 'No data found for scheduler by id ' + _id);
                    return cb(null, new Error('Schedule does not exist'));
                }
            });
    };
    Scheduler.remoteMethod('startStopScheduler', {
        description: 'Start instance stop scheduler.',
        accepts: [
            {arg: '_id', type: 'string', required: true, description: ['ID of schedule model']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'post', path: '/startStopScheduler'}
    });


    Scheduler.stopStopScheduler = function (_id, cb) {
        Scheduler.findById(
            _id, function (err, data) {
                if (err) {
                    logger.log('error', 'Error in stop, stop-scheduler id :' + _id, err);
                    return cb(err);
                }

                if (data) {
                    data.stop = false;
                    data.updatedDate = new Date();

                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating stop scheduler detail for id ' + _id, err);
                            return cb(err);
                        }
                        Scheduler.map.get('stop' + _id).clear();
                        logger.log('info', 'Stop scheduler successfully stopped..');
                        return cb(null, scheduleObj);
                    });


                } else {
                    logger.log('info', 'No data found for scheduler by id ' + _id);
                    return cb(null, new Error('Schedule does not exist'));
                }
            });
    };
    Scheduler.remoteMethod('stopStopScheduler', {
        description: 'Stop instance stop scheduler.',
        accepts: [
            {arg: '_id', type: 'string', required: true, description: ['ID of schedule model']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'post', path: '/stopStopScheduler'}
    });


    /**
     * Function to save scheduler detail for snapshot
     * @param obj
     * @param cb
     */
    Scheduler.saveSnapshotScheduler = function (obj, cb) {

        Scheduler.findOne({
            where: {
                schedulerName: obj.schedulerName, companyId: obj.companyId, schedulerType: 'snapshot'
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'Err in getting snapshot scheduler info from database for ' + obj.schedulerName, err);
            }
            if (!data) {

                obj.createdDate = new Date();
                obj.updatedDate = new Date();
                obj.schedulerType = 'snapshot';

                var schedule = new Scheduler(obj);
                schedule.save(function (err, scheduleObj) {
                    if (err) {
                        logger.log('error', 'Error in saving snapshot Scheduler detail for company id ' + obj.companyId, err);
                        return cb(err);
                    }
                    if (obj.startScheduleExp && obj.stopScheduleExp) {

                        snapshotScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, obj.stopScheduleExp);
                    } else if (obj.startScheduleExp) {
                        snapshotScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, undefined);
                    } else {
                        snapshotScheduler(obj.schedulerName, obj.companyId, undefined, obj.stopScheduleExp);
                    }

                    logger.log('info', ' scheduler saved.. ');
                    return cb(null, scheduleObj);

                });
            } else {
                logger.log('info', 'Snapshot Scheduler already exist.');
                data.updatedDate = new Date();
                if (obj.deleteOtherThan)
                    data.deleteOtherThan = obj.deleteOtherThan;
                if ((data.startScheduleExp !== obj.startScheduleExp) && (data.stopScheduleExp !== obj.stopScheduleExp)) {
                    logger.log('info', 'Both snapshot scheduler time is changed.. ');

                    data.startScheduleExp = obj.startScheduleExp;
                    data.stopScheduleExp = obj.stopScheduleExp;

                    if (Scheduler.map.get('start' + data.id)) {
                        Scheduler.map.get('start' + data.id).clear();
                        Scheduler.map.remove('start' + data.id);
                    }

                    if (Scheduler.map.get('stop' + data.id)) {
                        Scheduler.map.get('stop' + data.id).clear();
                        Scheduler.map.remove('stop' + data.id);
                    }
                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating scheduler detail for company id ' + obj.companyId, err);
                            return cb(err);
                        }
                        logger.log('info', ' scheduler updated.. ');
                        snapshotScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, obj.stopScheduleExp);
                        return cb(null, scheduleObj);
                    });


                } else if (data.startScheduleExp !== obj.startScheduleExp) {
                    logger.log('info', 'Create snapshot scheduler time is changed.. ');
                    data.startScheduleExp = obj.startScheduleExp;

                    if (Scheduler.map.get('start' + data.id)) {
                        Scheduler.map.get('start' + data.id).clear();
                        Scheduler.map.remove('start' + data.id);
                    }
                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating scheduler detail for company id ' + obj.companyId, err);
                            return cb(err);
                        }
                        logger.log('info', ' scheduler updated.. ');
                        snapshotScheduler(obj.schedulerName, obj.companyId, obj.startScheduleExp, undefined);
                        return cb(null, scheduleObj);
                    });

                }
                else if (data.stopScheduleExp !== obj.stopScheduleExp) {
                    logger.log('info', 'Delete snapshot scheduler time is changed.. ');
                    logger.log('info', 'Delete snapshot scheduler time .. ' + obj.stopScheduleExp);
                    data.stopScheduleExp = obj.stopScheduleExp;

                    if (Scheduler.map.get('stop' + data.id)) {
                        Scheduler.map.get('stop' + data.id).clear();
                        Scheduler.map.remove('stop' + data.id);
                    }
                    data.save(function (err, scheduleObj) {
                        if (err) {
                            logger.log('error', 'Error in updating scheduler detail for company id ' + obj.companyId +
                                ' err: ' + err);
                            return cb(err);
                        }
                        logger.log('info', ' scheduler updated.. ');
                        snapshotScheduler(obj.schedulerName, obj.companyId, undefined, obj.stopScheduleExp);
                        return cb(null, scheduleObj);
                    });

                }


            }
        });
    };

    Scheduler.remoteMethod('saveSnapshotScheduler', {
        description: 'To save or update scheduler detail for snapshot',
        accepts: [
            {arg: 'obj', type: 'object', required: true, description: ['Object of schedule model']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'post', path: '/saveSnapshotScheduler'}
    });


    Scheduler.getNextOccurrence = function (_id, action, cb) {
        Scheduler.findById(
            _id, function (err, data) {
                var occurrences;
                if (err) {
                    logger.log('error', 'Error in getting scheduler detail by  :' + _id, err);
                    return cb(err);
                }
                if (data) {

                    if (action === 'start' && data.start && data.startSchedulerInstance)

                        occurrences = later.schedule(data.startSchedulerInstance).next(5);
                    if (action === 'stop' && data.stop && data.stopSchedulerInstance) {
                        if (Scheduler.map.get('stop' + _id))
                            occurrences = later.schedule(data.stopSchedulerInstance).next(5);
                    }

                } else {
                    logger.log('info', 'No data found for scheduler by id ' + _id);
                }

                return cb(null, occurrences);
            });
    };
    Scheduler.remoteMethod('getNextOccurrence', {
        description: 'Detail of next 5 occurrence of specified instance.',
        accepts: [
            {arg: '_id', type: 'string', required: true, description: ['ID of schedule model']},
            {arg: 'action', type: 'string', required: true, description: ['Start/stop']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'get', path: '/getNextOccurrence'}
    });

    Scheduler.getNextOccurrencesByName = function (name, count, cb) {
        Scheduler.findOne(
            {where: {schedulerName: name}}, function (err, data) {
                var occurences = {};
                if (err) {
                    logger.log('error', 'Error in getting scheduler detail by name : ' + name + ' err: ', err);
                    return cb(new Error(err));
                }
                if (data) {

                    occurences.start = [];
                    occurences.stop = [];
                    if (data.start && data.startSchedulerInstance)

                        occurences.start = later.schedule(data.startSchedulerInstance).next(count);
                    if (data.stop && data.stopSchedulerInstance) {

                        occurences.stop = later.schedule(data.stopSchedulerInstance).next(count);
                    }

                } else {
                    logger.log('info', 'No data found for scheduler by name ' + name);
                }

                return cb(null, occurences);
            });
    };
    Scheduler.remoteMethod('getNextOccurrencesByName', {
        description: 'Detail of next 5 occurrence of specified instance.',
        accepts: [
            {arg: 'name', type: 'string', required: true, description: ['ID of schedule model']},
            {arg: 'count', type: 'number', required: true, description: ['Count of next occurences']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'get', path: '/getNextOccurrencesByName'}
    });


};







