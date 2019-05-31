// lazyload config
(function() {
    'use strict';
    angular
      .module('app')

      .constant('MODULE_CONFIG', [
          {
              name: 'ui.select',
              module: true,
              files: [
                  'libs/angular/angular-ui-select/dist/select.min.js',
                  'libs/angular/angular-ui-select/dist/select.min.css'
              ]
          },
          {
              name: 'vr.directives.slider',
              module: true,
              files: [
                  'libs/angular/venturocket-angular-slider/build/angular-slider.min.js',
                  'libs/angular/venturocket-angular-slider/angular-slider.css'
              ]
          },
          {
              name: 'angularFileUpload',
              module: true,
              files: [
                  'libs/angular/angular-file-upload/angular-file-upload.js'
              ]
          },

          {
              name:'ui.calendar',
              module: true,
              files: ['libs/angular/angular-ui-calendar/src/calendar.js']
          },

          {
              name: 'footable',
              module: false,
              files: [
                  'libs/jquery/footable/dist/footable.all.min.js',
                  'libs/jquery/footable/css/footable.core.css'
              ]
          },
          {
              name: 'easyPieChart',
              module: false,
              files: [
                  'libs/jquery/jquery.easy-pie-chart/dist/jquery.easypiechart.fill.js'
              ]
          },
          {
              name: 'sparkline',
              module: false,
              files: [
                  'libs/jquery/jquery.sparkline/dist/jquery.sparkline.retina.js'
              ]
          },
          {
              name: 'plot',
              module: false,
              files: [
                  'libs/jquery/flot/jquery.flot.js',
                  'libs/jquery/flot/jquery.flot.resize.js',
                  'libs/jquery/flot/jquery.flot.pie.js',
                  'libs/jquery/flot.tooltip/js/jquery.flot.tooltip.min.js',
                  'libs/jquery/flot-spline/js/jquery.flot.spline.min.js',
                  'libs/jquery/flot.orderbars/js/jquery.flot.orderBars.js'
              ]
          },
          {
              name: 'vectorMap',
              module: false,
              files: [
                  'libs/jquery/bower-jvectormap/jquery-jvectormap-1.2.2.min.js',
                  'libs/jquery/bower-jvectormap/jquery-jvectormap.css', 
                  'libs/jquery/bower-jvectormap/jquery-jvectormap-world-mill-en.js',
                  'libs/jquery/bower-jvectormap/jquery-jvectormap-us-aea-en.js'
              ]
          },
          {
              name: 'moment',
              module: false,
              files: [
                  'libs/jquery/moment/moment.js'
              ]
          },
          {
              name: 'fullcalendar',
              module: false,
              files: [
                  'libs/jquery/moment/moment.js',
                  'libs/jquery/fullcalendar/dist/fullcalendar.min.js',
                  'libs/jquery/fullcalendar/dist/fullcalendar.css',
                  'libs/jquery/fullcalendar/dist/fullcalendar.theme.css'
              ]
          },
            {
                name:'gantt',
                module:true,
                files:[
                    'libs/angular-gantt/assets/angular-gantt.css',

                    'libs/angular-gantt/assets/angular-gantt.js'
                ]
            },
            {
                name:'gantt.table',
                module:true,
                files:[
                    'libs/angular-gantt/assets/angular-gantt-plugins.css',
                    'libs/angular-gantt/assets/angular-gantt-plugins.js'

                ]
            }

        ]
      )
      .config(['$ocLazyLoadProvider', 'MODULE_CONFIG', function($ocLazyLoadProvider, MODULE_CONFIG) {
          $ocLazyLoadProvider.config({
              debug: false,
              events: false,
              modules: MODULE_CONFIG
          });
      }]);
})();

