/**
 * @ngdoc function
 * @name app.controller:AppCtrl
 * @description
 * # MainCtrl
 * Controller of the app
 */

(function () {
    'use strict';
    angular
        .module('app')
        .controller('AppCtrl', AppCtrl)
        .controller('HeaderCtrl', HeaderCtrl)
        .controller('FooterCtrl', FooterCtrl);


    AppCtrl.$inject = ['$scope', '$localStorage', '$location', '$rootScope', '$anchorScroll', '$timeout', '$window'];

    function AppCtrl($scope, $localStorage, $location, $rootScope, $anchorScroll, $timeout, $window) {
        var vm = $scope;
        vm.isIE = isIE();
        vm.isSmart = isSmart();
        // config
        vm.app = {
            name: 'ZehnCA',
            fullName: 'ZehnCloudAutomater',
            version: '1.0.0-alpha',
            apiUrl: 'http://www.zehnca.com/api/',
            // for chart colors
            color: {
                'primary': '#0cc2aa',
                'accent': '#a88add',
                'warn': '#fcc100',
                'info': '#6887ff',
                'success': '#6cc788',
                'warning': '#f77a99',
                'danger': '#f44455',
                'white': '#ffffff',
                'light': '#f1f2f3',
                'dark': '#2e3e4e',
                'black': '#2a2b3c'
            },
            setting: {
                theme: {
                    primary: 'primary',
                    accent: 'accent',
                    warn: 'warn'
                },
                folded: false,
                boxed: false,
                container: false,
                themeID: 1,
                bg: ''
            }
        };

        var setting = vm.app.name + '-Setting';
        // save settings to local storage
        if (angular.isDefined($localStorage[setting])) {
            vm.app.setting = $localStorage[setting];
        } else {
            $localStorage[setting] = vm.app.setting;
        }
        // watch changes
        $scope.$watch('app.setting', function () {
            $localStorage[setting] = vm.app.setting;
        }, true);

        getParams('bg') && (vm.app.setting.bg = getParams('bg'));

        vm.setTheme = setTheme;
        setColor();

        function setTheme(theme) {
            vm.app.setting.theme = theme.theme;
            setColor();
            if (theme.url) {
                $timeout(function () {
                    $window.location.href = theme.url;
                }, 100, false);
            }
        }

        function setColor() {
            vm.app.setting.color = {
                primary: getColor(vm.app.setting.theme.primary),
                accent: getColor(vm.app.setting.theme.accent),
                warn: getColor(vm.app.setting.theme.warn)
            };
        }

        function getColor(name) {
            return vm.app.color[name] ? vm.app.color[name] : palette.find(name);
        }

        $rootScope.$on('$stateChangeSuccess', openPage);

        function openPage() {
            // goto top
            $location.hash('content');
            $anchorScroll();
            $location.hash('');
            // hide open menu
            $('#aside').modal('hide');
        }

        vm.goBack = function () {
            $window.history.back();
        };

        function isIE() {
            return !!navigator.userAgent.match(/MSIE/i) || !!navigator.userAgent.match(/Trident.*rv:11\./);
        }

        function isSmart() {
            // Adapted from http://www.detectmobilebrowsers.com
            var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
            // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
            return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
        }

        function getParams(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }


    }

    HeaderCtrl.$inject = ['$scope', '$rootScope', '$http', 'OUAuth', 'LoginService', 'SyncFromAwsService', '$timeout'];
    function HeaderCtrl($scope, $rootScope, $http, OUAuth, LoginService, SyncFromAwsService, $timeout) {

        $scope.user = {};
        $scope.user.photoLink = null;
        $scope.userName = '';

        if (OUAuth.currentUserData) {
            $scope.user = JSON.parse(OUAuth.currentUserData);

            $scope.userName = $scope.user.name;
            $scope.role = $scope.user.role;

            if ($scope.user.photoLink) {
                $scope.user.photoLink = 'api/containers/files/download/' + encodeURIComponent($scope.user.photoLink);
            } else {
                $scope.user.photoLink = 'api/containers/files/download/thumb.jpg';
            }
        }

        $scope.isAdmin = $scope.role != 'user';


        $scope.isKeyExist = OUAuth.isKeyExist == 'true' || OUAuth.isKeyExist == true;


        $scope.isAuthenticate = OUAuth.accessTokenId;

        $scope.logout = function () {
            LoginService.logout();
        };
        $scope.signout = function () {
            LoginService.logout();
            location.reload();
        };

        /*
         if ($scope.isAdmin && $scope.isAuthenticate) {
         $http.get('api/Companies/' + $scope.user.companyId + '?access_token=' + OUAuth.accessTokenId).success(function (res) {
         $http.get('api/Prices/?filter[where][name]=' + res.plan).success(function (response) {

         $rootScope.activePlan = response[0];
         $rootScope.activePlan.date = new Date(parseInt($scope.user.companyId.substring(0, 8), 16) * 1000).getTime() + 2592000000;
         $rootScope.accActiveDate = new Date(parseInt($scope.user.companyId.substring(0, 8), 16) * 1000).getTime();
         });

         });
         }
         */

        $rootScope.$on('reload', function currentUser(event, value) {
            $scope.user = JSON.parse(OUAuth.currentUserData);

            $scope.userName = $scope.user.name;
            $scope.role = $scope.user.role;


            $scope.isAdmin = $scope.role != 'user';


            $scope.isKeyExist = OUAuth.isKeyExist == 'true' || OUAuth.isKeyExist == true;


            $scope.isAuthenticate = OUAuth.accessTokenId;

            if ($scope.user.photoLink) {
                $scope.user.photoLink = 'api/containers/files/download/' + encodeURIComponent($scope.user.photoLink)
            } else {
                $scope.user.photoLink = 'api/containers/files/download/thumb.jpg'
            }

        });


        if (window.sessionStorage.getItem('region') && window.sessionStorage.getItem('region') != 'us-east-1') {
            $scope.region = window.sessionStorage.getItem('region');
        } else {
            $scope.region = 'us-east-1';
            window.sessionStorage.setItem('region', $scope.region);
        }
        $rootScope.regions = [
            {
                key: 'ap-northeast-1',
                value: 'Asia Pacific (Tokyo)',
                img: 'assets/images/flags/jp.png'
            },
            {
                key: 'ap-southeast-1',
                value: 'Asia Pacific (Singapore)',
                img: 'assets/images/flags/sg.png'
            },
            {
                key: 'ap-southeast-2',
                value: 'Asia Pacific (Sydney)',
                img: 'assets/images/flags/au.png'
            },
            {
                key: 'eu-central-1',
                value: 'EU (Frankfurt)',
                img: 'assets/images/flags/eu.png'
            },
            {
                key: 'eu-west-1',
                value: 'EU (Ireland)',
                img: 'assets/images/flags/eu.png'
            },
            {
                key: 'sa-east-1',
                value: 'South America (Sao Paulo)',
                img: 'assets/images/flags/sa.png'
            },
            {
                key: 'us-east-1',
                value: 'US East (N. Virginia)',
                img: 'assets/images/flags/us.png'
            },
            {
                key: 'us-west-1',
                value: 'US West (N. California)',
                img: 'assets/images/flags/us.png'
            }, {
                key: 'us-west-2',
                value: 'US West (Oregon)',
                img: 'assets/images/flags/us.png'
            }

        ];

        $scope.setRegion = function (key) {
            window.sessionStorage.setItem('region', key);
            $scope.region = key;
            $rootScope.$broadcast('changeRegion');

        }

        $scope.fullscreen = 'View in fullscreen';


        $scope.syncTooltip = 'Sync from AWS';

        $scope.sync = function () {
            $('#sync').addClass('fa-spin');
            SyncFromAwsService.sync($scope.user.companyId).then(function (res) {
                console.log(res)
                $timeout(function () {
                    $('#sync').removeClass('fa-spin');
                    $rootScope.$broadcast('syncData');
                }, 5000);
            })
        }
    }

    FooterCtrl.$inject = ['$scope'];
    function FooterCtrl($scope) {

        // To get the correct viewport width based on  http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
        function getViewPort() {
            var e = window,
                a = 'inner';
            if (!('innerWidth' in window)) {
                a = 'client';
                e = document.documentElement || document.body;
            }

            return {
                width: e[a + 'Width'],
                height: e[a + 'Height']
            };
        }

        function handleContentHeight() {

            var height;

            height = getViewPort().height -
                $('.app-header').outerHeight()  - $('.page-footer').outerHeight();

             $('.app-body').css('min-height', height);

        }

        $scope.$on('$includeContentLoaded', handleContentHeight);

        $scope.$on('$stateChangeSuccess', handleContentHeight);

    }


})();
