/**
 * Created by sourabhagrawal on 18/5/15.
 */
(function () {
    'use strict';
    angular.module('app')
        .controller('ResetCtrl', ResetCtrl);


    ResetCtrl.$inject = ['$scope', '$http',  'CoreService', '$location'];
    function ResetCtrl($scope, $http, CoreService, $location) {

        $scope.email = '';
        $scope.resetError = '';

        /**
         * The function to reset user password
         */
        $scope.send = function () {
            $http.post('api/users/reset', {email: $scope.email}).success(function () {
                $scope.email = '';
                CoreService.alertSuccess('A password change link is being sent to your registered email address !');
                 $location.path('/access/signin');
            }).error(function (err) {
                $scope.resetError = err.message;

            });
        };
    }

})();
