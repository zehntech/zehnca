/**
 * Created by sourabhagrawal on 29/10/15.
 */
(function () {
    'use strict';
    angular.module('app')
        .controller('LogCtrl', LogCtrl)
        .controller('InstanceLogCtrl', InstanceLogCtrl)
        .controller('SnapshotLogCtrl', SnapshotLogCtrl);


    LogCtrl.$inject = ['$scope', '$http', 'OUAuth', '$rootScope', '$location'];
    function LogCtrl($scope, $http, OUAuth, $rootScope, $location) {

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);
        }


        $scope.filter = {};
        $scope.filter.create = true;
        $scope.filter.delete = true;
        $scope.filter.start = true;
        $scope.filter.stop = true;
        $scope.filter.failure = true;
        $scope.filter.success = true;

        $scope.filter.fromDate = new Date();

        $scope.filter.fromDate.setDate(new Date().getDate() - 7);
        $scope.filter.untilDate = new Date();

        $scope.regions = $rootScope.regions;


        $scope.filter.region = {};
        $scope.filter.region.selected = [$scope.regions[0], $scope.regions[1], $scope.regions[2], $scope.regions[3], $scope.regions[5], $scope.regions[4], $scope.regions[6], $scope.regions[7]];

        $scope.$on('$stateChangeSuccess', function () {
            if ($location.path() == '/app/log/instance') {
                $scope.state = 'instanceState';
            } else {
                $scope.state = 'snapshotState';
            }
        })


        $scope.openFile = function (path) {
            $('#open').modal('show');
            $http.get('api/Loggers/openFile?file=' + path + '&access_token=' + OUAuth.accessTokenId)
                .success(function (res) {

                    $scope.content = res;

                }).error(function (err) {
                    console.log(err);
                });
        }

        $scope.load = function () {
            $rootScope.$broadcast('load');
        }
    }

    InstanceLogCtrl.$inject = ['$scope', '$http', 'CoreService', 'OUAuth', '$filter', 'NgTableParams', '$timeout'];
    function InstanceLogCtrl($scope, $http, CoreService, OUAuth, $filter, NgTableParams, $timeout) {

        $scope.countVal = 10;


        $scope.load = function () {

            $scope.loading = true;

            var queryUrl = 'api/Loggers?filter[where][companyId]=' + $scope.userData.companyId + '&filter[where][logType]=instance&access_token=' + OUAuth.accessTokenId;

            if ($scope.filter.start && $scope.filter.stop) {
                queryUrl += '&filter[where][event][inq]=start&filter[where][event][inq]=stop';
            }
            else if ($scope.filter.start) {
                queryUrl += '&filter[where][event]=start';
            }
            else if ($scope.filter.stop) {
                queryUrl += '&filter[where][event]=stop';
            }
            if ($scope.filter.failure && $scope.filter.success) {
                queryUrl += '&filter[where][result][inq]=failure&filter[where][result][inq]=success';
            }
            else if ($scope.filter.failure) {
                queryUrl += '&filter[where][result]=failure';
            }
            else if ($scope.filter.success) {
                queryUrl += '&filter[where][result]=success';
            }

            if ($scope.filter.region.selected.length > 1) {
                angular.forEach($scope.filter.region.selected, function (value) {

                    queryUrl += '&filter[where][region][inq]=' + value.key;
                })
            } else {
                queryUrl += '&filter[where][region]=' + $scope.filter.region.selected[0].key;
            }

            if ($scope.filter.fromDate) {
                queryUrl += '&filter[where][and][0][createdAt][gt]=' + $scope.filter.fromDate;
            }
            if ($scope.filter.untilDate) {
                queryUrl += '&filter[where][and][1][createdAt][lt]=' + $scope.filter.untilDate;
            }


            $http.get(queryUrl)
                .success(function (res) {
                    $scope.data = res;
                    $scope.tableParams = {};

                    $scope.tableParams = new NgTableParams({
                        page: 1,            // show first page
                        count: 10,          // count per page
                        sorting: {
                            name: 'asc'     // initial sorting
                        }
                    }, {
                        counts: [],
                        total: function () {
                            return $scope.data.length;
                        }, // length of data
                        getData: function ($defer, params) {
                            var data = $scope.data;
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
                        $scope : $scope
                    });

                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Error in retrieving logs')
                }).finally(function () {
                    $scope.loading = false;

                });
        };

        $scope.load();


        $scope.$on('load', function () {
            $scope.load();
        });


        $scope.$watch('data', function () {

            if ($scope.tableParams) {
                $scope.tableParams.settings().$scope = $scope;
               $timeout(function(){  $scope.tableParams.reload();},700);
            }
        });
    }

    SnapshotLogCtrl.$inject = ['$scope', '$http', 'CoreService', 'OUAuth', '$filter', 'NgTableParams', '$timeout'];
    function SnapshotLogCtrl($scope, $http, CoreService, OUAuth, $filter, NgTableParams, $timeout) {

        $scope.data = [];
        $scope.countVal = 10;


        $scope.load = function () {

            $scope.loading = true;

            var queryUrl = 'api/Loggers?filter[where][companyId]=' + $scope.userData.companyId + '&filter[where][logType]=snapshot&access_token=' + OUAuth.accessTokenId;

            if ($scope.filter.create && $scope.filter.delete) {
                queryUrl += '&filter[where][event][inq]=create&filter[where][event][inq]=delete';
            }
            else if ($scope.filter.create) {
                queryUrl += '&filter[where][event]=create';
            }
            else if ($scope.filter.delete) {
                queryUrl += '&filter[where][event]=delete';
            }
            if ($scope.filter.failure && $scope.filter.success) {
                queryUrl += '&filter[where][result][inq]=failure&filter[where][result][inq]=success';
            }
            else if ($scope.filter.failure) {
                queryUrl += '&filter[where][result]=failure';
            }
            else if ($scope.filter.success) {
                queryUrl += '&filter[where][result]=success';
            }
            if ($scope.filter.fromDate) {
                queryUrl += '&filter[where][and][0][createdAt][gt]=' + $scope.filter.fromDate;
            }
            if ($scope.filter.untilDate) {
                queryUrl += '&filter[where][and][1][createdAt][lt]=' + $scope.filter.untilDate;
            }
            if ($scope.filter.region.selected.length > 1) {
                angular.forEach($scope.filter.region.selected, function (value) {

                    queryUrl += '&filter[where][region][inq]=' + value.key;
                })
            } else {
                queryUrl += '&filter[where][region]=' + $scope.filter.region.selected[0].key;
            }


            $http.get(queryUrl)
                .success(function (res) {
                    $scope.data = res;
                    $scope.tableParams = {};

                    $scope.tableParams = new NgTableParams({
                        page: 1,            // show first page
                        count: 10,          // count per page
                        sorting: {
                            name: 'asc'     // initial sorting
                        }
                    }, {
                        counts: [],
                        total: function () {
                            return $scope.data.length;
                        }, // length of data
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
                        }
                    });

                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Error in retrieving logs')
                }).finally(function () {
                    $scope.loading = false;
                });
        };

        $scope.load();


        $scope.$watch('data', function (newValue, oldValue) {
            if ($scope.tableParams && newValue != oldValue) {

                $scope.tableParams.settings().$scope = $scope;
                $scope.tableParams.total($scope.data.length);
                $scope.tableParams.reload();
            }
        });

        $scope.$on('load', function (event) {
            $scope.load();
        });

    }
})();
