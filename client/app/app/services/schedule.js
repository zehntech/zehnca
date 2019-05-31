/**
 * Created by sourabhagrawal on 2/11/15.
 */



(function () {
    'use strict';
    angular
        .module('app')
        .factory('SchedulerService', SchedulerService)
        .factory('ScheduleService', ScheduleService);


    SchedulerService.$inject = ['OUAuth', '$resource'];
    function SchedulerService(OUAuth, $resource) {

        return {
            /**
             * get instance scheduler by company
             */
            schInstance: function (id) {

                var url = 'api/Schedulers?filter[where][companyId]=' + id + '&filter[where][schedulerType]=instance&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            },
            schInstanceByName: function (id, name) {

                var url = 'api/Schedulers?filter[where][companyId]=' + id + '&filter[where][schedulerName]='+name+'&filter[where][schedulerType]=instance&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            },
            /**
             * get snapshot scheduler by company
             */
            schSnapshot: function (id) {

                var url = 'api/Schedulers?filter[where][companyId]=' + id + '&filter[where][schedulerType]=snapshot&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            }
        }
    }

    ScheduleService.$inject = ['OUAuth', '$resource'];
    function ScheduleService(OUAuth, $resource) {

        return {
            /**
             * get schedule instance by company
             */
            scheduleInstance: function (id) {

                var url = 'api/InstanceSchedules?filter[where][companyId]=' + id + '&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            },

            /**
             * get schedule instance by instance id
             */
            scheduleInstanceById: function (id, companyID) {

                var url = 'api/InstanceSchedules?filter[where][instanceId]=' + id + '&filter[where][companyId]=' + companyID+'&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            },
            /**
             * get snapshot scheduler and company
             */
            scheduleSnapshot: function (id) {

                var url = 'api/SnapshotSchedules?filter[where][companyId]=' + id + '&access_token=' + OUAuth.accessTokenId;
                    return $resource(url).query().$promise;

            }
        }
    }



})();

