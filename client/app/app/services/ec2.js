/**
 * Created by sourabhagrawal on 2/11/15.
 */


(function () {
    'use strict';
    angular
        .module('app')
        .factory('InstanceService', InstanceService)
        .factory('SnapshotService', SnapshotService)
        .factory('ImageService', ImageService)
        .factory('VolumeService', VolumeService);


    InstanceService.$inject = ['OUAuth', '$q', '$http'];
    function InstanceService(OUAuth, $q, $http) {

        return {
            /**
             * get instances by region and company
             */
            get: function (id, region) {


               var url = 'api/Instances/descInstance/?id=' + id + '&region=' + region + '&access_token=' + OUAuth.accessTokenId;

                var deferred = $q.defer();
                $http.get(url).then(function (result) {
                    deferred.resolve(result.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;

            },
            /**
             * get reserved instances by region and company
             */
            getReservedInstances: function (id, region) {

                var url = 'api/Instances/descReservedInstance/?id=' + id + '&region=' + region + '&access_token=' + OUAuth.accessTokenId;
                var deferred = $q.defer();
                $http.get(url).then(function (result) {
                    deferred.resolve(result.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;

            }
        }
    }

    SnapshotService.$inject = ['OUAuth', '$q', '$http'];
    function SnapshotService(OUAuth, $q, $http) {

        return {
            /**
             * get snapshots by region and company
             */
            get: function (id, region) {

                var url = 'api/Snapshots/descSnapshots/?id=' + id + '&region=' + region + '&access_token=' + OUAuth.accessTokenId;
                var deferred = $q.defer();
                $http.get(url).then(function (result) {
                    deferred.resolve(result.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;

            }
        }
    }


    ImageService.$inject = ['OUAuth', '$q', '$http'];
    function ImageService(OUAuth, $q, $http) {

        return {
            /**
             * get images by region and company
             */
            get: function (id, region) {

                var url = 'api/Snapshots/descImages/?id=' + id + '&region=' + region + '&access_token=' + OUAuth.accessTokenId;
                var deferred = $q.defer();
                $http.get(url).then(function (result) {
                    deferred.resolve(result.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;

            }
        }
    }


    VolumeService.$inject = ['OUAuth', '$q', '$http'];
    function VolumeService(OUAuth, $q, $http) {

        return {
            /**
             * get volumes by region and company
             */
            get: function (id, region) {

                var url = 'api/Volumes/descVolumes/?id=' + id + '&region=' + region + '&access_token=' + OUAuth.accessTokenId;
                var deferred = $q.defer();
                $http.get(url).then(function (result) {
                    deferred.resolve(result.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;

            }
        }
    }


})();

