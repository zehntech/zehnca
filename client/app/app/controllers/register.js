/**
 * Created by sourabhagrawal on 18/5/15.
 */
(function () {
    'use strict';
    angular.module('app')
        .controller('RegisterCtrl', RegisterCtrl);

    RegisterCtrl.$inject = ['$scope', '$http', 'CoreService', '$location'];
    function RegisterCtrl($scope, $http, CoreService, $location) {

        $scope.user = {};
        $scope.ConfirmAgree = false;
        $scope.registerError = '';
        $scope.loginError = '';
         var company;

        function register() {
            $http.post('api/users', {
                name: $scope.user.name,
                email: $scope.user.email,
                password: $scope.user.password,
                role: 'admin',
                companyId: company
            }).success(function () {
                $scope.user = {};
                $scope.ConfirmAgree = false;
                CoreService.alertInfo('Registration Successfully ',
                    'Please check your email and click on the verification link '
                    + 'before logging in!');
                $location.path('/access/signin');

            }).error(function (err, status) {
                if (status == 422) {
                    $scope.registerError = 'Email ID is already exist'
                } else {
                    $scope.registerError = 'Registration failed';
                }
                 $('#signupBtn').text("Sign up");
                       $scope.isProcessing = false;
            });
        }

        /**
         * The function to register user
         */
        $scope.create = function () {

            if (angular.equals($scope.user.password, $scope.user.confirmPassword)) {
                $('#signupBtn').text("Processing...");
                   $scope.isProcessing = true;
                if(!company) {
                    $http.post('api/Companies', {
                        companyName: 'Company',
                        plan: 'Freebie',
                        createdBy: $scope.user.email
                    }).success(function (response) {
                        company = response.id;
                        register();
                    })
                }else{
                    register();
                }

            } else {
                CoreService.alertInfo('Password not match ',
                    'Please enter the same password!');
            }
        }
    }


})();
