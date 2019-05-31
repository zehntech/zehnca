/**
 * Created by sourabhagrawal on 6/6/15.
 */

(function () {
    'use strict';
    angular
        .module('app')
        .directive('checkbox', checkbox);
    function checkbox() {
        var directive = {
            scope: {},
            require: 'ngModel',
            restrict: 'E',
            replace: 'true',
            template: "<button type=\"button\" ng-style=\"stylebtn\" class=\"btn btn-default\" ng-class=\"{'btn-xs': size==='default'}\">" +
            "<span ng-style=\"styleicon\" class=\"fa\" ng-class=\"{'fa-check': checked===true}\"></span>" +
            "</button>",
            link: link
        };
        return directive;
    }

    function link(scope, elem, attrs, modelCtrl) {
        scope.size = 'default';
        // Default Button Styling
        scope.stylebtn = {'padding-top': '2px', 'padding-bottom': '2px', 'height': '17px'};
        // Default Checkmark Styling
        scope.styleicon = {'width': '5px', 'left': '-1px', 'top': '-1px'};
        // If size is undefined, Checkbox has normal size (Bootstrap 'xs')

        var trueValue = true;
        var falseValue = false;

        // If defined set true value
        if (attrs.ngTrueValue !== undefined) {
            trueValue = attrs.ngTrueValue;
        }
        // If defined set false value
        if (attrs.ngFalseValue !== undefined) {
            falseValue = attrs.ngFalseValue;
        }

        // Check if name attribute is set and if so add it to the DOM element
        if (scope.name !== undefined) {
            elem.name = scope.name;
        }

        // Update element when model changes
        scope.$watch(function () {
            if (modelCtrl.$modelValue === trueValue || modelCtrl.$modelValue === true) {
                modelCtrl.$setViewValue(trueValue);
            } else {
                modelCtrl.$setViewValue(falseValue);
            }
            return modelCtrl.$modelValue;
        }, function (newVal, oldVal) {
            scope.checked = modelCtrl.$modelValue === trueValue;
        }, true);

        // On click swap value and trigger onChange function
        elem.bind('click', function () {

            scope.$apply(function () {
                if (modelCtrl.$modelValue === falseValue) {
                    modelCtrl.$setViewValue(trueValue);
                } else {
                    modelCtrl.$setViewValue(falseValue);
                }
            });
        });
    }
})();



