/**
 * Created by sourabhagrawal on 18/5/15.
 */
(function () {
    'use strict';
    angular.module('app').controller('LoginCtrl', LoginCtrl);


    LoginCtrl.$inject = ['$scope', '$http', 'OUAuth', '$location', 'CoreService'];
    function LoginCtrl($scope, $http, OUAuth, $location, CoreService) {

        $scope.data = {};
        $scope.rememberMe = false;
        $scope.loginError = '';
        $scope.registerError = '';

        $scope.login = function () {

            if ($scope.data.username && $scope.data.password) {
                OUAuth.currentUserId = OUAuth.accessTokenId = null;
                var url = 'api/users/login?include=user';

                $http.post(url, {
                    email: $scope.data.username,
                    password: $scope.data.password
                }).success(function (response) {

                    if (response) {
                        $http.get('api/Companies/' + response.user.companyId + '?access_token=' + response.id).success(function (res) {

                            if (res.keyId) {
                                OUAuth.setUser(response.id, response.user, true);
                                OUAuth.rememberMe = $scope.rememberMe;
                                OUAuth.save();
                                if (response.user.role == 'admin') {
                                    $location.path('/app');
                                }
                                else {
                                    $location.path('/app/instance');
                                }


                            } else {
                                OUAuth.setUser(response.id, response.user, false);
                                OUAuth.rememberMe = $scope.rememberMe;
                                OUAuth.save();

                                if (response.user.role == 'admin') {
                                    $location.path('/app/update-profile');
                                } else {
                                    $location.path('/app/key');
                                }
                            }


                        }).error(function (err) {
                            CoreService.toastError('Oops', 'Err in loading your company info ' + err)
                        })

                    }

                }).error(function (err) {

                    $scope.loginError = 'Username or password is wrong';
                    OUAuth.refreshToken = OUAuth.accessTokenId = null;
                    OUAuth.save();

                });
            }

        }
    }

})();
