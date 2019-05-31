(function () {
    'use strict',
        angular.module('dashboard', [])
            .factory('DashboardService', DashboardService);

    DashboardService.$inject = ['$http', '$q', 'OUAuth', '$resource'];
    function DashboardService($http, $q, OUAuth, $resource) {
        return {

            getNextOccurrencesByName: function getNextOccurrencesByName(instance, count) {
                console.log('Changed');
                var deferred = $q.defer();
                $http.get('api/Schedulers/getNextOccurrencesByName?name=' + instance.startSchedulerName + '&count=' + count +
                    '&access_token=' + OUAuth.accessTokenId).success(function (response) {
                    deferred.resolve(response);
                }).error(function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },

                        /**
             * get all user by company
             */
            getUsers: function (id) {

                var url = 'api/users?filter[where][companyId]=' + id + '&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            },

            /**
             * get schedule status by company
             */
            getStatus: function (id) {

                var url = 'api/Loggers?filter[where][companyId]=' + id + '&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            }

        };
    }
})();