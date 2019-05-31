/**
 * Created by sourabhagrawal on 1/9/15.
 */

(function () {
    'use strict';
    angular
        .module('app')
        .controller('InstanceCtrl', InstanceCtrl)
        .controller('ScheduleCtrl', ScheduleCtrl)
        .controller('SnapshotCtrl', SnapshotCtrl)
        .controller('ImageCtrl', ImageCtrl)
        .controller('SaveScheduleCtrl', SaveScheduleCtrl);


    InstanceCtrl.$inject = ['$scope', '$rootScope', '$http', '$location', 'CoreService', 'OUAuth', 'InstanceService', 'SchedulerService', 'ScheduleService', '$timeout', 'TableService'];
    function InstanceCtrl($scope, $rootScope, $http, $location, CoreService, OUAuth, InstanceService, SchedulerService, ScheduleService, $timeout, TableService) {

        $scope.tooltip = {
            title: 'By default, No, which means shut down the snapshot cleanly before image ' +
            'creation and then reboots the snapshot. Yes, doesn\'t shut down the snapshot before creating the image.'
        }

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);
        }

        if (window.sessionStorage.getItem('region') && window.sessionStorage.getItem('region') != 'us-east-1') {
            $scope.region = window.sessionStorage.getItem('region');
        } else {
            $scope.region = 'us-east-1';
        }


        $scope.data = [];

        $scope.callServer = function (tableState) {

            $scope.isLoading = true;

            var pagination = tableState.pagination;

            var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
            var number = pagination.number || 1000;  // Number of entries showed per page.

            TableService.getPage(start, number, tableState, $scope.data).then(function (result) {
                $scope.data = result.data;
                //    tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
                $scope.isLoading = false;
            });
        };


        $scope.describeInstances = function (all) {
            $scope.data = [];
            $scope.isLoading = true;
            ScheduleService.scheduleInstance($scope.userData.companyId).then(function (res) {

                $scope.scheduleInstances = res;

                $timeout(function () {


                    if (all == 'all') {
                        loadInstance(all);

                    } else {

                        $scope.region = window.sessionStorage.getItem('region');

                        loadInstance($scope.region);
                    }
                }, 500);


            }, function (err) {
                console.log(err);
            });

            $http.get('api/Notifications?filter[where][companyId]=' + $scope.userData.companyId + '&&access_token=' + OUAuth.accessTokenId).success(function (data) {
                $scope.alerts = data;
            }).error(function (err) {
                console.log(err);
            })


        };


        function loadInstance(region) {

            InstanceService.get($scope.userData.companyId, region).then(function (res) {

                var obj;
                if (res.data.Reservations) {
                    obj = res.data.Reservations;

                    for (var i = 0; i < obj.length; i++) {
                        $scope.data.push(obj[i]);

                    }
                } else {
                    obj = res.data;

                    for (var j = 0; j < obj.length; j++) {

                        if ($scope.scheduleInstances.length > 0) {
                            angular.forEach($scope.scheduleInstances, function (value) {
                                if (value.instanceId == obj[j].data.Instances[0].InstanceId) {
                                    obj[j].data.Schedule = true;
                                }
                            })
                        }
                        if ($scope.alerts && $scope.alerts.length > 0) {

                            angular.forEach($scope.alerts, function (value) {
                                if (value.instanceId == obj[j].data.Instances[0].InstanceId) {
                                    obj[j].data.Notify = true;
                                }
                            })
                        }

                        $scope.data.push(obj[j].data);

                    }

                }
                $scope.isLoading = false;


            }, function (err) {
                CoreService.toastError(err.message);
                $scope.isLoading = false;
            });

        }

        $scope.describeReservedInstances = function () {

            $scope.isLoading = true;
            $timeout(function () {
                if ($scope.region == 'all') {
                    angular.forEach($rootScope.regions, function (value, index) {
                        if (value.key == 'all') {
                        } else loadReservedInstance(value.key);

                    })
                } else {

                    $scope.region = window.sessionStorage.getItem('region');
                    loadReservedInstance($scope.region);
                }
            }, 500);
        };


        function loadReservedInstance(region) {

            InstanceService.getReservedInstances($scope.userData.companyId, region).then(function (res) {
                for (var i = 0; i < res.data.ReservedInstances.length; i++) {
                    $scope.data.push(res.data.ReservedInstances[i]);

                }
                $scope.isLoading = false;
            }, function (err) {
                CoreService.toastError(err.message);
                $scope.isLoading = false;
            });

        }


        $scope.getAllScheduler1 = function () {


            SchedulerService.schInstance($scope.userData.companyId).then(function (res) {
                $scope.schedulers = res;
                $scope.startSchedulers = [];
                $scope.stopSchedulers = [];

                angular.forEach($scope.schedulers, function (value) {
                    if (value.start == 'true' || value.start == true) {
                        $scope.startSchedulers.push(value);
                    }
                    if (value.stop == 'true' || value.stop == true) {
                        $scope.stopSchedulers.push(value);
                    }

                })

            }, function (err) {
                CoreService.toastError('Oops', 'Error in loading schedulers' + err.message);

            });

        };


        $scope.startInstance = function (instance) {

            $http.post('api/Instances/startInstance?access_token=' + OUAuth.accessTokenId, {
                id: instance.InstanceId,
                companyId: $scope.userData.companyId,
                region: instance.Placement.AvailabilityZone.substring(0, instance.Placement.AvailabilityZone.length-1)
            })
                .success(function (res) {
                    instance.State.Name = 'running';
                    CoreService.toastWait('Please wait...');
                }).error(function (err) {
                    CoreService.toastError('Ops', 'Err in starting instance ' + err.message)
                }).finally(function () {
                    $timeout(function () {
                        CoreService.toastClear();
                        $scope.describeInstances();
                    }, 30000);

                })
        };

        $scope.stopInstance = function (instance) {

            $http.post('api/Instances/stopInstance?access_token=' + OUAuth.accessTokenId, {
                id: instance.InstanceId,
                companyId: $scope.userData.companyId,
                region: instance.Placement.AvailabilityZone.substring(0, instance.Placement.AvailabilityZone.length-1)
            })
                .success(function (res) {
                    instance.State.Name = 'stopped';
                    instance.PublicIpAddress = '';
                    CoreService.toastSuccess('Instance stopped successfully!')
                }).error(function (err) {
                    CoreService.toastError('Ops', 'Err in stopping instance ' + err.message)
                })

        };


        $scope.setInstance = function (instance) {
            $scope.instDetail = instance;

            $http.get('api/InstanceSchedules?filter[where][instanceId] =' + instance.InstanceId + '&access_token=' + OUAuth.accessTokenId).success(function (res) {

                if (res.length > 0) {
                    if (res.startSchedulerName)
                        $scope.startSchedulerName.selected.schedulerName = res.startSchedulerName


                    if (res.stopSchedulerName)
                        $scope.stopSchedulerName.selected.schedulerName = res.stopSchedulerName
                }
            }).error(function (err) {
                console.log(err);
            })

        };


        $scope.startSchedulerName = {};
        $scope.stopSchedulerName = {};
        $scope.saveChanges = function () {

            $scope.instanceDetail = {};
            $scope.instanceDetail.instanceId = $scope.instDetail.InstanceId;
            $scope.instanceDetail.instanceRegion = $scope.instDetail.Placement.AvailabilityZone.substring(0, $scope.instDetail.Placement.AvailabilityZone.length - 1);
            $scope.instanceDetail.instanceRegion = $scope.instDetail.Placement.AvailabilityZone.substring(0, $scope.instDetail.Placement.AvailabilityZone.length - 1);


            if ($scope.startSchedulerName.selected || $scope.stopSchedulerName.selected) {
                $scope.instanceDetail.companyId = $scope.userData.companyId;

                if ($scope.startSchedulerName.selected)
                    $scope.instanceDetail.startSchedulerName = $scope.startSchedulerName.selected.schedulerName;

                if ($scope.stopSchedulerName.selected)
                    $scope.instanceDetail.stopSchedulerName = $scope.stopSchedulerName.selected.schedulerName;

                $scope.instanceDetail.createdDate = new Date();


                $http.post('api/InstanceSchedules?access_token=' + OUAuth.accessTokenId, $scope.instanceDetail)
                    .success(function (res) {
                        $scope.startSchedulerName.selected = undefined;
                        $scope.stopSchedulerName.selected = undefined;

                        for (var i in $scope.data) {
                            if ($scope.data[i].Instances[0].InstanceId == $scope.instDetail.InstanceId) {
                                $scope.data[i].Schedule = true;
                                break;
                            }
                        }
                        CoreService.toastSuccess('Instance schedule', 'You instance is schedule ');
                        $('#startModal').modal('hide');

                    }).error(function (err) {
                        console.log(err);
                        CoreService.toastError('Oops', 'Failed to schedule instance ');
                    })
            } else {
                $scope.scheduleInstanceError = 'Please defined atleast one scheduler!';
            }
        };

        $scope.onBlur = function () {
            $scope.scheduleInstanceError = '';
        };

        $scope.$on('changeRegion', function (event) {

            if ($location.path() == '/app/instance') {
                $scope.describeInstances();
            }
            if ($location.path() == '/app/reserved-instance') {

                $scope.describeReservedInstances();
            }

        });

        $scope.$on('syncData', function (event) {

            if ($location.path() == '/app/instance') {
                $scope.describeInstances();
            }
            if ($location.path() == '/app/reserved-instance') {

                $scope.describeReservedInstances();
            }

        });


        $scope.setID = function (instance) {

            $('#createImage').modal('show');
            $scope.image = instance;
            $scope.image.reboot = false;
        };

        $scope.createImage = function () {
            $('#createImageBtn').text("Processing...");
            $scope.isProcessing = true;

            $http.post('api/Snapshots/createImage?access_token=' + OUAuth.accessTokenId, {
                instanceId: $scope.image.instance.InstanceId,
                name: $scope.image.name,
                description: $scope.image.description,
                noReboot: $scope.image.reboot,
                companyId: $scope.image.companyId,
                region: $scope.image.instance.Placement.AvailabilityZone
            })
                .success(function (res) {
                    $scope.image = {};
                    $scope.form.$setPristine();
                    $('#createImage').modal('hide');
                    $('#createImageBtn').text("CREATE");
                    $scope.isProcessing = false;
                }).error(function (err) {
                    console.log(err);
                    $('#createImageBtn').text("CREATE");
                    $scope.isProcessing = false;
                    CoreService.toastError('Oops', 'Failed to create image');
                })

        };

        $scope.reset = function () {
            $scope.image = {};
            if ($scope.form)
                $scope.form.$setPristine();
        }
        $scope.setAlert = function (item) {

            $('#setAlert').modal('show');
            $scope.notify = {};
            $scope.notify.instanceId = item.InstanceId;
            $scope.notify.region = item.Placement.AvailabilityZone;

            for (var i = 0; i < item.Tags.length; i++) {
                if (item.Tags[i].Key == 'Name') {
                    $scope.notify.name = item.Tags[i].Value;
                }
            }

            $scope.notify.start = true;
            $scope.notify.stop = true;
            $scope.notify.sameConfig = true;
            $scope.notify.time = '30';
            $scope.notify.startExp = $scope.notify.time;
            $scope.notify.stopExp = $scope.notify.time;

            $http.get('api/Notifications?filter[where][companyId]=' + $scope.userData.companyId + '&filter[where][instanceId]=' + item.InstanceId + '&access_token=' + OUAuth.accessTokenId)
                .success(function (res) {
                    if (res.length > 0) {
                        if (res[0].startNotifyTime) {

                            $scope.notify.time = res[0].startNotifyTime;
                        }
                        if (res[0].stopNotifyTime) {
                            $scope.notify.stopTime = res[0].stopNotifyTime;

                        }
                        $scope.notify.notifyMailId = res[0].notifyEmailID;
                        $scope.notify.notifyName = res[0].notifyName;
                        $scope.notify.startExp = res[0].startExp;
                        $scope.notify.stopExp = res[0].stopExp;


                        $scope.notify.id = res[0].id;
                    }
                }).error(function (err) {
                    console.log(err);
                })

        };

        $scope.saveNotify = function () {

            var data = {};
            data.instanceId = $scope.notify.instanceId;
            data.region = $scope.notify.region;
            data.name = $scope.notify.name;
            data.companyId = $scope.userData.companyId;
            data.createdDate = new Date();
            data.notifyEmailID = $scope.notify.notifyMailId;
            data.notifyName = $scope.notify.notifyName;
            data.startExp = $scope.notify.startExp;
            data.stopExp = $scope.notify.stopExp;


            if ($scope.notify.start) {

                data.startNotifyTime = $scope.notify.time;
            }
            if ($scope.notify.stop && $scope.notify.sameConfig) {

                data.stopNotifyTime = $scope.notify.time;

            } else if ($scope.notify.stop && !$scope.notify.sameConfig) {

                data.stopNotifyTime = $scope.notify.stopTime;
            }

            if (!$scope.notify.start && !$scope.notify.stop) {
                return;
            }
            if ($scope.notify.id) {
                $http.put('api/Notifications/' + $scope.notify.id + '?access_token=' + OUAuth.accessTokenId, data)
                    .success(function (res) {
                        for (var i in $scope.data) {
                            if ($scope.data[i].Instances[0].InstanceId == $scope.notify.instanceId) {
                                $scope.data[i].Notify = true;
                                break;
                            }
                        }
                        $scope.notify = {};
                        $scope.form.$setPristine();
                        $('#setAlert').modal('hide');
                        CoreService.toastSuccess('Alert has been reactivated!');

                    }).error(function (err) {
                        console.log(err);

                        CoreService.toastError('Oops', err);
                    })
            } else {
                $http.post('api/Notifications?access_token=' + OUAuth.accessTokenId, data)
                    .success(function (res) {
                        for (var i in $scope.data) {

                            if ($scope.data[i].Instances[0].InstanceId == $scope.notify.instanceId) {
                                $scope.data[i].Notify = true;

                                break;
                            }
                        }
                        $scope.notify = {};
                        $scope.form.$setPristine();
                        $('#setAlert').modal('hide');
                        CoreService.toastSuccess('Alert has been activated!');

                    }).error(function (err) {
                        console.log(err);

                        CoreService.toastError('Oops', err);
                    })
            }
        };


        $scope.getAttachedScheduler = function (id) {
            $scope.attachedSchedules = [];
            ScheduleService.scheduleInstanceById(id, $scope.userData.companyId).then(function (res) {

                angular.forEach(res, function (value) {
                    SchedulerService.schInstanceByName($scope.userData.companyId, value.startSchedulerName).then(function (response) {
                        angular.forEach(response, function (value1) {

                            value1.schedulerType = id;
                            $scope.attachedSchedules.push(value1);

                        });
                    });
                });
            }, function (err) {
                console.log(err);
            })
        };


        $scope.getAttachedAlert = function (id) {
            $scope.attachedAlert = [];
            $http.get('api/Notifications?filter[where][companyId]=' + $scope.userData.companyId + '&&access_token=' + OUAuth.accessTokenId).success(function (res) {

                angular.forEach(res, function (value) {
                    $scope.attachedAlert.push(value);
                });

            }).error(function (err) {
                console.log(err);
            })
        };
        ;


        /**
         * Function to delete alert
         * @param item
         *
         */
        $scope.deleteAlert = function (item) {

            CoreService.confirm('Are you sure?', 'Deleting alert cannot be undone', function () {

                    $http.delete('api/Notifications/' + item.id + '/?access_token=' + OUAuth.accessTokenId).success(function (response) {
                        for (var i in $scope.attachedAlert) {
                            if ($scope.attachedAlert[i].id == item.id) {
                                $scope.attachedAlert.splice(i, 1);
                                break;
                            }
                        }
                        for (var j in $scope.data) {
                            if ($scope.data[j].Instances[0].InstanceId == item.instanceId) {
                                $scope.data[j].Notify = false;
                                break;
                            }
                        }
                    }).error(function (err) {
                        CoreService.toastError(
                            'Oops', err);
                    });
                },
                function () {
                    return false;
                });
        };

        $scope.removeInstance = function (item) {
            CoreService.confirm('Are you sure?', 'Removing schedule from instance cannot be undone', function () {

                    $http.delete('api/InstanceSchedules/' + item.id + '/?access_token=' + OUAuth.accessTokenId).success(function (response) {
                        for (var i in $scope.attachedSchedules) {
                            if ($scope.attachedSchedules[i].id == item.id) {
                                $scope.attachedSchedules.splice(i, 1);
                                break;
                            }
                        }
                        for (var j in $scope.data) {
                            if ($scope.data[j].Instances[0].InstanceId == item.instanceId) {
                                $scope.data[j].Schedule = false;
                                break;
                            }
                        }

                    }).error(function (err) {
                        if (err)
                            CoreService.toastError(
                                'Oops',
                                'Error in removing instance schedule : ' + err);
                    });
                },
                function () {
                    return false;
                });
        }

    }


    ScheduleCtrl.$inject = ['$scope', '$http', '$location', 'CoreService', 'OUAuth', '$filter', 'NgTableParams', 'SchedulerService', 'ScheduleService', '$timeout'];
    function ScheduleCtrl($scope, $http, $location, CoreService, OUAuth, $filter, NgTableParams, SchedulerService, ScheduleService, $timeout) {

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);
        }
        $scope.data = [];

        $scope.getAllScheduler = function () {

            $scope.loading = true;

            SchedulerService.schInstance($scope.userData.companyId).then(function (res) {
                $scope.data = res;

                initiateNgTable();

                $scope.loading = false;


            }, function (err) {
                CoreService.toastError(err);
                $scope.loading = false;
            });

        };

        $scope.getAllSnapshotScheduler = function () {

            $scope.loading = true;

            SchedulerService.schSnapshot($scope.userData.companyId).then(function (res) {
                $scope.data = res;

                initiateNgTable();


                $scope.loading = false;


            }, function (err) {
                CoreService.toastError(err);
                $scope.loading = false;
            });

        };

        $scope.getAllScheduleInstance = function () {

            $scope.loading = true;

            ScheduleService.scheduleInstance($scope.userData.companyId).then(function (res) {
                $scope.data = res;

                initiateNgTable();

                $scope.loading = false;

            }, function (err) {
                CoreService.toastError(err);
                $scope.loading = false;
            });


        };

        $scope.getAllScheduleSnapshot = function () {

            $scope.loading = true;
            ScheduleService.scheduleSnapshot($scope.userData.companyId).then(function (res) {
                $scope.data = res;

                initiateNgTable();


                $scope.loading = false;

            }, function (err) {
                CoreService.toastError(err);
                $scope.loading = false;
            });
        };


        function initiateNgTable() {
            $scope.tableParams = new NgTableParams({
                page: 1,            // show first page
                count: 10,          // count per page
                sorting: {
                    name: 'asc'     // initial sorting
                }
            }, {
                counts: [],
                total: $scope.data.length, // length of data
                getData: function ($defer, params) {


                    // use build-in angular filter
                    var orderedData = params.sorting() ?
                        $filter('orderBy')($scope.data, params.orderBy()) :
                        $scope.data;
                    orderedData = params.filter() ?
                        $filter('filter')(orderedData, params.filter()) :
                        orderedData;

                    params.total($scope.data.length); // set total for recalc pagination

                    if (((params.page() * params.count()) - params.count()) === params.total()) {
                        params.page(params.page() - 1);
                    }

                    orderedData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());


                    $defer.resolve(orderedData);
                },
                $scope: $scope
            });
        }


        /**
         * Function to delete schedulerInfo
         * @param schedule
         *
         */
        $scope.delete = function (schedule) {

            CoreService.confirm('Are you sure?', 'Deleting scheduler cannot be undone', function () {

                    $http.delete('api/Schedulers/' + schedule.id + '/?access_token=' + OUAuth.accessTokenId).success(function (response) {
                        for (var i in $scope.data) {
                            if ($scope.data[i].id == schedule.id) {
                                $scope.data.splice(i, 1);
                                break;
                            }
                        }

                        $scope.tableParams.reload();
                        CoreService.toastSuccess(
                            'Scheduler deleted',
                            'Your scheduler has been deleted!');
                    }).error(function (err) {
                        if (err)
                            CoreService.toastError(
                                'Oops',
                                'Error deleting scheduler: ' + err);
                    });
                },
                function () {
                    return false;
                });
        };

        $scope.startStartScheduler = function (item) {

            $http.post('api/Schedulers/startStartScheduler?access_token=' + OUAuth.accessTokenId, {
                _id: item.id
            })
                .success(function (res) {
                    item.start = true;
                    item.updatedDate = res.data.updatedDate;

                }).error(function (err) {
                    console.log(err);
                })
        };

        $scope.stopStartScheduler = function (item) {

            $http.post('api/Schedulers/stopStartScheduler?access_token=' + OUAuth.accessTokenId, {
                _id: item.id
            })
                .success(function (res) {
                    item.start = false;
                    item.updatedDate = res.data.updatedDate;

                }).error(function (err) {
                    console.log(err);
                })

        };

        $scope.startStopScheduler = function (item) {

            $http.post('api/Schedulers/startStopScheduler?access_token=' + OUAuth.accessTokenId, {
                _id: item.id
            })
                .success(function (res) {
                    item.stop = true;
                    item.updatedDate = res.data.updatedDate;

                }).error(function (err) {
                    console.log(err);
                })
        };

        $scope.stopStopScheduler = function (item) {

            $http.post('api/Schedulers/stopStopScheduler?access_token=' + OUAuth.accessTokenId, {
                _id: item.id
            })
                .success(function (res) {
                    item.stop = false;
                    item.updatedDate = res.data.updatedDate;

                }).error(function (err) {
                    console.log(err);
                })

        };

        $scope.getNextOccurrence = function (item, action) {
            $scope.item = item;
            $scope.action = action;

            $http.get('api/Schedulers/getNextOccurrence?access_token=' + OUAuth.accessTokenId + '&_id=' + item.id + '&action=' + action)
                .success(function (res) {
                    if (res.data && res.data.length > 0) {

                        $scope.nextOccerrences = res;

                        $('#nextOcc').modal('show')
                    } else {
                        CoreService.alertInfo('Schedule is not yet started!')
                    }
                }).error(function (err) {
                    console.log(err);
                })
        };


        $scope.$on('saveSchedulerDetail', function (event, value, update) {
            if ($scope.data.length > 0 && update == 'CREATE') {
                $scope.data = $scope.data.concat(value);
            } else if (update == 'UPDATE') {
                for (var i in $scope.data) {

                    if ($scope.data[i].id == value.id) {
                        $scope.data[i] = value;
                        break;
                    }
                }
            } else {
                if ($location.path() == '/app/snapshot-scheduler') {
                    $scope.getAllSnapshotScheduler();
                } else {
                    $scope.getAllScheduler();
                }
            }
            $scope.tableParams.reload();

        });

        $scope.startSchedulerName = {};
        $scope.stopSchedulerName = {};

        $scope.changeScheduler = function (item) {
            $scope.item = item;
            $scope.startSchedulerName = {selected: item.startSchedulerName};
            $scope.stopSchedulerName = {selected: item.stopSchedulerName};


            SchedulerService.schInstance($scope.userData.companyId).then(function (res) {
                $scope.schedulers = res;
                $scope.startSchedulers = [];
                $scope.stopSchedulers = [];

                angular.forEach($scope.schedulers, function (value) {
                    if (value.start == 'true' || value.start == true) {
                        $scope.startSchedulers.push(value);
                    }
                    if (value.stop == 'true' || value.stop == true) {
                        $scope.stopSchedulers.push(value);
                    }

                })

            }, function (err) {
                CoreService.toastError('Oops', 'Error in loading schedulers' + err);

            });

        };

        $scope.updateChanges = function () {

            if ($scope.startSchedulerName.selected || $scope.stopSchedulerName.selected) {
                if ($scope.startSchedulerName.selected)
                    $scope.instanceDetail.startSchedulerName = $scope.startSchedulerName.selected;

                if ($scope.stopSchedulerName.selected)
                    $scope.instanceDetail.stopSchedulerName = $scope.stopSchedulerName.selected;

                $scope.instanceDetail.updatedDate = new Date();


                $http.put('api/Instances/' + $scope.item.id + '?access_token=' + OUAuth.accessTokenId, $scope.instanceDetail)
                    .success(function (res) {

                        CoreService.toastSuccess('Instance schedule', 'You instance is schedule ');
                        $('#startModal').modal('hide');

                    }).error(function (err) {
                        console.log(err);
                        CoreService.toastError('Oops', 'Failed to schedule instance ');
                    })
            } else {
                $scope.scheduleInstanceError = 'Please defined atleast one scheduler!';
            }
        };

        $scope.removeInstance = function (item) {
            CoreService.confirm('Are you sure?', 'Removing schedule from instance cannot be undone', function () {

                    $http.delete('api/InstanceSchedules/' + item.id + '/?access_token=' + OUAuth.accessTokenId).success(function (response) {
                        for (var i in $scope.data) {
                            if ($scope.data[i].id == item.id) {
                                $scope.data.splice(i, 1);
                                break;
                            }
                        }

                        $scope.tableParams.reload();
                        CoreService.toastSuccess(
                            'Instance has been remove from schedule!');
                    }).error(function (err) {
                        if (err)
                            CoreService.toastError(
                                'Oops',
                                'Error in removing instance schedule : ' + err);
                    });
                },
                function () {
                    return false;
                });
        }

        $scope.removeSnapshot = function (item) {
            CoreService.confirm('Are you sure?', 'Removing schedule from snapshot cannot be undone', function () {

                    $http.delete('api/SnapshotSchedules/' + item.id + '/?access_token=' + OUAuth.accessTokenId).success(function (response) {
                        for (var i in $scope.data) {
                            if ($scope.data[i].id == item.id) {
                                $scope.data.splice(i, 1);
                                break;
                            }
                        }

                        $scope.tableParams.reload();
                        CoreService.toastSuccess(
                            'Snapshot has been remove from schedule!');
                    }).error(function (err) {
                        if (err)
                            CoreService.toastError(
                                'Oops',
                                'Error in removing snapshot schedule : ' + err);
                    });
                },
                function () {
                    return false;
                });
        }


    }

    SnapshotCtrl.$inject = ['$scope', '$rootScope', '$http', '$location', 'CoreService', 'OUAuth', 'TableService', 'SnapshotService', 'VolumeService', '$timeout'];
    function SnapshotCtrl($scope, $rootScope, $http, $location, CoreService, OUAuth, TableService, SnapshotService, VolumeService, $timeout) {

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);

        }

        if (window.sessionStorage.getItem('region') && window.sessionStorage.getItem('region') != 'us-east-1') {
            $scope.region = window.sessionStorage.getItem('region');
        } else {
            $scope.region = 'us-east-1';
        }

        $scope.regions = $rootScope.regions;
        $scope.data = [];

        $scope.callServer = function (tableState) {

            $scope.isLoading = true;

            var pagination = tableState.pagination;

            var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
            var number = pagination.number || 1000;  // Number of entries showed per page.

            TableService.getPage(start, number, tableState, $scope.data).then(function (result) {
                $scope.data = result.data;
                //    tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
                $scope.isLoading = false;
            });
        };


        $scope.descSnapshots = function (all) {
            $scope.data = [];

            $scope.isLoading = true;
            $timeout(function () {
                if (all == 'all') {
                    loadSnapshot(all);

                } else {

                    $scope.region = window.sessionStorage.getItem('region');
                    loadSnapshot($scope.region);
                }
            }, 700);

        };

        function loadSnapshot(region) {


            SnapshotService.get($scope.userData.companyId, region).then(function (res) {

                if (res.data.Snapshots) {
                    $scope.data = res.data.Snapshots;
                } else {
                    for (var i = 0; i < res.data.length; i++) {
                        $scope.data.push(res.data[i].data);

                    }

                }

                $scope.isLoading = false;

            }, function (err) {
                CoreService.toastError(err.message);
                $scope.isLoading = false;
            });

        }


        $scope.descVolumes = function (all) {
            $scope.data = [];

            $scope.isLoading = true;
            $timeout(function () {
                if (all == 'all') {
                    loadVolume(all);

                } else {
                    $scope.region = window.sessionStorage.getItem('region');
                    loadVolume($scope.region);
                }
            }, 700);


        };

        function loadVolume(region) {


            VolumeService.get($scope.userData.companyId, region).then(function (res) {


                if (res.data.Volumes) {
                    $scope.data = res.data.Volumes;
                } else {
                    for (var i = 0; i < res.data.length; i++) {
                        $scope.data.push(res.data[i].data);

                    }

                }


                $scope.isLoading = false;


            }, function (err) {
                CoreService.toastError(err.message);
                $scope.isLoading = false;
            });

        }

        $scope.getAllScheduler = function () {
            $http.get('api/Schedulers?filter[where][companyId] =' + $scope.userData.companyId + '&filter[where][schedulerType]=snapshot&access_token=' + OUAuth.accessTokenId)
                .success(function (res) {
                    $scope.schedulers = res;
                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Error in loading schedulers')
                });
        };

        $scope.setSnapshot = function () {
            $scope.volumes = [];
            VolumeService.get($scope.userData.companyId, $scope.region).then(function (res) {

                if (res.data.Volumes) {
                    $scope.volumes = res.data.Volumes;
                } else {
                    for (var i = 0; i < res.data.length; i++) {
                        $scope.volumes.push(res.data[i].data);

                    }

                }

            }, function (err) {
                CoreService.toastError(err);

            });


            $('#createSnapshot').modal('show');
            $scope.snapshot = {};
        };

        $scope.createSnapshot = function () {
            $('#createSnapshotBtn').text("Processing...");
            $scope.isProcessing = true;

            $http.post('api/Snapshots/createSnapshot?access_token=' + OUAuth.accessTokenId, {
                volumeId: $scope.snapshot.volume.selected.VolumeId,
                description: $scope.snapshot.description,
                companyId: $scope.userData.companyId,
                region: $scope.snapshot.volume.selected.AvailabilityZone
            })
                .success(function (res) {
                    $scope.snapshot = {};
                    $scope.form.$setPristine();
                    CoreService.toastSuccess('Snapshot has been created!');
                    $('#createSnapshot').modal('hide');
                    $('#createSnapshotBtn').text("CREATE");
                    $scope.isProcessing = false;

                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Failed to create snapshot');
                    $('#createSnapshotBtn').text("CREATE");
                    $scope.isProcessing = false;
                })

        };

        $scope.setVolume = function () {
            $('#createVolume').modal('show');
            $scope.volume = {};
            $scope.volume.encrypted = false;
            $scope.volume.type = 'standard';
        };

        $scope.createVolume = function () {
            $('#createVolumeBtn').text("Processing...");
            $scope.isProcessing = true;

            $http.post('api/Volumes/createVolume?access_token=' + OUAuth.accessTokenId, {
                availabilityZone: $scope.volume.zone.selected.key,
                encrypted: $scope.volume.encrypted,
                size: $scope.volume.size,
                volumeType: $scope.volume.type,
                companyId: $scope.userData.companyId,
                region: $scope.region
            })
                .success(function (res) {
                    $scope.volume = {};
                    $scope.form.$setPristine();
                    CoreService.toastSuccess('Volume has been created!');
                    $('#createVolume').modal('hide');
                    $('#createVolumeBtn').text("CREATE");
                    $scope.isProcessing = false;
                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Failed to create volume ');

                    $('#createVolumeBtn').text("CREATE");
                    $scope.isProcessing = false;
                })

        };

        $scope.setSnapshotId = function (item) {

            $('#copySnapshot').modal('show');
            $scope.copySnapshot = item;
            $scope.copySnapshot.encrypted = false;

        };

        $scope.copySnapshot = function () {
            $('#copySnapshotBtn').text("Processing...");
            $scope.isProcessing = true;

            $http.post('api/Snapshots/copySnapshot?access_token=' + OUAuth.accessTokenId, {
                sourceSnapshotId: $scope.copySnapshot.sourceSnapshotId,
                sourceRegion: $scope.region,
                destinationRegion: $scope.copySnapshot.destinationRegion.selected.key,
                description: $scope.copySnapshot.description,
                encrypted: $scope.copySnapshot.encrypted,
                companyId: $scope.userData.companyId,
                region: $scope.region
            })
                .success(function (res) {
                    $scope.volume = {};
                    $scope.form.$setPristine();
                    CoreService.toastSuccess('Snapshot has been copied!');
                    $('#copySnapshot').modal('hide');
                    $('#copySnapshotBtn').text("COPY");
                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Failed to create volume ');

                    $('#copySnapshotBtn').text("COPY");
                    $scope.isProcessing = false;
                })

        };


        $scope.deleteSnapshot = function (item) {

            CoreService.confirm('Are you sure?', 'Deleting snapshot cannot be undone', function () {

                $http.post('api/Snapshots/deleteSnapshot?access_token=' + OUAuth.accessTokenId, {
                    snapshotId: item.SnapshotId,
                    companyId: $scope.userData.companyId,
                    region: $scope.region
                }).success(function (response) {
                    for (var i in $scope.data) {
                        if ($scope.data[i].SnapshotId == item.SnapshotId) {
                            $scope.data.splice(i, 1);
                            break;
                        }
                    }

                    $scope.tableParams.reload();
                    CoreService.toastSuccess('Snapshot deleted', 'Your snapshot has been deleted!');
                }).error(function (err) {
                    console.log(err);
                    if (err)
                        CoreService.toastError('Oops', 'Error deleting snapshot: ' + err);
                });
            }, function () {
                return false;
            });
        };

        $scope.deleteVolume = function (item) {
            CoreService.confirm('Are you sure?', 'Deleting volume cannot be undone', function () {

                $http.post('api/Volumes/deleteVolume?access_token=' + OUAuth.accessTokenId, {
                    volumeId: item.VolumeId,
                    companyId: $scope.userData.companyId,
                    region: $scope.region
                }).success(function (response) {
                    for (var i in $scope.data) {
                        if ($scope.data[i].VolumeId == item.VolumeId) {
                            $scope.data.splice(i, 1);
                            break;
                        }
                    }

                    $scope.tableParams.reload();
                    CoreService.toastSuccess('Volume deleted', 'Your volume has been deleted!');
                }).error(function (err) {
                    if (err)
                        CoreService.toastError('Oops', 'Error deleting volume: ' + err);
                });
            }, function () {
                return false;
            });
        };

        $scope.scheduleSnapshot = function () {
            $scope.snapshot = {};
            $scope.volumes = [];

            VolumeService.get($scope.userData.companyId, $scope.region).then(function (res) {

                if (res.data.Volumes) {
                    $scope.volumes = res.data.Volumes;
                } else {
                    for (var i = 0; i < res.data.length; i++) {
                        $scope.volumes.push(res.data[i].data);

                    }

                }
            }, function (err) {
                CoreService.toastError(err.message);

            });

            $('#scheduleSnapshot').modal('show');
        };


        $scope.startSchedulerName = {};
        $scope.saveSnapshot = function () {

            $scope.snapshot.region = $scope.region;
            $scope.snapshot.companyId = $scope.userData.companyId;


            if ($scope.startSchedulerName.selected) {
                $('#scheduleSnapshotBtn').text("Processing...");
                $scope.isProcessing = true;

                $scope.snapshot.createdDate = new Date();
                $scope.snapshot.startSchedulerName = $scope.startSchedulerName.selected.schedulerName;
                $scope.snapshot.volume = $scope.volume.selected.VolumeId;


                $http.post('api/Snapshots?access_token=' + OUAuth.accessTokenId, $scope.snapshot)
                    .success(function (res) {
                        $scope.snapshot = {};
                        CoreService.toastSuccess('Snapshot schedule', 'You snapshot is schedule ');
                        $('#scheduleSnapshot').modal('hide');
                        $('#scheduleSnapshotBtn').text("SAVE");
                        $scope.isProcessing = false;
                    }).error(function (err) {
                        console.log(err);
                        CoreService.toastError('Oops', 'Failed to schedule snapshot ');
                        $('#scheduleSnapshotBtn').text("SAVE");
                        $scope.isProcessing = false;
                    });
            } else {
                CoreService.alert('Please select scheduler name!')
            }

        };


        $scope.setVolumeId = function (ID) {
            $('#createSnapshot1').modal('show');
            $scope.snapshot = {};
            $scope.snapshot.volume = ID;
        };


        $scope.$on('changeRegion', function (event) {

            if ($location.path() == '/app/volumes') {
                $scope.descVolumes();
            }
            if ($location.path() == '/app/snapshot') {
                $scope.descSnapshots();
            }

        });
        $scope.$on('syncData', function (event) {

            if ($location.path() == '/app/volumes') {
                $scope.descVolumes();
            }
            if ($location.path() == '/app/snapshot') {
                $scope.descSnapshots();
            }

        });


    }

    ImageCtrl.$inject = ['$scope', '$http', '$location', 'CoreService', 'OUAuth', '$filter', 'NgTableParams', '$timeout', 'ImageService'];
    function ImageCtrl($scope, $http, $location, CoreService, OUAuth, $filter, NgTableParams, $timeout, ImageService) {

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);
        }

        if (window.sessionStorage.getItem('region') && window.sessionStorage.getItem('region') != 'us-east-1') {
            $scope.region = window.sessionStorage.getItem('region');
        } else {
            $scope.region = 'us-east-1';
        }

        $scope.descImages = function () {
            $scope.data = [];

            $scope.loading = true;

            $scope.region = window.sessionStorage.getItem('region');
            loadImages($scope.region);

        };

        function loadImages(region) {


            ImageService.get($scope.userData.companyId, region).then(function (res) {

                $scope.data = res.data.Images;
                initiateNgTable();
                $timeout(function () {
                    $scope.tableParams.reload();
                    $scope.loading = false;
                }, 750)

            }, function (err) {
                CoreService.toastError(err.message);
                $scope.loading = false;
            });

        }

        $scope.countVal = 10;
        function initiateNgTable() {
            $scope.tableParams = new NgTableParams({
                page: 1,            // show first page
                count: 10,          // count per page
                sorting: {
                    name: 'asc'     // initial sorting
                }
            }, {
                counts: [],
                total: $scope.data.length, // length of data
                getData: function ($defer, params) {


                    // use build-in angular filter
                    var orderedData = params.sorting() ?
                        $filter('orderBy')($scope.data, params.orderBy()) :
                        $scope.data;
                    orderedData = params.filter() ?
                        $filter('filter')(orderedData, params.filter()) :
                        orderedData;

                    params.total($scope.data.length); // set total for recalc pagination

                    if (((params.page() * params.count()) - params.count()) === params.total()) {
                        params.page(params.page() - 1);
                    }

                    orderedData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());


                    $defer.resolve(orderedData);
                },
                $scope: $scope
            });
        }

        $scope.setCount = function (nbr) {

            return $scope.tableParams.count(nbr);
        };


        $scope.$on('changeRegion', function (event) {

            if ($location.path() == '/app/images') {
                $scope.descImages();
            }


        });
    }

    SaveScheduleCtrl.$inject = ['$scope', '$rootScope', '$http', 'CoreService', 'OUAuth'];
    function SaveScheduleCtrl($scope, $rootScope, $http, CoreService, OUAuth) {


        $scope.CREATED_SNAPSHOT_SCHEDULER_TOOLTIP = {title: 'Select Date and time to run schedule for creating snapshots'};

        $scope.DELETE_SNAPSHOT_SCHEDULER_TOOLTIP = {title: 'Select Date and time to run schedule for deleting snapshot older than given time period'};


        $scope.scheduler = {};
        $scope.scheduler.startDay = {};
        $scope.scheduler.stopDay = {};

        $scope.reset = function () {
            $scope.scheduler.schedulerName = '';
            $scope.saveSchedulerError = '';

            $scope.scheduler.startDay.monday = true;
            $scope.scheduler.startDay.tuesday = true;
            $scope.scheduler.startDay.wednesday = true;
            $scope.scheduler.startDay.thursday = true;
            $scope.scheduler.startDay.friday = true;
            $scope.scheduler.startDay.saturday = true;
            $scope.scheduler.startDay.sunday = true;


            $scope.scheduler.stopDay.monday = true;
            $scope.scheduler.stopDay.tuesday = true;
            $scope.scheduler.stopDay.wednesday = true;
            $scope.scheduler.stopDay.thursday = true;
            $scope.scheduler.stopDay.friday = true;
            $scope.scheduler.stopDay.saturday = true;
            $scope.scheduler.stopDay.sunday = true;

            $scope.scheduler.startTime = '';
            $scope.scheduler.stopTime = '';

            $scope.scheduler.olderThanNum = '1';
            $scope.scheduler.olderThanString = 'day';

            $scope.caption = 'CREATE';

            if ($scope.form) {
                $scope.form.$setPristine();
            }
        };

        $scope.reset();

        $rootScope.setInstanceScheduler = function (item) {
            $('#instanceScheduler').modal('show');

            if (item) {

                var offset = new Date().getTimezoneOffset();

                $scope.scheduler.schedulerName = item.schedulerName;
                $scope.caption = 'UPDATE';
                if (item.startScheduleExp) {

                    var time = item.startScheduleExp.substring(3, item.startScheduleExp.indexOf('m') + 1);
                    $scope.startHour = (time.substring(0, time.indexOf(':'))).trim();
                    $scope.startMinute = (time.substring(time.indexOf(':') + 1, time.indexOf(':') + 3)).trim();
                    $scope.startPeriod = (time.substring(time.indexOf(':') + 3)).trim();


                    if (item.startScheduleExp.indexOf('Monday') > -1) {
                        $scope.scheduler.startDay.monday = false;
                    }
                    if (item.startScheduleExp.indexOf('Tuesday') > -1) {
                        $scope.scheduler.startDay.tuesday = false;
                    }
                    if (item.startScheduleExp.indexOf('Wednesday') > -1) {
                        $scope.scheduler.startDay.wednesday = false;
                    }
                    if (item.startScheduleExp.indexOf('Thursday') > -1) {
                        $scope.scheduler.startDay.thursday = false;
                    }
                    if (item.startScheduleExp.indexOf('Friday') > -1) {
                        $scope.scheduler.startDay.friday = false;
                    }
                    if (item.startScheduleExp.indexOf('Saturday') > -1) {
                        $scope.scheduler.startDay.saturday = false;
                    }
                    if (item.startScheduleExp.indexOf('Sunday') > -1) {
                        $scope.scheduler.startDay.sunday = false;
                    }

                    if ($scope.startPeriod == 'pm') {
                        $scope.startHour = parseInt($scope.startHour) + 12;
                    }
                    var d = new Date();
                    d.setUTCHours($scope.startHour);
                    d.setUTCMinutes($scope.startMinute);

                    $scope.scheduler.startTime = d;

                }

                if (item.stopScheduleExp) {

                    var time1 = item.stopScheduleExp.substring(3, item.stopScheduleExp.indexOf('m') + 1);
                    $scope.stopHour = (time1.substring(0, time1.indexOf(':'))).trim();
                    $scope.stopMinute = (time1.substring(time1.indexOf(':') + 1, time1.indexOf(':') + 3)).trim();
                    $scope.stopPeriod = (time1.substring(time1.indexOf(':') + 3)).trim();


                    if (item.stopScheduleExp.indexOf('Monday') > -1) {
                        $scope.scheduler.stopDay.monday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Tuesday') > -1) {
                        $scope.scheduler.stopDay.tuesday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Wednesday') > -1) {
                        $scope.scheduler.stopDay.wednesday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Thursday') > -1) {
                        $scope.scheduler.stopDay.thursday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Friday') > -1) {
                        $scope.scheduler.stopDay.friday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Saturday') > -1) {
                        $scope.scheduler.stopDay.saturday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Sunday') > -1) {
                        $scope.scheduler.stopDay.sunday = false;
                    }

                    if ($scope.stopPeriod == 'pm') {
                        $scope.stopHour = parseInt($scope.stopHour) + 12;
                    }
                    var d1 = new Date();
                    d1.setUTCHours($scope.stopHour);
                    d1.setUTCMinutes($scope.stopMinute);

                    $scope.scheduler.stopTime = d1;

                }
            }
        };

        $rootScope.setSnapshotScheduler = function (item) {
            $('#createSnapshotScheduler').modal('show');

            if (item) {
                var offset = new Date().getTimezoneOffset();

                $scope.scheduler.schedulerName = item.schedulerName;
                $scope.caption = 'UPDATE';
                if (item.startScheduleExp) {
                    var time = item.startScheduleExp.substring(3, item.startScheduleExp.indexOf('m') + 1);
                    $scope.startHour = (time.substring(0, time.indexOf(':'))).trim();
                    $scope.startMinute = (time.substring(time.indexOf(':') + 1, time.indexOf(':') + 3)).trim();
                    $scope.startPeriod = (time.substring(time.indexOf(':') + 3)).trim();


                    if (item.startScheduleExp.indexOf('Monday') > -1) {
                        $scope.scheduler.startDay.monday = false;
                    }
                    if (item.startScheduleExp.indexOf('Tuesday') > -1) {
                        $scope.scheduler.startDay.tuesday = false;
                    }
                    if (item.startScheduleExp.indexOf('Wednesday') > -1) {
                        $scope.scheduler.startDay.wednesday = false;
                    }
                    if (item.startScheduleExp.indexOf('Thursday') > -1) {
                        $scope.scheduler.startDay.thursday = false;
                    }
                    if (item.startScheduleExp.indexOf('Friday') > -1) {
                        $scope.scheduler.startDay.friday = false;
                    }
                    if (item.startScheduleExp.indexOf('Saturday') > -1) {
                        $scope.scheduler.startDay.saturday = false;
                    }
                    if (item.startScheduleExp.indexOf('Sunday') > -1) {
                        $scope.scheduler.startDay.sunday = false;
                    }
                    var d = new Date();
                    d.setUTCHours($scope.startHour);
                    d.setUTCMinutes($scope.startMinute);

                    $scope.scheduler.startTime = d;

                }

                if (item.stopScheduleExp) {

                    var time1 = item.stopScheduleExp.substring(3, item.stopScheduleExp.indexOf('m') + 1);
                    $scope.stopHour = (time1.substring(0, time1.indexOf(':'))).trim();
                    $scope.stopMinute = (time1.substring(time1.indexOf(':') + 1, time1.indexOf(':') + 3)).trim();
                    $scope.stopPeriod = (time1.substring(time1.indexOf(':') + 3)).trim();


                    if (item.stopScheduleExp.indexOf('Monday') > -1) {
                        $scope.scheduler.stopDay.monday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Tuesday') > -1) {
                        $scope.scheduler.stopDay.tuesday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Wednesday') > -1) {
                        $scope.scheduler.stopDay.wednesday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Thursday') > -1) {
                        $scope.scheduler.stopDay.thursday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Friday') > -1) {
                        $scope.scheduler.stopDay.friday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Saturday') > -1) {
                        $scope.scheduler.stopDay.saturday = false;
                    }
                    if (item.stopScheduleExp.indexOf('Sunday') > -1) {
                        $scope.scheduler.stopDay.sunday = false;
                    }

                    var d1 = new Date();
                    d1.setUTCHours($scope.stopHour);
                    d1.setUTCMinutes($scope.stopMinute);

                    $scope.scheduler.stopTime = d1;
                    if (item.deleteOtherThan) {

                        if (item.deleteOtherThan < 31 && item.deleteOtherThan > 0) {
                            $scope.scheduler.olderThanNum = item.deleteOtherThan;
                            $scope.scheduler.olderThanString = 'day';
                        }
                        else if (item.deleteOtherThan < 211 && item.deleteOtherThan > 30) {
                            $scope.scheduler.olderThanNum = parseInt(item.deleteOtherThan) / 7;
                            $scope.scheduler.olderThanString = 'week';

                        }
                        else if (item.deleteOtherThan < 901 && item.deleteOtherThan > 210) {
                            $scope.scheduler.olderThanNum = parseInt(item.deleteOtherThan) / 30;
                            $scope.scheduler.olderThanString = 'month';
                        }
                        else if (item.deleteOtherThan > 900) {
                            $scope.scheduler.olderThanNum = parseInt(item.deleteOtherThan) / 365;
                            $scope.scheduler.olderThanString = 'year';
                        }
                        else {
                            $scope.scheduler.olderThanNum = '00';
                            $scope.scheduler.olderThanString = 'day';
                        }
                    }

                }
            }

        };

        $scope.saveScheduler = function (update) {

            $scope.saveSchedulerError = '';

            // for start instance

            $scope.startDays = 0;
            $scope.startExceptDays = '';

            $scope.scheduleDetails = {};

            if (($scope.scheduler.startTime) && ($scope.scheduler.startDay.monday || $scope.scheduler.startDay.tuesday || $scope.scheduler.startDay.wednesday || $scope.scheduler.startDay.thursday
                || $scope.scheduler.startDay.friday || $scope.scheduler.startDay.saturday || $scope.scheduler.startDay.sunday)) {

                if ($scope.scheduler.startDay.monday) {
                    $scope.startDays++;
                } else {
                    $scope.startExceptDays = $scope.startExceptDays + ' on Monday';
                }
                if ($scope.scheduler.startDay.tuesday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Tuesday';
                }
                if ($scope.scheduler.startDay.wednesday) {
                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Wednesday';
                }
                if ($scope.scheduler.startDay.thursday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Thursday';
                }
                if ($scope.scheduler.startDay.friday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Friday';
                }
                if ($scope.scheduler.startDay.saturday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Saturday';
                }
                if ($scope.scheduler.startDay.sunday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Sunday';
                }


                var date = moment.utc($scope.scheduler.startTime);

                var hours = date.hours();
                var minutes = date.minutes();

                var ampm = hours >= 12 || hours == 0 ? 'pm' : 'am';

                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;
                var strTime = hours + ':' + minutes + ' ' + ampm;


                if ($scope.startDays == 7) {


                    $scope.scheduleDetails.startScheduleExp = 'at ' + strTime;
                } else {
                    $scope.scheduleDetails.startScheduleExp = 'at ' + strTime + ' except' + $scope.startExceptDays;
                }

            }
            // for stop instance

            $scope.stopDays = 0;
            $scope.stopExceptDays = '';

            if (($scope.scheduler.stopTime) && ($scope.scheduler.stopDay.monday || $scope.scheduler.stopDay.tuesday || $scope.scheduler.stopDay.wednesday || $scope.scheduler.stopDay.thursday
                || $scope.scheduler.stopDay.friday || $scope.scheduler.stopDay.saturday || $scope.scheduler.stopDay.sunday)) {


                if ($scope.scheduler.stopDay.monday) {

                    $scope.stopDays++;
                } else {
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Monday';
                }
                if ($scope.scheduler.stopDay.tuesday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }

                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Tuesday';
                }
                if ($scope.scheduler.stopDay.wednesday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Wednesday';
                }
                if ($scope.scheduler.stopDay.thursday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Thursday';
                }
                if ($scope.scheduler.stopDay.friday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Friday';
                }
                if ($scope.scheduler.stopDay.saturday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Saturday';
                }
                if ($scope.scheduler.stopDay.sunday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Sunday';
                }

                var date1 = moment.utc($scope.scheduler.stopTime);

                var hours1 = date1.hours();
                var minutes1 = date1.minutes();

                var ampm1 = hours1 >= 12 || hours1 == 0 ? 'pm' : 'am';

                hours1 = hours1 % 12;
                hours1 = hours1 ? hours1 : 12; // the hour '0' should be '12'
                minutes1 = minutes1 < 10 ? '0' + minutes1 : minutes1;
                var strTime1 = hours1 + ':' + minutes1 + ' ' + ampm1;
                if ($scope.stopDays == 7) {
                    $scope.scheduleDetails.stopScheduleExp = 'at ' + strTime1;
                } else {
                    $scope.scheduleDetails.stopScheduleExp = 'at ' + strTime1 + ' except' + $scope.stopExceptDays;
                }

            }
            if ($scope.scheduleDetails.startScheduleExp && $scope.scheduleDetails.stopScheduleExp) {

                $scope.scheduleDetails.companyId = $scope.userData.companyId;
                $scope.scheduleDetails.schedulerName = $scope.scheduler.schedulerName;
                if (update == 'CREATE') {
                    $scope.scheduleDetails.createdBy = $scope.userData.email;
                } else {
                    $scope.scheduleDetails.updatedBy = $scope.userData.email;
                }


                $http.post('api/Schedulers/saveScheduler?access_token=' + OUAuth.accessTokenId, {obj: $scope.scheduleDetails})
                    .success(function (res) {

                        if (update == 'CREATE') {
                            CoreService.toastSuccess('Your scheduler is saved successfully!');

                        } else {
                            CoreService.toastSuccess('Your scheduler is updated successfully!');
                        }
                        $rootScope.$broadcast('saveSchedulerDetail', res.data, update);
                        $('#instanceScheduler').modal('hide');
                        $scope.scheduler = {};
                        $scope.scheduler.startDay = {};
                        $scope.scheduler.stopDay = {};
                        $scope.form.$setPristine();
                        $scope.reset();
                    }).error(function (err) {
                        console.log(err);
                        CoreService.toastError('Oops', 'Failed to saving or updating scheduler!');
                    })

            } else {
                $scope.saveSchedulerError = 'Please defined both scheduler time!';
            }
        };

        $scope.saveSnapshotScheduler = function (update) {

            $scope.saveSchedulerError = '';

            // for start instance

            $scope.startDays = 0;
            $scope.startExceptDays = '';


            $scope.scheduleDetails = {};


            if (($scope.scheduler.startTime) && ($scope.scheduler.startDay.monday || $scope.scheduler.startDay.tuesday || $scope.scheduler.startDay.wednesday || $scope.scheduler.startDay.thursday
                || $scope.scheduler.startDay.friday || $scope.scheduler.startDay.saturday || $scope.scheduler.startDay.sunday)) {


                if ($scope.scheduler.startDay.monday) {
                    $scope.startDays++;
                } else {
                    $scope.startExceptDays = $scope.startExceptDays + ' on Monday';
                }
                if ($scope.scheduler.startDay.tuesday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Tuesday';
                }
                if ($scope.scheduler.startDay.wednesday) {
                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Wednesday';
                }
                if ($scope.scheduler.startDay.thursday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Thursday';
                }
                if ($scope.scheduler.startDay.friday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Friday';
                }
                if ($scope.scheduler.startDay.saturday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Saturday';
                }
                if ($scope.scheduler.startDay.sunday) {

                    $scope.startDays++;
                } else {
                    if ($scope.startExceptDays) {
                        $scope.startExceptDays = $scope.startExceptDays + ' also'
                    }
                    $scope.startExceptDays = $scope.startExceptDays + ' on Sunday';
                }


                var date = moment.utc($scope.scheduler.startTime);

                var hours = date.hours();
                var minutes = date.minutes();

                var ampm = hours >= 12 || hours == 0 ? 'pm' : 'am';

                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;
                var strTime = hours + ':' + minutes + ' ' + ampm;


                if ($scope.startDays == 7) {


                    $scope.scheduleDetails.startScheduleExp = 'at ' + strTime;
                } else {
                    $scope.scheduleDetails.startScheduleExp = 'at ' + strTime + ' except' + $scope.startExceptDays;
                }

            }
            // for stop instance

            $scope.stopDays = 0;
            $scope.stopExceptDays = '';

            if (($scope.scheduler.stopTime) && ($scope.scheduler.stopDay.monday || $scope.scheduler.stopDay.tuesday || $scope.scheduler.stopDay.wednesday || $scope.scheduler.stopDay.thursday
                || $scope.scheduler.stopDay.friday || $scope.scheduler.stopDay.saturday || $scope.scheduler.stopDay.sunday)) {

                if ($scope.scheduler.stopDay.monday) {

                    $scope.stopDays++;
                } else {
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Monday';
                }
                if ($scope.scheduler.stopDay.tuesday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }

                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Tuesday';
                }
                if ($scope.scheduler.stopDay.wednesday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Wednesday';
                }
                if ($scope.scheduler.stopDay.thursday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Thursday';
                }
                if ($scope.scheduler.stopDay.friday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Friday';
                }
                if ($scope.scheduler.stopDay.saturday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Saturday';
                }
                if ($scope.scheduler.stopDay.sunday) {

                    $scope.stopDays++;
                } else {
                    if ($scope.stopExceptDays) {
                        $scope.stopExceptDays = $scope.stopExceptDays + ' also'
                    }
                    $scope.stopExceptDays = $scope.stopExceptDays + ' on Sunday';
                }


                var date1 = moment.utc($scope.scheduler.stopTime);

                var hours1 = date1.hours();
                var minutes1 = date1.minutes();

                var ampm1 = hours1 >= 12 || hours1 == 0 ? 'pm' : 'am';

                hours1 = hours1 % 12;
                hours1 = hours1 ? hours1 : 12; // the hour '0' should be '12'
                minutes1 = minutes1 < 10 ? '0' + minutes1 : minutes1;
                var strTime1 = hours1 + ':' + minutes1 + ' ' + ampm1;
                if ($scope.stopDays == 7) {
                    $scope.scheduleDetails.stopScheduleExp = 'at ' + strTime1;
                } else {
                    $scope.scheduleDetails.stopScheduleExp = 'at ' + strTime1 + ' except' + $scope.stopExceptDays;
                }
                var time = 0;

                if ($scope.scheduler.olderThanString == 'day') {
                    time = parseInt($scope.scheduler.olderThanNum);
                }
                else if ($scope.scheduler.olderThanString == 'week') {
                    time = parseInt($scope.scheduler.olderThanNum) * 7;
                }
                else if ($scope.scheduler.olderThanString == 'month') {
                    time = parseInt($scope.scheduler.olderThanNum) * 30;
                } else {
                    time = parseInt($scope.scheduler.olderThanNum) * 365;
                }

                $scope.scheduleDetails.deleteOtherThan = time;

            }
            if ($scope.scheduleDetails.startScheduleExp || $scope.scheduleDetails.stopScheduleExp) {

                $scope.scheduleDetails.companyId = $scope.userData.companyId;
                $scope.scheduleDetails.schedulerName = $scope.scheduler.schedulerName;
                if (update == 'CREATE') {
                    $scope.scheduleDetails.createdBy = $scope.userData.email;
                } else {
                    $scope.scheduleDetails.updatedBy = $scope.userData.email;
                }


                $http.post('api/Schedulers/saveSnapshotScheduler?access_token=' + OUAuth.accessTokenId, {obj: $scope.scheduleDetails})
                    .success(function (res) {

                        if (update == 'CREATE') {
                            CoreService.toastSuccess('Your scheduler is saved successfully!');

                        } else {
                            CoreService.toastSuccess('Your scheduler is updated successfully!');
                        }
                        $rootScope.$broadcast('saveSchedulerDetail', res.data, update);
                        $('#createSnapshotScheduler').modal('hide');
                        $scope.scheduler = {};
                        $scope.scheduler.startDay = {};
                        $scope.scheduler.stopDay = {};
                        $scope.form.$setPristine();
                        $scope.reset();
                    }).error(function (err) {
                        console.log(err);
                        CoreService.toastError('Oops', 'Failed to saving or updating scheduler!');
                    });

            } else {
                $scope.saveSchedulerError = 'Please defined atleast one scheduler time!';
            }
        };


        $scope.checkName = function (type, caption) {
            $scope.alreadyExit = '';
            if ($scope.schedulerName && caption == 'CREATE') {
                $http.get('api/Schedulers?filter[where][schedulerName] =' + $scope.schedulerName + '&filter[where][companyId] =' + $scope.userData.companyId + '&filter[where][schedulerType]=' + type + '&access_token=' + OUAuth.accessTokenId)
                    .success(function (res) {
                        if (res && res.length > 0) {
                            $scope.alreadyExit = 'Scheduler name already exist'
                        }

                    });
            }
        }

    }

})();
