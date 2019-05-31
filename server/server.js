'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var app = module.exports = loopback();

var bodyParser = require('body-parser');

var https = require('https');
var http = require('http');
var sslConfig = require('./ssl-config');
var options = {
  key: sslConfig.privateKey,
  cert: sslConfig.certificate
};
var httpOnly=true;
var fs = require('fs');

fs.mkdir('./logs',function(err){
   if (err) {
       return console.error(err);
   }
   console.log("Log directory created successfully!");
});

var later = require('later');
var winston = require('winston');
//
// Requiring `winston-mongodb` will expose
// `winston.transports.MongoDB`
//
/*require('winston-mongodb').MongoDB;
logger.add(logger.transports.File, {filename: 'zehnca.log'});


logger.add(logger.transports.MongoDB, {
        db: 'mongodb://localhost/zehnaws'
    }
);*/


var transports  = [];

transports.push(new winston.transports.DailyRotateFile({
  name: 'file',
  datePattern: '.yyyy-MM-dd',
  filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});




// configure view handler
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));

var async = require('async');

// The ultimate error handler.
app.use(loopback.errorHandler());


app.start = function(httpOnly) {
  if (httpOnly === undefined) {
    httpOnly = process.env.HTTP;
  }
  var server = null;
  if (!httpOnly) {
    var options = {
      key: sslConfig.privateKey,
      cert: sslConfig.certificate
    };
    server = https.createServer(options, app);


  } else {
    server = http.createServer(app);
  }
  server.listen(app.get('port'), function () {
    var baseUrl = (httpOnly ? 'http://' : 'https://') + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');

  });

    return server;
}
// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
    if (err) {
         logger.log('error', 'Server error ',err);
        throw err;
    }

    // start the server if `$ node server.js`
    if (require.main === module) {
         logger.log('info', 'Server is started ');
        app.start();
    }
});


function restartScheduler() {

    logger.log('info', 'Connect to database ');
    logger.log('info', 'Fetching all trigger to start ');

    var Scheduler = app.models.Scheduler;

    Scheduler.find({
        where: {
            schedulerType: 'instance'
        }
    }, function (err, schedulers) {

        if (schedulers && schedulers.length > 0) {
            logger.log('info', 'Total instance trigger %d', schedulers.length);

            async.each(schedulers, function (scheduler) {
                var startInstanceSchedule, stopInstanceSchedule, t1, t2;

                logger.log('info', 'Name of trigger '+ scheduler.schedulerName+ ' created by '+scheduler.createdBy +' company '+scheduler.companyId);
                if (scheduler.start && scheduler.startScheduleExp) {
                    logger.log('info', 'Start instance trigger ' + scheduler.schedulerName + ' schedule at %s', scheduler.startScheduleExp);

                    startInstanceSchedule = later.parse.text(
                        scheduler.startScheduleExp
                    );
                    t1 = later.setInterval(function () {


                        Scheduler.scheduleStartInstance(scheduler.schedulerName,
                            scheduler.companyId);
                    }, startInstanceSchedule);
                    logger.log('debug', 'Trigger object %j',startInstanceSchedule);
                }

                if (scheduler.stop && scheduler.stopScheduleExp) {
                    logger.log('info', 'Stop instance trigger ' + scheduler.schedulerName + ' schedule at %s', scheduler.stopScheduleExp);

                    stopInstanceSchedule = later.parse.text(
                        scheduler.stopScheduleExp
                    );
                    t2 = later.setInterval(function () {

                        Scheduler.scheduleStopInstance(scheduler.schedulerName,
                            scheduler.companyId);
                    }, stopInstanceSchedule);
                    logger.log('debug', 'Trigger object %j',stopInstanceSchedule);
                }

                if (startInstanceSchedule) {
                    scheduler.start = true;
                    scheduler.startSchedulerInstance = startInstanceSchedule;
                    Scheduler.map.set('start' + scheduler.id, t1);
                }

                if (stopInstanceSchedule) {
                    scheduler.stop = true;
                    scheduler.stopSchedulerInstance = stopInstanceSchedule;
                    Scheduler.map.set('stop' + scheduler.id, t2);
                }

                scheduler.save(function (err, res) {
                    if (err) {
                        logger.log('error', 'Error in updating trigger detail for ' + scheduler.schedulerName, err);

                    } else {
                        logger.log('info', 'Save trigger object into database ', res);
                    }
                });

            }, function (err) {
                console.log('restartScheduler callback'+err);

            });


        } else {
            logger.log('info', 'No data found for instance triggers ');
        }

    });
}

function scheduleGettingInstances(){
    var Instance = app.models.Instance;
    Instance.scheduleGettingInstances();
}

function schdeuleGettingSnapshots(){
    var Snapshot = app.models.Snapshot;
    Snapshot.scheduleGettingSnapshot();
}

function schdeuleGettingVolumes(){
    var Volume = app.models.Volume;
   Volume.scheduleGettingVolume();
}

function scheduleGettingObjects() {
    schdeuleGettingSnapshots();
    schdeuleGettingVolumes();
    scheduleGettingInstances();
}

scheduleGettingObjects();

function restartSnapshotScheduler() {

    var Scheduler = app.models.Scheduler;

    Scheduler.find({
        where: {
            schedulerType: 'snapshot'
        }
    }, function (err, schedulers) {

        if (schedulers && schedulers.length > 0) {
            logger.log('info', 'Total snapshot trigger %d', schedulers.length);

            async.each(schedulers, function (scheduler) {
                var startInstanceSchedule, stopInstanceSchedule, t1, t2;

                 logger.log('info', 'Name of trigger '+ scheduler.schedulerName+ ' created by '+scheduler.createdBy +' company '+scheduler.companyId);
                if (scheduler.start && scheduler.startScheduleExp) {

                  logger.log('info', 'Create snapshot trigger ' + scheduler.schedulerName + ' schedule at %s', scheduler.startScheduleExp);

                    startInstanceSchedule = later.parse.text(
                        scheduler.startScheduleExp
                    );
                    t1 = later.setInterval(function () {

                        Scheduler.scheduleCreateSnapshot(scheduler.schedulerName,
                            scheduler.companyId);
                    }, startInstanceSchedule);
                    logger.log('debug', 'Trigger object %j',startInstanceSchedule);
                }

                if (scheduler.stop && scheduler.stopScheduleExp) {

                    logger.log('info', 'Delete snapshot trigger ' + scheduler.schedulerName + ' schedule at %s', scheduler.startScheduleExp);

                    stopInstanceSchedule = later.parse.text(
                        scheduler.stopScheduleExp
                    );
                    t2 = later.setInterval(function () {

                        Scheduler.scheduleDeleteSnapshot(scheduler.schedulerName,
                            scheduler.companyId);
                    }, stopInstanceSchedule);

                     logger.log('debug', 'Trigger object %j',stopInstanceSchedule);
                }

                if (startInstanceSchedule) {
                    scheduler.start = true;
                    scheduler.startSchedulerInstance = startInstanceSchedule;
                    Scheduler.map.set('start' + scheduler.id, t1);
                }

                if (stopInstanceSchedule) {
                    scheduler.stop = true;
                    scheduler.stopSchedulerInstance = stopInstanceSchedule;
                    Scheduler.map.set('stop' + scheduler.id, t2);
                }

                scheduler.save(function (err, res) {
                    if (err) {
                        logger.log('error', 'Error in updating trigger detail for ' + scheduler.schedulerName, err);

                    } else {
                        logger.log('info', 'Save trigger object into database ', res);
                    }
                });

            }, function (err) {
                console.log('restartSnapshotScheduler callback' +err);

            });


        } else {
            logger.log('info', 'No data found for snapshot triggers ');
        }

    });
}


restartScheduler();
restartSnapshotScheduler();
