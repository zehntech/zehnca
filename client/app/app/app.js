/**
 * @ngdoc overview
 * @name app
 * @description
 * # app
 *
 * Main module of the application.
 */
(function () {
    'use strict';
    angular
        .module('app', [
            'ngAnimate',
            'ngResource',
            'ngSanitize',
            'ngTouch',
            'ngTable',
            'smart-table',
            'oitozero.ngSweetAlert',
            'toasty',
            'ngStorage',
            'ngStore',
            'ui.router',
            'ui.utils',
            'ui.load',
            'ui.jp',
            'ui.tree',
            'gantt',
            'gantt.tooltips',
            'gantt.tree',
            'mgcrea.ngStrap',
            'oc.lazyLoad',
            'dashboard'
        ]);
})();
