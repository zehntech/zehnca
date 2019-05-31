/**
 * Created by abhaypatidar on 31/10/15.
 */
var AWS = require('aws-sdk');


var config = require('../../server/config.json');
var crypto = require('crypto');

var async = require('async');
var later = require('later');
var uuid = require('uuid');

var path = require('path');

var winston = require('winston');
var transports = [];

transports.push(new winston.transports.DailyRotateFile({
    name: 'file',
    datePattern: '.yyyy-MM-dd',
    filename: path.join('logs', 'log_file.log')
}));

var logger = new winston.Logger({transports: transports});

module.exports = function (Snapshot) {

    Snapshot.getSnapshots = function (companyId) {
        var amzSnapshots = [];
        var KeyManagement = Snapshot.app.models.KeyManagement;
        KeyManagement.findOne({
            where: {
                companyId: companyId
            }
        }, function (err, key) {
            if (err) {
                logger.info('error', 'Err in getting key from database for company ' + companyId + ' err: ' + err);
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

                    var params = {
                        OwnerIds: [
                            'self'
                            /* more items */
                        ]
                    };

                    new AWS.EC2({
                        accessKeyId: dec1,
                        secretAccessKey: dec2,
                        region: result
                    }).describeSnapshots(params, function (error, snapshots) {
                            // console.log('SnapShots '+JSON.stringify(snapshots));

                            if (error) {
                                logger.error('error', 'Err in describing all instances for ' + result, error);
                                return;

                            }

                            if (snapshots.Snapshots && snapshots.Snapshots.length > 0) {
                                logger.info(' Found a total of ' + snapshots.Snapshots.length + ' snapshots in ' + result + ' region');

                                async.each(snapshots.Snapshots, function (snapshot) {
                                    amzSnapshots.push(snapshot.SnapshotId);

                                    if (snapshot) {
                                        logger.info('Checking the existence of snapshot ' + snapshot.SnapshotId);
                                        Snapshot.findOne({where: {snapshotId: snapshot.SnapshotId, companyId:companyId}}, function (err, eSnapshot) {

                                            if (err) {
                                                logger.info('Error in finding the instance having snapshot id ' + snapshot.SnapshotId, err);
                                            } else if (!eSnapshot) {
                                                logger.info('No snapshot exists already having snapshot id ' + snapshot.SnapshotId);
                                                logger.info('Saving new instance');
                                                var nSnapshot = new Snapshot({
                                                    snapshotId: snapshot.SnapshotId,
                                                    companyId: companyId,
                                                    created_at: new Date(),
                                                    updated_at: new Date(),
                                                    data: snapshot,
                                                    region: result
                                                });
                                                nSnapshot.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Error in saving new snapshot having id ' + snapshot.SnapshotId, err);
                                                    }
                                                    if (data) {
                                                        logger.info('Saved new snapshot successfully');
                                                    }
                                                });
                                            } else if (eSnapshot) {
                                                logger.info('Snapshot exists already having snapshot id ' + snapshot.SnapshotId);
                                                logger.info('Updating the snapshot');
                                                eSnapshot.instanceId = snapshot.SnapshotId;
                                                eSnapshot.updated_at = new Date();
                                                eSnapshot.data = snapshot;
                                                eSnapshot.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Error in updating the snapshot having id ' + snapshot.SnapshotId, err);
                                                    }
                                                    if (data) {
                                                        logger.info('Updated the snapshot successfully');
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        console.log('No snapshot found');
                                    }

                                }, function (err) {
                                    logger.error('Async callback error ' + JSON.stringify(err));
                                });

                            } else {
                                logger.info('No snapshot found in region ' + result);
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
            Snapshot.removeDeletedSnapshots(companyId, amzSnapshots);
        }, 600000);

    };

    Snapshot.scheduleGettingSnapshot = function () {
        logger.info('Scheduling getting snapshots');
        var schedule = later.parse.text('every 1 hour');
        var task = function () {
            var Company = Snapshot.app.models.Company;

            Company.find(function (err, companies) {
                if (err) {
                    logger.error('Error in finding companies');
                    return;
                }
                else if (companies.length > 0) {
                    logger.info('Found a total of ' + companies.length + ' companies');
                    async.each(companies, function (company) {
                        Snapshot.getSnapshots(company.id);
                    });
                }

            });
        };


        later.setInterval(
            task, schedule);

    };

    Snapshot.removeDeletedSnapshots = function (companyId, amazonSnapshots) {
        logger.info('Removing deleted snapshot from database');
        Snapshot.find({where: {companyId: companyId}}, function (err, snaphshots) {
            async.each(snaphshots, function (snaphshot) {
                if (amazonSnapshots.indexOf(snaphshot.snaphshotId) < 0) {
                    logger.info('Snapshot having id ' + snaphshot.snaphshotId + ' found to be deleted');
                    logger.info('Removing deleted snapshot from database having id ' + snaphshot.snaphshotId);
                    Snapshot.destroyAll({snapshotId: snaphshot.snaphshotId}, function (err, data) {
                        if (err) {
                            logger.error('Error in deleting the snapshot having instance id ' + snaphshot.snaphshotId);
                        }
                        else if (data) {
                            logger.error('Removed the snapshot having snapshot id ' + snaphshot.snaphshotId);
                        }
                    });
                }
            });
        });
    };


    /**
     * Function to get all snapshots
     * @param id
     * @param region
     * @param cb
     */
    Snapshot.descSnapshots = function (id, region, cb) {
        Snapshot.find({where: {companyId: id}}, function (err, snapshots) {
            if (err) {
                logger.log('error', 'There was an error retrieving snapshots from database', err);
            }
            if (snapshots.length > 0) {
                 console.log('Snapshot in if...'+snapshots.length+' & region '+region);
                if (region === 'all') {
                      return cb(null, snapshots);

                }else {
                    Snapshot.find({where: {companyId: id, region: region}}, function (err, data) {
                        if (err) {
                            logger.log('error', 'There was an error retrieving snapshots from database region ' + region, err);
                        } else {
                            return cb(null, data);
                        }
                    });
                }


            } else {
                console.log('Snapshot in else...'+snapshots.length+' & region '+region);
                Snapshot.getSnapshots(id);
                if (region === 'all') {
                      return cb(null, 'done');

                }
                var KeyManagement = Snapshot.app.models.KeyManagement;
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

                        var params = {

                            MaxResults: 10,
                            OwnerIds: [
                                'self'
                                /* more items */
                            ]
                        };

                        new AWS.EC2({
                            accessKeyId: dec1,
                            secretAccessKey: dec2,
                            region: region
                        }).describeSnapshots(params, function (error, data1) {
                                if (error) {
                                    logger.log('error', 'Err in describe all snapshots for ' + region, error);

                                    return cb(error);

                                } else {
                                    logger.log('info', 'Describe all snapshots for ' + region + ' region');
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
    Snapshot.remoteMethod('descSnapshots', {
        description: 'Returns a list of snapshots of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']},
            {arg: 'region', type: 'string', required: true, description: ['This is the region name']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'get', path: '/descSnapshots'}
    });


    /**
     * Function to get all images
     * @param id
     * @param region
     * @param cb
     */
    Snapshot.descImages = function (id, region, cb) {

        var KeyManagement = Snapshot.app.models.KeyManagement;
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

                var params = {

                    Owners: [
                        'self'
                    ]
                };

                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).describeImages(params, function (error, data1) {
                        if (error) {
                            logger.log('error', 'Err in describe all images for ' + region, error);

                            return cb(error);

                        } else {
                            logger.log('info', 'Describe all images for ' + region + ' region');
                            return cb(null, data1);
                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });

    };
    Snapshot.remoteMethod('descImages', {
        description: 'Returns a list of images of specified region.',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['Company Id']},
            {arg: 'region', type: 'string', required: true, description: ['This is the region name']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'get', path: '/descImages'}
    });


    /**
     * Function to create Image
     * @param instanceId
     * @param name
     * @param description
     * @param noReboot
     * @param companyId
     * @param region
     * @param cb
     */
    Snapshot.createImage = function (instanceId, name, description, noReboot, companyId, region, cb) {
        var KeyManagement = Snapshot.app.models.KeyManagement;
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
                    InstanceId: instanceId, /* required */
                    Name: name, /* required */
                    Description: description,
                    noReboot: noReboot
                };
                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).createSnapshot(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in creating image for snapshot ' + instanceId, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Snapshot created successfully');
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Snapshot.remoteMethod('createImage', {
        description: 'Stop snapshot of specified region.',
        accepts: [
            {arg: 'instanceId', type: 'string', required: true, description: ['The ID of the snapshot']},
            {arg: 'name', type: 'string', required: true, description: ['A name for the new image']},
            {arg: 'description', type: 'string', required: false, description: ['The description for the snapshot']},
            {
                arg: 'noReboot', type: 'boolean', required: false, description: [
                'By default, this parameter is set to false, which means Amazon EC2 attempts to shut down the snapshot cleanly before image ' +
                'creation and then reboots the snapshot. When the parameter is set to true, Amazon EC2 doesn\'t shut down the snapshot before creating the image. ' +
                'When this option is used, file system integrity on the created image can\'t be guaranteed']
            },
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/createImage'}
    });


    /**
     * Function to copy image
     * @param name
     * @param sourceImageId
     * @param sourceRegion
     * @param description
     * @param companyId
     * @param region
     * @param cb
     */
    Snapshot.copyImage = function (name, sourceImageId, sourceRegion, description, companyId, region, cb) {
        var KeyManagement = Snapshot.app.models.KeyManagement;
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
                    Name: name, /* required */
                    SourceImageId: sourceImageId, /* required */
                    SourceRegion: sourceRegion, /* required */
                    Description: description
                };
                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).copyImage(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in stop copy image from ' + sourceImageId, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Image is copied successfully ');
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Snapshot.remoteMethod('copyImage', {
        description: 'Copy image from another image.',
        accepts: [
            {
                arg: 'name',
                type: 'string',
                required: true,
                description: ['The name of the new AMI in the destination region']
            },
            {arg: 'sourceImageId', type: 'string', required: true, description: ['The ID of the AMI to copy']},
            {
                arg: 'sourceRegion',
                type: 'string',
                required: true,
                description: ['The name of the region that contains the AMI to copy']
            },
            {
                arg: 'description',
                type: 'string',
                required: false,
                description: ['A description for the new AMI in the destination region']
            },
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/copyImage'}
    });


    /**
     * Function to create snapshot
     * @param volumeId
     * @param description
     * @param companyId
     * @param region
     * @param cb
     */
    Snapshot.createSnapshot = function (volumeId, description, companyId, region, cb) {

        var uid = uuid.v1();
        transports.push(new (winston.transports.File)({
            name: uid,
            filename: path.join('logs', uid + '_file.log')
        }));
        logger = new winston.Logger({transports: transports});

        logger.info(volumeId + ' volume found for create snapshot', {companyId: companyId});

        var KeyManagement = Snapshot.app.models.KeyManagement;
        var Logger = Snapshot.app.models.Logger;

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
                    VolumeId: volumeId,
                    Description: description
                };
                var logObj = {
                    volumeId: volumeId,
                    region: region,
                    createdAt: new Date(),
                    companyId: companyId,

                    event: 'create',
                    file: uid + '_file.log',
                    logType: 'snapshot'
                };
                var log;
                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).createSnapshot(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in creating snapshot from volume ' + volumeId, error);
                            logObj.result = 'failure';
                            log = new Logger(logObj);
                            log.save();
                            logger.remove(uid);
                            return cb(error);
                        } else {
                            logger.log('info', 'Snapshot created successfully');
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
    Snapshot.remoteMethod('createSnapshot', {
        description: 'Create snapshot by volume',
        accepts: [
            {
                arg: 'volumeId',
                type: 'string',
                required: true,
                description: ['The ID of the volume that was used to create the snapshot']
            },
            {arg: 'description', type: 'string', required: false, description: ['The description for the snapshot']},
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/createSnapshot'}
    });


    /**
     * Function to copy snapshot
     * @param sourceSnapshotId
     * @param sourceRegion
     * @param destinationRegion
     * @param description
     * @param encrypted
     * @param companyId
     * @param region
     * @param cb
     */
    Snapshot.copySnapshot = function (sourceSnapshotId, sourceRegion, destinationRegion, description, encrypted, companyId, region, cb) {
        var KeyManagement = Snapshot.app.models.KeyManagement;
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
                    SourceSnapshotId: sourceSnapshotId,
                    SourceRegion: sourceRegion,
                    DestinationRegion: destinationRegion,
                    Description: description,
                    Encrypted: encrypted

                };
                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).copySnapshot(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in copy snapshot from ' + sourceSnapshotId, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Snapshot copied successfully');
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Snapshot.remoteMethod('copySnapshot', {
        description: 'Copy snapshot from another snapshot',
        accepts: [
            {
                arg: 'sourceSnapshotId',
                type: 'string',
                required: true,
                description: ['The ID of the EBS snapshot to copy']
            },
            {
                arg: 'sourceRegion',
                type: 'string',
                required: true,
                description: ['The ID of the region that contains the snapshot to be copied']
            },
            {
                arg: 'destinationRegion',
                type: 'string',
                required: true,
                description: ['The destination region to use in the PresignedUrl parameter of a snapshot copy operation.']
            },
            {arg: 'description', type: 'string', required: false, description: ['A description for the EBS snapshot']},
            {
                arg: 'encrypted',
                type: 'boolean',
                required: false,
                description: ['Specifies whether the volume should be encrypted']
            },
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/copySnapshot'}
    });


    /**
     * Function to delete snapshot
     * @param snapshotId
     * @param companyId
     * @param region
     * @param cb
     */
    Snapshot.deleteSnapshot = function (snapshotId, companyId, region, cb) {
        var KeyManagement = Snapshot.app.models.KeyManagement;
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
                    SnapshotId: snapshotId
                };
                new AWS.EC2({
                    accessKeyId: dec1,
                    secretAccessKey: dec2,
                    region: region
                }).deleteSnapshot(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in deleteing snapshot by ' + snapshotId, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Snapshot delete successfully' + snapshotId);
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Snapshot.remoteMethod('deleteSnapshot', {
        description: 'Delete the specified snapshot',
        accepts: [
            {arg: 'snapshotId', type: 'string', required: true, description: ['The ID of the EBS snapshot']},
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/deleteSnapshot'}
    });


    /**
     * Function to deregister Image
     * @param imageId
     * @param companyId
     * @param region
     * @param cb
     */
    Snapshot.deregisterImage = function (imageId, companyId, region, cb) {
        var KeyManagement = Snapshot.app.models.KeyManagement;
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
                    ImageId: imageId
                };
                new AWS.EC2({
                    'accessKeyId': dec1,
                    'secretAccessKey': dec2,
                    region: region
                }).deregisterImage(params, function (error, data) {
                        if (error) {
                            logger.log('error', 'Err in stop deregister image by ' + imageId, error);
                            return cb(error);
                        } else {
                            logger.log('info', 'Image deregister successfully');
                            return cb(null, data);

                        }
                    });
            } else {
                logger.log('info', 'No key found');
                return cb(new Error('Key doesn\'t exist'));
            }
        });
    };
    Snapshot.remoteMethod('deregisterImage', {
        description: 'De-register the specified image',
        accepts: [
            {arg: 'id', type: 'string', required: true, description: ['This is the id of a snapshot']},
            {arg: 'companyId', type: 'string', required: true, description: ['Company id']},
            {arg: 'region', type: 'string', required: true, description: ['Region']}
        ],
        returns: {arg: 'data', type: 'array'},
        http: {verb: 'post', path: '/deregisterImage'}
    });
};
