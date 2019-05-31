/**
 * Created by abhaypatidar on 31/10/15.
 */

var AWS = require('aws-sdk');


var config = require('../../server/config.json');
var crypto = require('crypto');

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
module.exports = function (Volume) {

    Volume.getVolumes = function (companyId) {
        var amzVolumes = [];
        var KeyManagement = Volume.app.models.KeyManagement;
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
                    }).describeVolumes(params, function (error, volumes) {
                            // console.log('Volumes '+JSON.stringify(volumes));

                            if (error) {
                                logger.error('error', 'Err in describing all volumes for ' + result, error);
                                return;

                            }


                            if (volumes.Volumes && volumes.Volumes.length > 0) {
                                logger.info(' Found a total of ' + volumes.Volumes.length + ' volumes in ' + result + ' region');

                                async.each(volumes.Volumes, function (volume) {
                                    amzVolumes.push(volume.VolumeId);

                                    if (volume) {
                                        logger.info('Checking the existence of volume ' + volume.VolumeId);
                                        Volume.findOne({where: {volumeId: volume.VolumeId, companyId:companyId}}, function (err, eVolume) {

                                            if (err) {
                                                logger.info('Error in finding the instance having volume id ' + volume.VolumeId
                                                    + ' ' + JSON.stringify(err));
                                            } else if (!eVolume) {
                                                logger.info('No volume exists already having volume id ' + volume.VolumeId);
                                                logger.info('Saving new volume');
                                                var nVolume = new Volume({
                                                    volumeId: volume.VolumeId,
                                                    companyId: companyId,
                                                    created_at: new Date(),
                                                    updated_at: new Date(),
                                                    data: volume,
                                                    region: result
                                                });
                                                nVolume.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Error in saving new volume having id ' + volume.VolumeId, err);
                                                    }
                                                    if (data) {
                                                        logger.info('Saved new volume successfully');
                                                    }
                                                });
                                            } else if (eVolume) {
                                                logger.info('Volume exists already having volume id ' + volume.VolumeId);
                                                logger.info('Updating the volume');
                                                eVolume.instanceId = volume.VolumeId;
                                                eVolume.updated_at = new Date();
                                                eVolume.data = volume;
                                                eVolume.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Error in updating the volume having id ' + volume.VolumeId, err);
                                                    }
                                                    if (data) {
                                                        logger.info('Updated the volume successfully');
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        console.log('No volume found');
                                    }

                                }, function (err) {
                                    logger.error('Async callback error ', err);
                                });

                            } else {
                                logger.info('No volume found in region ' + result);
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
            Volume.removeDeletedVolumes(companyId, amzVolumes);
        }, 600000);

    };

    Volume.scheduleGettingVolume = function () {
        logger.info('Scheduling getting volumes');
        var schedule = later.parse.text('every 1 hour');
        var task = function () {
            var Company = Volume.app.models.Company;

            Company.find(function (err, companies) {
                if (err) {
                    logger.error('Error in finding companies');
                    return;
                }
                else if (companies.length > 0) {
                    logger.info('Found a total of ' + companies.length + ' companies');
                    async.each(companies, function (company) {
                        Volume.getVolumes(company.id);
                    });
                }

            });
        };


        later.setInterval(
            task, schedule);


    };
    Volume.removeDeletedVolumes = function (companyId, amazonVolumes) {
        logger.info('Removing deleted snapshot from database');

        Volume.find({where: {companyId: companyId}}, function (err, volumes) {
            async.each(volumes, function (volume) {
                if (amazonVolumes.indexOf(volume.volumeId) < 0) {
                    logger.info('Volume having id ' + volume.volumeId + ' found to be deleted');
                    logger.info('Removing deleted snapshot from database having id ' + volume.volumeId);
                    Volume.destroyAll({volumeId: volume.volumeId}, function (err, data) {
                        if (err) {
                            logger.error('Error in deleting the volume having volume id ' + volume.volumeId);
                        }
                        else if (data) {
                            logger.error('Removed the volume having volume id ' + volume.volumeId);
                        }
                    });
                }
            });
        });
    };


    /**
     * Function to get all volume
     * @param id
     * @param region
     * @param cb
     */
    Volume.descVolumes = function (id, region, cb) {
        Volume.find({where: {companyId: id}}, function (err, volumes) {
            if (err) {
                logger.log('error', 'There was an error retrieving volumes from database', err);
            }
            if (volumes.length > 0) {
                if (region === 'all') {
                      return cb(null, volumes);

                }else {
                    Volume.find({where: {companyId: id, region: region}}, function (err, data) {
                        if (err) {
                            logger.log('error', 'There was an error retrieving volumes from database region ' + region, err);
                        } else {
                            return cb(null, data);
                        }
                    });
                }
                //return cb(null, volumes);

            } else {

                Volume.getVolumes(id);
                if (region === 'all') {
                      return cb(null, 'done');

                }
                var KeyManagement = Volume.app.models.KeyManagement;
                KeyManagement.findOne({
                    where: {
                        companyId: id
                    }
                }, function (err, data) {
                    if (err) {
                        logger.log('error', 'Err in getting key from database for company Id ' + id, err);
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
                        }).describeVolumes(function (error, data1) {
                                if (error) {
                                    logger.log('error', 'Err in describe all volumes for ' + region, error);

                                    return cb(error);

                                } else {
                                    logger.log('info', 'Describe all volumes for ' + region + ' region');
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
    Volume.remoteMethod('descVolumes', {
        description: 'Returns a list of volume of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']},
            {arg: 'region', type: 'string', required: true, description: ['This is the region name']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'get', path: '/descVolumes'}
    });


    /**
     * Function to create Volume
     * @param availabilityZone
     * @param encrypted
     * @param size
     * @param volumeType
     * @param companyId
     * @param region
     * @param cb
     */
    Volume.createVolume = function (availabilityZone, encrypted, size, volumeType, companyId, region, cb) {
        var KeyManagement = Volume.app.models.KeyManagement;
        KeyManagement.findOne({
            where: {
                companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'Err in getting key from database for company Id ' + companyId, err);
            }
            if (data) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');

                var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');
                var params = {
                    AvailabilityZone: availabilityZone, /* required */
                    Encrypted: encrypted,
                    Size: size,
                    VolumeType: volumeType
                };
                new AWS.EC2({
                    'accessKeyId': dec1,
                    'secretAccessKey': dec2,
                    region: region
                }).createVolume(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in creating volume in region ' + availabilityZone, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Volume created successfully ');
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Volume.remoteMethod('createVolume', {
        description: 'Create volume of snapshot',
        accepts: [
            {
                arg: 'availabilityZone',
                type: 'string',
                required: true,
                description: ['The Availability Zone in which to create the volume']
            },
            {
                arg: 'encrypted',
                type: 'boolean',
                required: false,
                description: ['Specifies whether the volume should be encrypted']
            },
            {arg: 'size', type: 'number', required: true, description: ['The size of the volume, in GiBs']},
            {
                arg: 'volumeType', type: 'string', required: false, description: [
                'The volume type. This can be gp2 for General Purpose (SSD) volumes, io1 ' +
                'for Provisioned IOPS (SSD) volumes, or standard for Magnetic volumes']
            },
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/createVolume'}
    });

    /**
     * Function to delete Volume
     * @param volumeId
     * @param companyId
     * @param region
     * @param cb
     */
    Volume.deleteVolume = function (volumeId, companyId, region, cb) {
        var KeyManagement = Volume.app.models.KeyManagement;
        KeyManagement.findOne({
            where: {
                companyId: companyId
            }
        }, function (err, data) {
            if (err) {
                logger.log('error', 'Err in getting key from database for company Id ' + companyId, err);
            }
            if (data) {
                var decipher = crypto.createDecipher(config.algorithm, config.password);
                var decipher1 = crypto.createDecipher(config.algorithm, config.password1);
                var dec1 = decipher.update(data.accessKey, 'hex', 'utf8');
                dec1 += decipher.final('utf8');

                var dec2 = decipher1.update(data.secretKey, 'hex', 'utf8');
                dec2 += decipher1.final('utf8');
                var params = {
                    VolumeId: volumeId
                };
                new AWS.EC2({
                    'accessKeyId': dec1,
                    'secretAccessKey': dec2,
                    region: region
                }).deleteVolume(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in deleting volume by ' + volumeId, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Volume delete successfully ');
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Volume.remoteMethod('deleteVolume', {
        description: 'Delete the specified volume',
        accepts: [
            {arg: 'VolumeId', type: 'string', required: true, description: ['The ID of the volume']},
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/deleteVolume'}
    });

};
