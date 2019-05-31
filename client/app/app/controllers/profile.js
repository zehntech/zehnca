/**
 * Created by sourabhagrawal on 18/5/15.
 */
(function () {
    'use strict';
    angular.module('app')
        .controller('ProfileCtrl', ProfileCtrl);



    ProfileCtrl.$inject = ['$scope', '$rootScope', '$http', 'CoreService', 'OUAuth'];

    function ProfileCtrl($scope, $rootScope, $http,CoreService, OUAuth){


        $rootScope.relaod = false;

        $scope.userInfo = JSON.parse(OUAuth.currentUserData);

        $scope.company = {};

        $http.get('api/Companies/' + $scope.userInfo.companyId + '?access_token=' + OUAuth.accessTokenId).success(function (res) {
            $scope.company = res;

        }).error(function (err) {

        });


        if ($scope.userInfo.photoLink) {
            $scope.userInfo.photoLink = 'api/containers/files/download/' + encodeURIComponent($scope.userInfo.photoLink)
        } else {
            $scope.userInfo.photoLink = 'api/containers/files/download/thumb.jpg'
        }

    }


})();
