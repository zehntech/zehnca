/**
 * @ngdoc function
 * @name app.controller:PriceCtrl
 * @description
 * # MainCtrl
 * Controller of the price of app
 */

(function () {
    'use strict';
    angular
        .module('app')
        .controller('PriceCtrl', PriceCtrl);
    

    PriceCtrl.$inject = ['$scope', '$http'];

    function PriceCtrl($scope, $http) {


        $scope.plan = 'Basic +';

        $scope.setPlan = function (plan) {
            $scope.plan = plan;
        };

        $scope.rad = 'card';
        $scope.upgradeAcc = function () {
             $('#pay').modal('hide');
            if ($scope.rad == 'paypal') {
                $http.post('api/paytest', {order_payment_method: $scope.rad}).success(function (res) {
                    console.log(res + ' res');
                    window.location.assign(res);
                }).error(function (err) {
                    console.log(err);
                })

            } else {
                $http.put('api/Companies', {plan: $scope.plan})
                    .success(function (response) {
                        console.log(response);
                       // $rootScope.activePlan = response;
                    }).error(function (err) {
                    console.log(err);
                })
            }
        };

        $scope.savePrices0 = function () {
            $scope.prices = {};
            $scope.prices.name = 'Freebie';

            $scope.prices.price = 0;
            $scope.prices.description = 'This is free plan';

            $scope.prices.num_of_schedule = 7;
            $scope.prices.num_of_user = 2;

            $http.post('api/Prices', $scope.prices).success(function (response) {

            }).error(function (error) {
                console.log('error in save price ::  ' + error);
            });
        };


        $scope.savePrices1 = function () {
            $scope.prices = {};
            $scope.prices.name = 'Basic';

            $scope.prices.price = 9;
            $scope.prices.discount = 10;
            $scope.prices.period = 'month';
            $scope.prices.curency = 'US dollar';
            $scope.prices.description = 'This is basic plan';

            $scope.prices.num_of_schedule = 15;
            $scope.prices.num_of_user = 5;

            $http.post('api/Prices', $scope.prices).success(function (response) {

            }).error(function (error) {
                console.log('error in save price ::  ' + error);
            });
        };


        $scope.savePrices2 = function () {
            $scope.prices = {};
            $scope.prices.name = 'Basic +';

            $scope.prices.price = 39;
            $scope.prices.discount = 10;
            $scope.prices.period = 'month';
            $scope.prices.curency = 'US dollar';
            $scope.prices.description = 'This is basic plus plan';


            $scope.prices.num_of_schedule = 25;
            $scope.prices.num_of_user = 10;

            $http.post('api/Prices', $scope.prices).success(function (response) {

            }).error(function (error) {
                console.log('error in save price ::  ' + error);
            });
        };


        $scope.savePrices3 = function () {
            $scope.prices = {};
            $scope.prices.name = 'Advance';

            $scope.prices.price = 59;
            $scope.prices.discount = 10;
            $scope.prices.period = 'month';
            $scope.prices.curency = 'US dollar';
            $scope.prices.description = 'This is advance plan';

            $scope.prices.num_of_schedule = 50;
            $scope.prices.num_of_user = 20;

            $http.post('api/Prices', $scope.prices).success(function (response) {

            }).error(function (error) {
                console.log('error in save price ::  ' + error);
            });
        };


        $scope.getPricingList = function (period) {

            $http.get('api/Prices').success(function (response) {

                if (response.length == 0) {
                    $scope.savePrices0();
                    $scope.savePrices1();
                    $scope.savePrices2();
                    $scope.savePrices3();
                    $scope.getPricingList();
                } else {
                    $scope.priceList = response;
                    $scope.discount = '10';
                    if (period == 'Month') {

                    } else {
                        angular.forEach($scope.priceList, function (value) {
                            if(value.price >0) {
                                value.text = 'Billed annually, ' + value.discount + '% off ' + value.price + ' /mon';
                                value.price = Math.round((value.price * 12) - ((value.price * 12) / value.discount));
                            }

                        });
                    }
                }
            }).error(function (error) {
                console.log('error in getting price list ' + error);
            });

        };

        $scope.period = 'Month';
        $scope.$watch('period', function (newValue) {

            if (newValue == undefined) {
                $scope.priceList = undefined;
                $scope.getPricingList('Month');
            } else {
                $scope.priceList = undefined;
                $scope.getPricingList(newValue);
            }
        });


    }
    
})();
