(function() {
    'use strict';
    angular
		.module('app')
		.filter('fromNow', fromNow)
        .filter('propsFilter', propsFilter)
		.filter('parseNumFilter', parseNumFilter);

		function fromNow() {
		    return function(date) {
		      return moment(date).fromNow();
		    }
		}

	    function parseNumFilter() {

        return function (num) {



            if (num >= 2592000) {
                num = Math.floor((num / 2592000)) + ' Month';
            }


            return num;

        };
    }

            function propsFilter() {
            return filter;
            function filter(items, props) {
                var out = [];

                if (angular.isArray(items)) {
                  items.forEach(function(item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                      var prop = keys[i];
                      var text = props[prop].toLowerCase();
                      if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                      }
                    }

                    if (itemMatches) {
                      out.push(item);
                    }
                  });
                } else {
                  // Let the output be the input untouched
                  out = items;
                }

                return out;
            };
        }

})();
