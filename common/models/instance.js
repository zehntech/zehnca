var AWS = require('aws-sdk');


var config = require('../../server/config.json');
var crypto = require('crypto');
var uuid = require('uuid');
var async = require('async');
var later = require('later');
var path = require('path');
var winston = require('winston');
var transports = [];

transports.push(new winston.transports.DailyRotateFile({
    name: 'file',
    datePattern: '.yyyy-MM-dd',
    filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});

module.exports = function (Instance) {

    Instance.getInstances = function (companyId) {
        var amzInstances = [];
        var KeyManagement = Instance.app.models.KeyManagement;
        KeyManagement.findOne({
            where: {
                companyId: companyId
            }
        }, function (err, key) {
            if (err) {
                logger.info('error', 'Err in getting key from database for company ' + companyId, err);
                return;
            }
            if (key) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(key.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');

                var dec2 = decipher1.update(key.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');


                async.each(config.regions, function (result) {

                    var params = {};

                    new AWS.EC2({
                        accessKeyId: dec1,
                        secretAccessKey: dec2,
                        region: result
                    }).describeInstances(params, function (error, instances) {
                            if (error) {
                                logger.error('error', 'Err in describing all instances for ' + result, error);
                                return;

                            }

                            if (instances && instances.Reservations.length > 0) {
                                logger.info(' Found a total of ' + instances.Reservations.length + ' Instances in ' + result + ' region');

                                async.each(instances.Reservations, function (instance) {

                                    if (instance.Instances && instance.Instances[0]) {
                                        amzInstances.push(instance.Instances[0].InstanceId);
                                        logger.info('Checking the existence of instance ' + instance.Instances[0].InstanceId);
                                        Instance.findOne({where: {instanceId: instance.Instances[0].InstanceId, companyId:companyId}}, function (err, eInstance) {

                                            if (err) {
                                                logger.info('Error in finding the instance having instance id ' + instance.Instances[0].InstanceId, err);
                                            } else if (!eInstance) {
                                                logger.info('No instance exists already having instance id ' + instance.Instances[0].InstanceId);
                                                logger.info('Saving new instance');
                                                var nInstance = new Instance({
                                                    instanceId: instance.Instances[0].InstanceId,
                                                    companyId: companyId,
                                                    created_at: new Date(),
                                                    updated_at: new Date(),
                                                    data: instance,
                                                    region: result
                                                });
                                                nInstance.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Error in saving new instance having id ' + instance.Instances[0].InstanceId, err);
                                                    }
                                                    if (data) {
                                                        logger.info('Saved new instance successfully');
                                                    }
                                                });
                                            } else if (eInstance) {
                                                logger.info('Instance exists already having instance id ' + instance.Instances[0].InstanceId);
                                                logger.info('Updating the instance');
                                                eInstance.instanceId = instance.Instances[0].InstanceId;
                                                eInstance.updated_at = new Date();
                                                eInstance.data = instance;
                                                eInstance.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Error in updating the instance having id ' + instance.Instances[0].InstanceId, err);
                                                    }
                                                    if (data) {
                                                        logger.info('Updated the instance successfully');
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        console.log('No instance found');
                                    }

                                }, function (err) {
                                    logger.error('Async callback error ' + JSON.stringify(err));
                                });

                            } else {
                                logger.info('No instance found in region ' + result);
                            }


                        });



                }, function (err) {
                    console.log('Callback '+err);


                });
            } else {
                logger.info('info', 'Key does not exist for company  : ' + companyId);
            }


        });

        setTimeout(function () {
            Instance.removeTerminatedInstances(companyId, amzInstances);
        }, 600000);

    };

    Instance.removeTerminatedInstances = function (companyId, nonTerminatedInstances) {
        logger.info('Removing terminated instances from database');
        Instance.find({where: {companyId: companyId}}, function (err, instances) {
            async.each(instances, function (instance) {
                if (nonTerminatedInstances.indexOf(instance.instanceId) < 0) {
                    logger.info('Instance having instance id ' + instance.instanceId + ' found to be terminated');
                    logger.info('Removing terminated instance from database having id ' + instance.instanceId);
                    Instance.destroyAll({instanceId: instance.instanceId}, function (err, data) {
                        if (err) {
                            logger.error('Error in deleting the instance having instance id ' + instance.instanceId);
                        }
                        else if (data) {
                            logger.error('Removed the instance having instance id ' + instance.instanceId);
                        }
                    });
                }
            });
        });
    };

    Instance.scheduleGettingInstances = function () {
        logger.info('Scheduling getting instances');
        var schedule = later.parse.text('every 1 hour');
        var task = function () {
            var Company = Instance.app.models.Company;

            Company.find(function (err, companies) {
                if (err) {
                    logger.error('Error in finding companies', err);
                    return;
                }
                else if (companies.length > 0) {
                    logger.info('Found a total of ' + companies.length + ' companies');
                    async.each(companies, function (company) {
                        Instance.getInstances(company.id);
                    });
                }

            });
        };

        later.setInterval(
            task, schedule);


    };


    /**
     * Function to get all instances based on region
     * @param id
     * @param region
     * @param cb
     */
    Instance.descInstance = function (id, region, cb) {

        Instance.find({where: {companyId: id}}, function (err, instances) {
            if (err) {
                logger.log('error', 'There was an error retrieving instances from database', err);
            }
            if (instances.length > 0) {
                if (region === 'all') {
                      return cb(null, instances);

                }else {
                    Instance.find({where: {companyId: id, region: region}}, function (err, data) {
                        if (err) {
                            logger.log('error', 'There was an error retrieving instances from database region ' + region, err);
                        } else {
                            return cb(null, data);
                        }
                    });
                }


            } else {
                Instance.getInstances(id);
                if (region === 'all') {
                      return cb(null, 'done');

                }
                var KeyManagement = Instance.app.models.KeyManagement;
                KeyManagement.findOne({
                    where: {
                        companyId: id
                    }
                }, function (err, data) {
                    if (err) {
                        logger.log('error', 'There was an error retrieving key from database', err);
                    }
                    if (data) {
                        var decipher = crypto.createDecipher(config.algorithm, config.password);
                        var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                        var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                        dec1 += decipher.final('utf8');

                        var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                        dec2 += decipher1.final('utf8');

                        new AWS.EC2({
                            accessKeyId: dec1,
                            secretAccessKey: dec2,
                            region: region
                        }).describeInstances(function (error, data1) {
                                if (error) {
                                    logger.log('error', 'Err in describe all instance for ' + region, error);

                                    return cb(error);

                                } else {
                                    logger.log('info', 'Describe all instance for ' + region + ' and instance');
                                    return cb(null, data1);
                                }
                            });
                    } else {
                        logger.log('info', 'No key found');
                        return cb(new Error('Key doesn\'t exist'));
                    }
                });
            }
        });


    };
    Instance.remoteMethod('descInstance', {
        description: 'Returns a list of instance of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']},
            {arg: 'region', type: 'string', required: true, description: ['This is the region name']}
        ],
        returns: {arg: 'data', type: 'string'},
        http: {verb: 'get', path: '/descInstance'}
    });


    /**
     * Function to get all reserved instances based on region
     * @param id
     * @param region
     * @param cb
     */
    Instance.descReservedInstance = function (id, region, cb) {

        var KeyManagement = Instance.app.models.KeyManagement;
        KeyManagement.findOne({
            where: {
                companyId: id
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving key from database', err);
            }
            if (data) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');

                var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');

                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).describeReservedInstances(function (error, data1) {
                        if (error) {
                            logger.log('error', 'Err in describe all instance for ' + region, error);

                            return cb(error);

                        } else {
                            logger.log('info', 'Describe all instance for ' + region + ' and instance');
                            return cb(null, data1);
                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });

    };
    Instance.remoteMethod('descReservedInstance', {
        description: 'Returns a list of reserved instance of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']},
            {arg: 'region', type: 'string', required: true, description: ['This is the region name']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'get', path: '/descReservedInstance'}
    });


    /**
     * Function to start instance
     * @param id
     * @param companyId
     * @param region
     * @param cb
     */
    Instance.startInstance = function (id, companyId, region, cb) {
        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(id + ' instance in ' + region + ' region', {companyId: companyId});
        var KeyManagement = Instance.app.models.KeyManagement;
        var Logger = Instance.app.models.Logger;
        KeyManagement.findOne({
            where: {
                companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving key from database', err);
            }
            if (data) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');

                var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');
                logger.info('Decrypt key...');
                var params = {
                    InstanceIds: [id]
                };
                var logObj = {
                    instanceId: id,
                    region: region,
                    createdAt: new Date(),
                    companyId: companyId,

                    event: 'start',
                    file: uid + '_file.log',
                    logType: 'instance'
                };

                new AWS.EC2({
                    'accessKeyId': dec1,
                    'secretAccessKey': dec2,
                    region: region
                }).startInstances(params, function (error, data) {
                    var log;
                        if (error) {
                            logger.log('error', 'Err in starting instance ' + id, error);
                            logObj.result = 'failure';
                             log = new Logger(logObj);
                            log.save();
                            logger.remove(uid);
                            return cb(error);
                        } else {

                            logger.log('info', 'Manually start instance ', data);
                            logObj.result = 'success';
                             log = new Logger(logObj);
                            log.save();
                            logger.remove(uid);
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Instance.remoteMethod('startInstance', {
        description: 'Start instance of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['This is the id of a instance']},
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/startInstance'}
    });


    /**
     * Function to stop instance
     * @param id
     * @param companyId
     * @param region
     * @param cb
     */
    Instance.stopInstance = function (id, companyId, region, cb) {

        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(id + ' instance in ' + region + ' region', {companyId: companyId});

         var KeyManagement = Instance.app.models.KeyManagement;
        var Logger = Instance.app.models.Logger;

        KeyManagement.findOne({
            where: {
                companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'There was an error retrieving key from database', err);
                console.log('There was an error retrieving key from database');
                console.log(err);
            }
            if (data) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');

                var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');

                var params = {
                    InstanceIds: [id]
                };
                var logObj = {
                    instanceId: id,
                    region: region,
                    createdAt: new Date(),
                    companyId: companyId,
                    event: 'stop',
                    file: uid + '_file.log',
                    logType: 'instance'
                };

                new AWS.EC2({
                    'accessKeyId': dec1,
                    'secretAccessKey': dec2,
                    region: region
                }).stopInstances(params, function (error, data) {
                        var log;
                        if (error) {
                            logger.log('error', 'Err in stop instance for ' + id, error);
                            console.log(error);
                            logObj.result = 'failure';
                             log = new Logger(logObj);
                            log.save();
                            logger.remove(uid);
                            return cb(error);
                        } else {
                            logger.log('info', 'Manually stop instance ' + id);
                            logObj.result = 'success';
                             log = new Logger(logObj);
                            log.save();
                            logger.remove(uid);
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Instance.remoteMethod('stopInstance', {
        description: 'Stop instance of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['This is the id of a instance']},
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/stopInstance'}
    });


};
