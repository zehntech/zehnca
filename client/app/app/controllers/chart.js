// code style: https://github.com/johnpapa/angular-styleguide 

(function () {
    'use strict';
    angular
        .module('app')
        .controller('ChartCtrl', Chart);

    Chart.$inject = ['$scope', 'DashboardService', 'OUAuth', '$q', '$filter', 'InstanceService', 'SnapshotService', 'ScheduleService', 'VolumeService', 'SchedulerService','$state','$http'];
    function Chart($scope, DashboardService, OUAuth, $q, $filter, InstanceService, SnapshotService, ScheduleService, VolumeService, SchedulerService,$state,$http) {
        var vm = $scope;
        vm.fromDate = new Date();
        vm.untilDate = new Date();
        vm.untilDate.setDate(vm.fromDate.getDate() + 7);
        if (OUAuth.currentUserData) {
            vm.userData = JSON.parse(OUAuth.currentUserData);
        }
        $scope.data1 = [];
        var objectModel;
        var dataToRemove;
        $scope.options = {
            headers: ['month', 'day', 'hour'],
            scale: '1 hour',
            sideMode: 'TreeTable',
            treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',
            columnsHeaders: {'model.name': 'Name', 'from': 'From', 'to': 'To'},
            groupDisplayMode: 'promote',
            readOnly: false,
            width: true,
            zoom: 1,
            columnsClasses: {'model.name': 'gantt-column-name', 'from': 'gantt-column-from', 'to': 'gantt-column-to'},
            columnsFormatters: {
                'from': function (from) {
                    return from !== undefined ? from.format('lll') : undefined;
                },
                'to': function (to) {
                    return to !== undefined ? to.format('lll') : undefined;
                }
            },
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                'from': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'to': '<i class="fa fa-calendar"></i> {{getHeader()}}'
            },

            treeTableColumns: ['model.name', 'from', 'to'],
            mode: 'custom',

            sortMode: undefined,

            daily: false,
            maxHeight: false,


            columns: ['model.name', 'from', 'to'],

            autoExpand: 'none',
            taskOutOfRange: 'truncate',
            fromDate: moment(null),
            toDate: undefined,
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
            taskContent: '<i class="fa fa-tasks"></i> {{task.model.name}}',
            allowSideResizing: true,
            labelsEnabled: true,
            draw: false,
            filterTask: '',
            filterRow: '',

            columnMagnet: '15 minutes',
            timeFramesMagnet: true,
            canDraw: function (event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
            },
            drawTaskFactory: function () {
                return {
                    id: utils.randomUuid(),  // Unique id of the task.
                    name: 'Drawn task', // Name shown on top of each task.
                    color: '#AA8833' // Color of the task in HEX format (Optional).
                };
            }


        }


        $scope.headersFormats = {
            'year': 'YYYY',
            'quarter': '[Q]Q YYYY',
            month: 'MMMM YYYY',
            week: 'w',
            day: 'D MMM YY',
            hour: 'H',
            minute: 'HH:mm'
        };


        vm.changed = function () {
            console.log('Changed ' + vm.fromDate);
            vm.getInstances2();
        }

        vm.getName = function (instance) {
            if (instance.data && instance.data.Tags && instance.data.Tags[0] && instance.data.Tags[0].value) {
                return instance.instanceId + '(' + instance.data.Tags[0].value + ')';
            }
            return instance.instanceId;
        }
        vm.populateGanttData = function (arr) {
            console.log('Instances ' + JSON.stringify(arr));
            var deferred = $q.defer();
            vm.data1 = [];
            var processedRegions = [];
            vm.parents = [];
            var instanceCount = 0;
           var processedInstances=[];
            function getInstances() {
                var row = {};

                var instance = arr[instanceCount];

                var index = processedRegions.indexOf(instance.instanceRegion);
                var instanceIndex = processedInstances.indexOf(vm.getName(instance));


                if (index < 0) {
                    var parent = {};
                    parent.name = instance.instanceRegion;
                    parent.content = " {{row.model.name}}";
                    parent.id = 'c3ed1096-e777-f304-4f3a-19fa8b6c7a48';
                    vm.data1.push(parent);
                    processedRegions.push(instance.instanceRegion);
                }

                if (instanceIndex > 0) {
                    getStoredRow();
                } else {
                    row.name = vm.getName(instance);
                    row.height = '3em';
                    row.sortable = false;
                    row.calsses = 'gantt-row-milestone';
                    row.color = '#f5f7fa';
                    row.tasks = [];
                    row.parent = instance.instanceRegion;
                    $scope.data1.push(row);
                    instanceCount++;

                    nextOccurrence();
                }


                function getStoredRow() {
                    var rowNum = 0;

                    function checkRow() {
                        var storedRow = vm.data1[rowNum];
                        if (storedRow.name === vm.getName(instance)) {
                            row = storedRow;
                            nextOccurrence();
                        } else if (rowNum < vm.data1.length - 1) {
                            rowNum++;
                            checkRow();
                        }
                    }
                }

                function nextOccurrence() {
                    DashboardService.getNextOccurrencesByName(instance, 3).then(function (response2) {

                        populateSchedules(response2, row);
                    })
                }
            }

            function populateSchedules(schedules, row) {
                console.log('Schedules ' + JSON.stringify(schedules));
                var scheduleCount = 0;
                var firstStart = schedules.data.start[0];
                var firstStop = schedules.data.stop[0];
                var taskType = 'Running';

                if (new Date(firstStop).getTime() < new Date(firstStart).getTime()) {
                    taskType = 'Stopped';
                }
                var iteration = 0;
                    var startIndex=0;
                var stopIndex=0;
                function getSchedules() {
                    console.log('Now ' + taskType);

                    var item = {};
                    item.color = '#93C47D';
                    if(taskType === 'Running' && iteration>0){
                        stopIndex++;
                          var from = schedules.data.start[startIndex];
                    var to = schedules.data.stop[stopIndex];



                    item.name = $filter('date')(from, 'hh:mm a') + ' to ' + $filter('date')(to, 'hh:mm a');

                    item.from = from;
                    item.to = to;

                        row.tasks.push(item);


                    }else if(taskType === 'Stopped' && iteration>0){
                        startIndex++;
                    }


                    if (taskType === 'Running') {
                        taskType = 'Stopped';
                    } else {
                        taskType = 'Running';
                    }
                    iteration = 1;
                    if (startIndex < schedules.data.start.length && stopIndex < schedules.data.stop.length) {
                        getSchedules();
                    } else if (instanceCount < arr.length) {
                        getInstances();
                    } else if (instanceCount === arr.length) {
                        deferred.resolve($scope.data1);
                    }
                }

                getSchedules();
            }



            getInstances();
            return deferred.promise;
        }

        vm.getInstances2 = function () {
            ScheduleService.scheduleInstance($scope.userData.companyId).then(function (response1) {

                vm.totalScheduleInstance = response1.length;
                if (response1.length > 0) {

                    vm.populateGanttData(response1).then(function (data) {
                        $scope.data4 = data;

                        console.log('Data4 ' + JSON.stringify($scope.data4));
                    }, function (err) {

                    });
                } else {
                    return;
                }
            })

        }


        vm.getInstances2();


        InstanceService.get(vm.userData.companyId, 'all').then(function (response) {
            vm.totalInstances = response.data.length;
        }, function (err) {
            console.log(err);
        });

        SnapshotService.get(vm.userData.companyId, 'all').then(function (response) {
            vm.totalSnapshots = response.data.length;
        }, function (err) {
            console.log(err);
        });

        VolumeService.get(vm.userData.companyId, 'all').then(function (response) {
            vm.totalVolumes = response.data.length;
        }, function (err) {
            console.log(err);
        });


        DashboardService.getUsers(vm.userData.companyId).then(function (response) {
            vm.totalUsers = response.length;
        }, function (err) {
            console.log(err);
        });


        DashboardService.getStatus(vm.userData.companyId).then(function (response) {
            vm.p_p_3;
            var failure=0, success=0;
            angular.forEach(response, function (value, index) {
                if(value.result == 'failure'){
                    failure = failure+1;
                    console.log('failure '+failure)
                }else{
                    success = success+1;
                     console.log('success '+success)
                }

            })
            
            vm.p_p_3 = [{data: failure, label: 'Failure'}, {data: success, label: 'Success'}];

        }, function (err) {
            console.log(err);
        });

        ScheduleService.scheduleSnapshot(vm.userData.companyId).then(function (response) {
            vm.totalScheduleSnapshot = response.length;
        }, function (err) {
            console.log(err);
        });

        SchedulerService.schInstance(vm.userData.companyId).then(function (response) {
            vm.totalInstanceScheduler = response.length;
        }, function (err) {
            console.log(err);
        });


        SchedulerService.schSnapshot(vm.userData.companyId).then(function (response) {
            vm.totalSnapshotScheduler = response.length;
        }, function (err) {
            console.log(err);
        });


        vm.p_l_1 = [[1, 6.1], [2, 6.3], [3, 6.4], [4, 6.6], [5, 7.0], [6, 7.7], [7, 8.3]];
        vm.p_l_2 = [[1, 5.5], [2, 5.7], [3, 6.4], [4, 7.0], [5, 7.2], [6, 7.3], [7, 7.5]];

    }

})();
