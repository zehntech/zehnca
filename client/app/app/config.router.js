/**
 * @ngdoc function
 * @name app.config:uiRouter
 * @description
 * # Config
 * Config for the router
 */
(function () {
    'use strict';
    angular
        .module('app')
        .run(runBlock)

        .config(config)
        .config(config1);


    config1.$inject = ['$httpProvider'];
    function config1($httpProvider) {

        // Intercept 401 responses and redirect to login screen
        $httpProvider.interceptors.push(['$q', '$location', 'CoreService', 'OUAuth', function ($q, $location, CoreService, OUAuth) {
            return {
                responseError: function (rejection) {
                    // save the current location so that login can redirect back

                    if (rejection.status === 404) {
                        console.log(rejection);
                        CoreService.toastError('Error 404 received', 'We received a 404 error from the API!');
                    }
                    if (rejection.status === 422) {
                        console.log(rejection);
                        CoreService.toastError('Error 422 received', 'We received a 404 error from the API!');
                    }
                    if (rejection.status === 0) {
                        console.log(rejection);
                        $location.path('/');
                        CoreService.toastError('Connection Refused',
                            'The connection to the API is refused. Please verify that the API is running!'
                        );
                    }
                    return $q.reject(rejection);
                }
            };
        }]);
    }


    runBlock.$inject = ['$rootScope', '$state', '$stateParams'];
    function runBlock($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    }

    config.$inject = ['$stateProvider', '$urlRouterProvider', 'MODULE_CONFIG'];
    function config($stateProvider, $urlRouterProvider, MODULE_CONFIG) {
        /**
         * Check is aws key or not
         * @param $q
         * @param $timeout
         * @param $location
         * @param OUAuth
         * @returns {*}
         */
        var checkAWSKey = function ($q, $timeout, $location, OUAuth) {
            // Initialize a new promise
            var deferred = $q.defer();

            // Authenticated
            if (OUAuth.isKeyExist == 'true' || OUAuth.isKeyExist == true) {
                $timeout(deferred.resolve);
            } else {
                $timeout(deferred.reject);
                if (OUAuth.currentUserData) {
                    var user = JSON.parse(OUAuth.currentUserData);


                    if (user.role == 'admin') {
                        $location.path('/app/update-profile');
                    } else {
                        $location.path('/app/key');
                    }
                } else {
                    $timeout(deferred.reject);
                    $location.path('/access/signin');
                }
            }

            return deferred.promise;
        };
        checkAWSKey.$inject = ['$q', '$timeout', '$location', 'OUAuth'];

        /**
         * Check user loggedin or not
         * @param $q
         * @param $timeout
         * @param $location
         * @param OUAuth
         * @returns {*}
         */
        var checkLoggedin = function ($q, $timeout, $location, OUAuth) {

            // Initialize a new promise
            var deferred = $q.defer();

            // Not Authenticated
            if (OUAuth.accessTokenId) {
                $timeout(deferred.resolve);
            }
            //  Authenticated
            else {
                $timeout(deferred.reject);
                $location.path('/access/signin');
            }

            return deferred.promise;
        };
        checkLoggedin.$inject = ['$q', '$timeout', '$location', 'OUAuth'];


        /**
         * Check user loggedin or not and key
         * @param $q
         * @param $timeout
         * @param $location
         * @param OUAuth
         * @returns {*}
         */
        var checkLoggedinNKey = function ($q, $timeout, $location, OUAuth) {
            // Initialize a new promise
            var deferred = $q.defer();

            // Not Authenticated
            if (OUAuth.accessTokenId && (OUAuth.isKeyExist != 'true')) {

                $timeout(deferred.resolve);
            }
            //  Authenticated
            else {
                $location.path('/');
                $timeout(deferred.reject);

            }

            return deferred.promise;
        };
        checkLoggedinNKey.$inject = ['$q', '$timeout', '$location', 'OUAuth'];



        var layout = 'views/layout.html',
            dashboard = 'views/layout/dashboard.html';

        $urlRouterProvider
            .otherwise('/app/dashboard');

        $stateProvider
            .state('app', {
                abstract: true,
                url: '/app',
                views: {
                    '': {
                        templateUrl: layout
                    }
                },
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .state('app.dashboard', {
                url: '/dashboard',
              templateUrl: '../views/chart/chart.html',
              data : { title: 'Charts' },
              controller: "ChartCtrl",
              resolve: load(['app/controllers/chart.js'])
            })

            .state('access', {
                url: '/access',
                template: '<div class="dark bg-auto w-full"><div ui-view class="fade-in-right-big smooth pos-rlt"></div></div>'
            })

            .state('access.signin', {
                url: '/signin',
                templateUrl: 'views/page/signin.html',
                controller: 'LoginCtrl',
                resolve: load(['app/controllers/login.js'])
            })

            .state('access.signup', {
                url: '/signup',
                templateUrl: 'views/page/signup.html',
                controller: 'RegisterCtrl',
                resolve: load(['app/controllers/register.js'])
            })

            .state('access.forgot-password', {
                url: '/forgot-password',
                templateUrl: 'views/page/forgot-password.html',
                controller: 'ResetCtrl',
                resolve: load(['app/controllers/reset.js'])
            })

            .state('app.instance', {
                url: '/instance',
                templateUrl: 'views/ec2/list.html',
                controller: 'InstanceCtrl',
                resolve: load(['moment','ui.select',  'app/controllers/ec2.js'])
            })
            .state('app.reinstance', {
                url: '/reserved-instance',
                templateUrl: 'views/ec2/re-list.html',
                controller: 'InstanceCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])
            })
            .state('app.image', {
                url: '/images',
                templateUrl: 'views/ec2/image-list.html',
                controller: 'ImageCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])
            })
            .state('app.volume', {
                url: '/volumes',
                templateUrl: 'views/ec2/volume-list.html',
                controller: 'SnapshotCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])
            })
            .state('app.snapshot', {
                url: '/snapshot',
                templateUrl: 'views/ec2/snapshot-list.html',
                controller: 'SnapshotCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])
            })
            .state('app.scheduler', {
                url: '/scheduler',
                templateUrl: 'views/ec2/schedule-list.html',
                controller: 'ScheduleCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])

            })
            .state('app.snapshotScheduler', {
                url: '/snapshot-scheduler',
                templateUrl: 'views/ec2/snapshot-schedule-list.html',
                controller: 'ScheduleCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])

            })
            .state('app.scheduleInstance', {
                url: '/schedule-instance',
                templateUrl: 'views/ec2/schedule-instance.html',
                controller: 'ScheduleCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])

            })
            .state('app.scheduleSnapshot', {
                url: '/schedule-snapshot',
                templateUrl: 'views/ec2/schedule-snapshot.html',
                controller: 'ScheduleCtrl',
                resolve: load(['moment', 'ui.select', 'app/controllers/ec2.js'])
            })

            .state('app.page', {
                url: '/page',
                template: '<div ui-view></div>'
            })
            .state('app.page.profile', {
                url: '/profile',
                templateUrl: 'views/user/profile.html',
                controller: 'ProfileCtrl',
                resolve: load(['app/controllers/profile.js'])
            })
            .state('app.page.setting', {
                url: '/setting',
                templateUrl: 'views/page/setting.html',
                data: {title: 'Setting'},
                resolve: load(['ui.select', 'angularFileUpload', 'app/controllers/user.js'])
            })

            .state('app.page.price', {
                url: '/price',
                templateUrl: 'views/page/price.html',
                data: {title: 'Price'}
            })

            .state('app.users', {
                url: '/users',
                templateUrl: 'views/user/list.html',
                controller: 'UserCtrl',
                resolve:  load(['app/controllers/user.js'])

            })
            .state('app.log', {
                url: '/log',
                templateUrl: 'views/user/log.html',
                controller: 'LogCtrl',
                resolve:  load([ 'ui.select','app/controllers/log.js'])
            })
            .state('app.log.instance', {
                url: '/instance',
                templateUrl: 'views/user/instance-log.html',
                controller: 'InstanceLogCtrl',
                resolve:  load([ 'ui.select','app/controllers/log.js'])
            })
            .state('app.log.snapshot', {
                url: '/snapshot',
                templateUrl: 'views/user/snapshot-log.html',
                controller: 'SnapshotLogCtrl',
                resolve:  load([ 'ui.select','app/controllers/log.js'])
            })

            .state('app.update-profile', {
                url: '/update-profile',
                templateUrl: 'views/user/company-profile.html',
                controller: 'UpdateCtrl',
                resolve: load(['ui.select', 'app/controllers/user.js'])

            }) .state('do-payment', {
                url: '/do-payment'


            });

        /**
         * Function to load controller and related libraries dynamically
         * @param srcs
         * @param callback
         * @returns {{deps: *[]}}
         */
        function load(srcs, callback) {
            return {
                deps: ['$ocLazyLoad', '$q',
                    function ($ocLazyLoad, $q) {
                        var deferred = $q.defer();
                        var promise = false;
                        srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
                        if (!promise) {
                            promise = deferred.promise;
                        }
                        angular.forEach(srcs, function (src) {
                            promise = promise.then(function () {
                                angular.forEach(MODULE_CONFIG, function (module) {
                                    if (module.name == src) {
                                        src = module.module ? module.name : module.files;
                                    }
                                });
                                return $ocLazyLoad.load(src);
                            });
                        });
                        deferred.resolve();
                        return callback ? promise.then(function () {
                            return callback();
                        }) : promise;
                    }]
            }
        }


    }
})();
