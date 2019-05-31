/**
 * Created by sourabhagrawal on 6/5/15.
 */



(function () {
    'use strict';
    angular
        .module('app')
        .service('CoreService', CoreService)
        .factory('convertDate', convertDate)
        .factory('OUAuth', OUAuth)
        .factory('LoginService', LoginService)
        .factory('CheckEmailService', CheckEmailService)
        .factory('SyncFromAwsService', SyncFromAwsService)
        .factory('TableService', TableService);

    CoreService.$inject = ['SweetAlert', 'toasty'];
    function CoreService(SweetAlert, toasty) {

        this.alert = function (title, text) {
            SweetAlert.swal(title, text);
        };

        this.alertSuccess = function (title, text) {
            SweetAlert.swal(title, text, 'success');
        };

        this.alertError = function (title, text) {
            SweetAlert.swal(title, text, 'error');
        };

        this.alertWarning = function (title, text) {
            SweetAlert.swal(title, text, 'warning');
        };

        this.alertInfo = function (title, text) {
            SweetAlert.swal(title, text, 'info');
        };

        this.confirm = function (title, text, successCb, cancelCb) {
            var config = {
                title: title,
                text: text,
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                allowOutsideClick: false
            };
            this._swal(config, successCb, cancelCb);
        };

        this.confirmation = function (title, text, successCb, cancelCb) {
            var config = {
                title: title,
                text: text,
                showCancelButton: true,
                cancelButtonText: "No",
                confirmButtonText: "Yes",
                confirmButtonColor: '#f0ad4e',
                allowOutsideClick: false,
                timer: 299000
            };
            this._swal(config, successCb, cancelCb);
        };

        this._swal = function (config, successCb, cancelCb) {
            SweetAlert.swal(config,
                function (confirmed) {
                    if (confirmed) {
                        successCb();
                    } else {
                        cancelCb();
                    }
                });
        };

        this.prompt = function (title, text, successCb) {
            var config = {
                title: title,
                text: text,
                type: 'info',
                showCancelButton: false,
                confirmButtonColor: '#5bc0de',
                allowOutsideClick: false
            };
            this._swalp(config, successCb);
        };

        this._swalp = function (config, successCb) {
            SweetAlert.swal(config,
                function (confirmed) {
                    if (confirmed) {
                        successCb();
                    }
                });
        };

        this.toastSuccess = function (title, text) {
            toasty.pop.success({
                title: title,
                msg: text,
                sound: false
            });
        };

        this.toastError = function (title, text) {
            toasty.pop.error({
                title: title,
                msg: text,
                sound: false,
                showClose: false
            });
        };

        this.toastWarning = function (title, text) {
            toasty.pop.warning({
                title: title,
                msg: text,
                sound: false,
                timeout: 6000,
                showClose: false
            });
        };

        this.toastInfo = function (title, text) {
            toasty.pop.info({
                title: title,
                msg: text,
                sound: false,
                timeout: 5000
            });
        };

        this.toastWait = function (title, text) {
            toasty.pop.wait({
                title: title,
                msg: text,
                sound: false,
                timeout: 0
            });
        };

        this.toastClear = function () {
            toasty.clear()
        };
    }

    function convertDate() {

        return {

            /**
             * Return string
             * @returns {string}
             */
            formatAMPM: function formatAMPM(date, period) {
                var hours = date.getUTCHours();
                var minutes = date.getUTCMinutes();

                var ampm = hours >= 12 || hours == 0 ? 'pm' : 'am';

                if (period == 'am' && ampm == 'am') {
                    ampm = 'pm';
                }

                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;
                var strTime = hours + ':' + minutes + ' ' + ampm;

                return strTime;
            }

        };
    }

    function OUAuth() {
        var props = ['accessTokenId', 'currentUserData', 'isKeyExist'];
        var propsPrefix = '$ZEHNAWS$';

        function OUAuth() {
            var self = this;
            props.forEach(function (name) {
                self[name] = load(name);
            });
            this.rememberMe = undefined;
        }

        OUAuth.prototype.save = function () {
            var self = this;


            props.forEach(function (name) {
                if (self.rememberMe) {
                    save(localStorage, name, self[name]);
                } else {
                    save(sessionStorage, name, self[name]);
                }


            });
        };

        OUAuth.prototype.setUser = function (accessTokenId, userData, isKeyExist) {
            this.accessTokenId = accessTokenId;
            this.currentUserData = JSON.stringify(userData);
            this.isKeyExist = isKeyExist;
        };

        OUAuth.prototype.clearUser = function () {
            this.accessTokenId = null;
            this.currentUserData = null;
            this.isKeyExist = null;
        };

        OUAuth.prototype.clearStorage = function () {
            props.forEach(function (name) {
                save(sessionStorage, name, null);
                save(localStorage, name, null);
            });
         //   delete $cookies['access_token'];
        };


        return new OUAuth();

        // Note: LocalStorage converts the value to string
        // We are using empty string as a marker for null/undefined values.
        function save(storage, name, value) {
            var key = propsPrefix + name;
            if (value == null) value = '';
            storage[key] = value;
        }

        function load(name) {
            var key = propsPrefix + name;

            return localStorage[key] || sessionStorage[key] || null;
        }
    }

    LoginService.$inject = ['OUAuth', '$location'];
    function LoginService(OUAuth, $location) {

        return {
            /**
             * Logout user
             */
            logout: function () {
                OUAuth.clearUser();
                OUAuth.clearStorage();
                $location.path('/access/signin');
            }
        }
    }

    CheckEmailService.$inject = ['OUAuth', '$q', '$http'];
    function CheckEmailService(OUAuth, $q, $http) {

        return {

            check: function (email) {

            var deferred = $q.defer();
                $http.get('api/users/?filter[where][email] =' + email + '&access_token=' + OUAuth.accessTokenId).then(function(result) {
                        deferred.resolve(result);
                    }, function(error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }
        }
    }

    SyncFromAwsService.$inject = ['OUAuth', '$q', '$http'];
    function SyncFromAwsService(OUAuth, $q, $http) {

        return {

            sync: function (id) {

            var deferred = $q.defer();
                $http.get('api/users/sync?id=' + id + '&access_token=' + OUAuth.accessTokenId).then(function(result) {
                        deferred.resolve(result);
                    }, function(error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }
        }
    }

    TableService.$inject = ['$q', '$filter', '$timeout'];
    function TableService($q, $filter, $timeout) {
        return {
            getPage: function (start, number, params, data) {
                var deferred = $q.defer();

                var filtered = params.search.predicateObject ? $filter('filter')(data, params.search.predicateObject) : data;

                if (params.sort.predicate) {
                    filtered = $filter('orderBy')(filtered, params.sort.predicate, params.sort.reverse);
                }

                var result = filtered.slice(start, start + number);

                $timeout(function () {
                    //note, the server passes the information about the data set size
                    deferred.resolve({
                        data: result
                       // numberOfPages: Math.ceil(filtered.length / number)
                    });
                }, 400);


                return deferred.promise;
            }
        }
    }



})();

