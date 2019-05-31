/**
 * Created by sourabhagrawal on 18/5/15.
 */
(function () {
    'use strict';
    angular.module('app')
        .controller('KeyCtrl', KeyCtrl)
        .controller('UpdateCtrl', UpdateCtrl)
        .controller('ProfileCtrl', ProfileCtrl)
        .controller('ChangePasswordCtrl', ChangePasswordCtrl)
        .controller('UserCtrl', UserCtrl);


    var countries = [ // Taken from https://gist.github.com/unceus/6501985
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Åland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'},
        {name: 'Algeria', code: 'DZ'},
        {name: 'American Samoa', code: 'AS'},
        {name: 'Andorra', code: 'AD'},
        {name: 'Angola', code: 'AO'},
        {name: 'Anguilla', code: 'AI'},
        {name: 'Antarctica', code: 'AQ'},
        {name: 'Antigua and Barbuda', code: 'AG'},
        {name: 'Argentina', code: 'AR'},
        {name: 'Armenia', code: 'AM'},
        {name: 'Aruba', code: 'AW'},
        {name: 'Australia', code: 'AU'},
        {name: 'Austria', code: 'AT'},
        {name: 'Azerbaijan', code: 'AZ'},
        {name: 'Bahamas', code: 'BS'},
        {name: 'Bahrain', code: 'BH'},
        {name: 'Bangladesh', code: 'BD'},
        {name: 'Barbados', code: 'BB'},
        {name: 'Belarus', code: 'BY'},
        {name: 'Belgium', code: 'BE'},
        {name: 'Belize', code: 'BZ'},
        {name: 'Benin', code: 'BJ'},
        {name: 'Bermuda', code: 'BM'},
        {name: 'Bhutan', code: 'BT'},
        {name: 'Bolivia', code: 'BO'},
        {name: 'Bosnia and Herzegovina', code: 'BA'},
        {name: 'Botswana', code: 'BW'},
        {name: 'Bouvet Island', code: 'BV'},
        {name: 'Brazil', code: 'BR'},
        {name: 'British Indian Ocean Territory', code: 'IO'},
        {name: 'Brunei Darussalam', code: 'BN'},
        {name: 'Bulgaria', code: 'BG'},
        {name: 'Burkina Faso', code: 'BF'},
        {name: 'Burundi', code: 'BI'},
        {name: 'Cambodia', code: 'KH'},
        {name: 'Cameroon', code: 'CM'},
        {name: 'Canada', code: 'CA'},
        {name: 'Cape Verde', code: 'CV'},
        {name: 'Cayman Islands', code: 'KY'},
        {name: 'Central African Republic', code: 'CF'},
        {name: 'Chad', code: 'TD'},
        {name: 'Chile', code: 'CL'},
        {name: 'China', code: 'CN'},
        {name: 'Christmas Island', code: 'CX'},
        {name: 'Cocos (Keeling) Islands', code: 'CC'},
        {name: 'Colombia', code: 'CO'},
        {name: 'Comoros', code: 'KM'},
        {name: 'Congo', code: 'CG'},
        {name: 'Congo, The Democratic Republic of the', code: 'CD'},
        {name: 'Cook Islands', code: 'CK'},
        {name: 'Costa Rica', code: 'CR'},
        {name: 'Cote D\'Ivoire', code: 'CI'},
        {name: 'Croatia', code: 'HR'},
        {name: 'Cuba', code: 'CU'},
        {name: 'Cyprus', code: 'CY'},
        {name: 'Czech Republic', code: 'CZ'},
        {name: 'Denmark', code: 'DK'},
        {name: 'Djibouti', code: 'DJ'},
        {name: 'Dominica', code: 'DM'},
        {name: 'Dominican Republic', code: 'DO'},
        {name: 'Ecuador', code: 'EC'},
        {name: 'Egypt', code: 'EG'},
        {name: 'El Salvador', code: 'SV'},
        {name: 'Equatorial Guinea', code: 'GQ'},
        {name: 'Eritrea', code: 'ER'},
        {name: 'Estonia', code: 'EE'},
        {name: 'Ethiopia', code: 'ET'},
        {name: 'Falkland Islands (Malvinas)', code: 'FK'},
        {name: 'Faroe Islands', code: 'FO'},
        {name: 'Fiji', code: 'FJ'},
        {name: 'Finland', code: 'FI'},
        {name: 'France', code: 'FR'},
        {name: 'French Guiana', code: 'GF'},
        {name: 'French Polynesia', code: 'PF'},
        {name: 'French Southern Territories', code: 'TF'},
        {name: 'Gabon', code: 'GA'},
        {name: 'Gambia', code: 'GM'},
        {name: 'Georgia', code: 'GE'},
        {name: 'Germany', code: 'DE'},
        {name: 'Ghana', code: 'GH'},
        {name: 'Gibraltar', code: 'GI'},
        {name: 'Greece', code: 'GR'},
        {name: 'Greenland', code: 'GL'},
        {name: 'Grenada', code: 'GD'},
        {name: 'Guadeloupe', code: 'GP'},
        {name: 'Guam', code: 'GU'},
        {name: 'Guatemala', code: 'GT'},
        {name: 'Guernsey', code: 'GG'},
        {name: 'Guinea', code: 'GN'},
        {name: 'Guinea-Bissau', code: 'GW'},
        {name: 'Guyana', code: 'GY'},
        {name: 'Haiti', code: 'HT'},
        {name: 'Heard Island and Mcdonald Islands', code: 'HM'},
        {name: 'Holy See (Vatican City State)', code: 'VA'},
        {name: 'Honduras', code: 'HN'},
        {name: 'Hong Kong', code: 'HK'},
        {name: 'Hungary', code: 'HU'},
        {name: 'Iceland', code: 'IS'},
        {name: 'India', code: 'IN'},
        {name: 'Indonesia', code: 'ID'},
        {name: 'Iran, Islamic Republic Of', code: 'IR'},
        {name: 'Iraq', code: 'IQ'},
        {name: 'Ireland', code: 'IE'},
        {name: 'Isle of Man', code: 'IM'},
        {name: 'Israel', code: 'IL'},
        {name: 'Italy', code: 'IT'},
        {name: 'Jamaica', code: 'JM'},
        {name: 'Japan', code: 'JP'},
        {name: 'Jersey', code: 'JE'},
        {name: 'Jordan', code: 'JO'},
        {name: 'Kazakhstan', code: 'KZ'},
        {name: 'Kenya', code: 'KE'},
        {name: 'Kiribati', code: 'KI'},
        {name: 'Korea, Democratic People\'s Republic of', code: 'KP'},
        {name: 'Korea, Republic of', code: 'KR'},
        {name: 'Kuwait', code: 'KW'},
        {name: 'Kyrgyzstan', code: 'KG'},
        {name: 'Lao People\'s Democratic Republic', code: 'LA'},
        {name: 'Latvia', code: 'LV'},
        {name: 'Lebanon', code: 'LB'},
        {name: 'Lesotho', code: 'LS'},
        {name: 'Liberia', code: 'LR'},
        {name: 'Libyan Arab Jamahiriya', code: 'LY'},
        {name: 'Liechtenstein', code: 'LI'},
        {name: 'Lithuania', code: 'LT'},
        {name: 'Luxembourg', code: 'LU'},
        {name: 'Macao', code: 'MO'},
        {name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'},
        {name: 'Madagascar', code: 'MG'},
        {name: 'Malawi', code: 'MW'},
        {name: 'Malaysia', code: 'MY'},
        {name: 'Maldives', code: 'MV'},
        {name: 'Mali', code: 'ML'},
        {name: 'Malta', code: 'MT'},
        {name: 'Marshall Islands', code: 'MH'},
        {name: 'Martinique', code: 'MQ'},
        {name: 'Mauritania', code: 'MR'},
        {name: 'Mauritius', code: 'MU'},
        {name: 'Mayotte', code: 'YT'},
        {name: 'Mexico', code: 'MX'},
        {name: 'Micronesia, Federated States of', code: 'FM'},
        {name: 'Moldova, Republic of', code: 'MD'},
        {name: 'Monaco', code: 'MC'},
        {name: 'Mongolia', code: 'MN'},
        {name: 'Montserrat', code: 'MS'},
        {name: 'Morocco', code: 'MA'},
        {name: 'Mozambique', code: 'MZ'},
        {name: 'Myanmar', code: 'MM'},
        {name: 'Namibia', code: 'NA'},
        {name: 'Nauru', code: 'NR'},
        {name: 'Nepal', code: 'NP'},
        {name: 'Netherlands', code: 'NL'},
        {name: 'Netherlands Antilles', code: 'AN'},
        {name: 'New Caledonia', code: 'NC'},
        {name: 'New Zealand', code: 'NZ'},
        {name: 'Nicaragua', code: 'NI'},
        {name: 'Niger', code: 'NE'},
        {name: 'Nigeria', code: 'NG'},
        {name: 'Niue', code: 'NU'},
        {name: 'Norfolk Island', code: 'NF'},
        {name: 'Northern Mariana Islands', code: 'MP'},
        {name: 'Norway', code: 'NO'},
        {name: 'Oman', code: 'OM'},
        {name: 'Pakistan', code: 'PK'},
        {name: 'Palau', code: 'PW'},
        {name: 'Palestinian Territory, Occupied', code: 'PS'},
        {name: 'Panama', code: 'PA'},
        {name: 'Papua New Guinea', code: 'PG'},
        {name: 'Paraguay', code: 'PY'},
        {name: 'Peru', code: 'PE'},
        {name: 'Philippines', code: 'PH'},
        {name: 'Pitcairn', code: 'PN'},
        {name: 'Poland', code: 'PL'},
        {name: 'Portugal', code: 'PT'},
        {name: 'Puerto Rico', code: 'PR'},
        {name: 'Qatar', code: 'QA'},
        {name: 'Reunion', code: 'RE'},
        {name: 'Romania', code: 'RO'},
        {name: 'Russian Federation', code: 'RU'},
        {name: 'Rwanda', code: 'RW'},
        {name: 'Saint Helena', code: 'SH'},
        {name: 'Saint Kitts and Nevis', code: 'KN'},
        {name: 'Saint Lucia', code: 'LC'},
        {name: 'Saint Pierre and Miquelon', code: 'PM'},
        {name: 'Saint Vincent and the Grenadines', code: 'VC'},
        {name: 'Samoa', code: 'WS'},
        {name: 'San Marino', code: 'SM'},
        {name: 'Sao Tome and Principe', code: 'ST'},
        {name: 'Saudi Arabia', code: 'SA'},
        {name: 'Senegal', code: 'SN'},
        {name: 'Serbia and Montenegro', code: 'CS'},
        {name: 'Seychelles', code: 'SC'},
        {name: 'Sierra Leone', code: 'SL'},
        {name: 'Singapore', code: 'SG'},
        {name: 'Slovakia', code: 'SK'},
        {name: 'Slovenia', code: 'SI'},
        {name: 'Solomon Islands', code: 'SB'},
        {name: 'Somalia', code: 'SO'},
        {name: 'South Africa', code: 'ZA'},
        {name: 'South Georgia and the South Sandwich Islands', code: 'GS'},
        {name: 'Spain', code: 'ES'},
        {name: 'Sri Lanka', code: 'LK'},
        {name: 'Sudan', code: 'SD'},
        {name: 'Suriname', code: 'SR'},
        {name: 'Svalbard and Jan Mayen', code: 'SJ'},
        {name: 'Swaziland', code: 'SZ'},
        {name: 'Sweden', code: 'SE'},
        {name: 'Switzerland', code: 'CH'},
        {name: 'Syrian Arab Republic', code: 'SY'},
        {name: 'Taiwan, Province of China', code: 'TW'},
        {name: 'Tajikistan', code: 'TJ'},
        {name: 'Tanzania, United Republic of', code: 'TZ'},
        {name: 'Thailand', code: 'TH'},
        {name: 'Timor-Leste', code: 'TL'},
        {name: 'Togo', code: 'TG'},
        {name: 'Tokelau', code: 'TK'},
        {name: 'Tonga', code: 'TO'},
        {name: 'Trinidad and Tobago', code: 'TT'},
        {name: 'Tunisia', code: 'TN'},
        {name: 'Turkey', code: 'TR'},
        {name: 'Turkmenistan', code: 'TM'},
        {name: 'Turks and Caicos Islands', code: 'TC'},
        {name: 'Tuvalu', code: 'TV'},
        {name: 'Uganda', code: 'UG'},
        {name: 'Ukraine', code: 'UA'},
        {name: 'United Arab Emirates', code: 'AE'},
        {name: 'United Kingdom', code: 'GB'},
        {name: 'United States', code: 'US'},
        {name: 'United States Minor Outlying Islands', code: 'UM'},
        {name: 'Uruguay', code: 'UY'},
        {name: 'Uzbekistan', code: 'UZ'},
        {name: 'Vanuatu', code: 'VU'},
        {name: 'Venezuela', code: 'VE'},
        {name: 'Vietnam', code: 'VN'},
        {name: 'Virgin Islands, British', code: 'VG'},
        {name: 'Virgin Islands, U.S.', code: 'VI'},
        {name: 'Wallis and Futuna', code: 'WF'},
        {name: 'Western Sahara', code: 'EH'},
        {name: 'Yemen', code: 'YE'},
        {name: 'Zambia', code: 'ZM'},
        {name: 'Zimbabwe', code: 'ZW'}
    ];


    ChangePasswordCtrl.$inject = ['$scope', '$http', 'OUAuth', 'CoreService'];

    function ChangePasswordCtrl($scope, $http, OUAuth, CoreService) {

        $scope.userInfo = JSON.parse(OUAuth.currentUserData);
        $scope.user = {};


        $scope.save = function () {
            $scope.err = '';
            $('#changePwdBtn').text("Processing...");
            $scope.isProcessing = true;

            $scope.userInfo.password = $scope.user.newPassword;
            var url = 'api/users/login?include=user';

            $http.post(url, {
                email: $scope.userInfo.email,
                password: $scope.user.oldPassword
            }).success(function (response) {
                $http.put('api/users/' + $scope.userInfo.id + '?access_token=' + OUAuth.accessTokenId, $scope.userInfo).success(function (res) {
                    CoreService.toastSuccess('Your password has been changed!');
                    $('#changePwdBtn').text("UPDATE");
                    $scope.isProcessing = false;
                    $scope.user = {};
                    $scope.form.$setPristine();

                }).error(function (err) {
                    CoreService.toastError('Internal error!', 'Failed to change your password');

                    $('#changePwdBtn').text("UPDATE");
                    $scope.isProcessing = false;
                });
            }).error(function (err) {
                $scope.err = 'Enter correct password';
                $('#changePwdBtn').text("UPDATE");
                $scope.isProcessing = false;

                $scope.form.$setPristine();
            })
        }

        $scope.clear = function () {

            $scope.err = '';
        }

    }


    ProfileCtrl.$inject = ['$scope', '$rootScope', '$http', 'CoreService', 'OUAuth', 'FileUploader'];

    function ProfileCtrl($scope, $rootScope, $http, CoreService, OUAuth, FileUploader) {


        $rootScope.relaod = false;

        $scope.userInfo = JSON.parse(OUAuth.currentUserData);

        $scope.company = {};

        $scope.countries = countries;

        $http.get('api/Companies/' + $scope.userInfo.companyId + '?access_token=' + OUAuth.accessTokenId).success(function (res) {
            $scope.company = res;
            // $scope.countries = {selected : res.country};
        }).error(function (err) {
            CoreService.toastError('Oops',
                'Error ' + err.message);
        });


        $scope.refreshAddresses = function (address) {
            var params = {address: address, sensor: false};
            return $http.get(
                'http://maps.googleapis.com/maps/api/geocode/json',
                {params: params}
            ).then(function (response) {

                    $scope.addresses = response.data.results;
                });
        };


        var uploader = $scope.uploader = new FileUploader({

            url: 'api/containers/files/upload',
            formData: [
                {
                    key: 'value'
                }]
        });

        // CALLBACKS
        uploader.onAfterAddingFile = function (item) {
            if (item.file.size > 1024 * 1024 * 1) {
                CoreService.toastWarning('File size is exceed!', 'Please upload profile image less than 1 MB');
                item.remove();
            }
            var ext = item.file.name.slice(item.file.name.lastIndexOf('.') + 1);
            if (ext.toLocaleLowerCase() === 'jpg' || ext.toLocaleLowerCase() === 'png' ||
                ext.toLocaleLowerCase() === 'jpeg') {
                item.file.name = new Date().getTime() + '_profile_image' + '.' + ext;
                $scope.loading = true;
                item.upload();

            } else {
                CoreService.toastWarning('File extension .' + ext + ' is allowed!', 'Please upload profile image with following extensions jpg/jpeg/png');
                item.remove();
            }
        };

        uploader.onErrorItem = function (fileItem, response, status, headers) {
            CoreService.toastError('Error in profile image uploading', 'We received a ' + status + ' error from the API!');
            $scope.loading = false;
        };

        uploader.onCompleteItem = function (fileItem, response, status) {

            if (status == 200) {
                $scope.userInfo.photoLink = fileItem.file.name;
                $scope.saveImage();
                $scope.loading = false;

            }
        };

        /**
         * The function to update user detail
         * @returns {*}
         */
        $scope.saveImage = function () {

            $http.put('api/users/' + $scope.userInfo.id + '?access_token=' + OUAuth.accessTokenId, $scope.userInfo).success(function (res) {
                OUAuth.currentUserData = JSON.stringify(res);
                OUAuth.save();

                $rootScope.$broadcast('reload', $rootScope.reload);
                CoreService.toastSuccess('Profile Image Successfully Updated!');
            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
            });
        };

        /**
         * The function to update user detail
         * @returns {*}
         */
        $scope.saveUser = function () {
            $scope.updateCompanyInfo();
            $http.put('api/users/' + $scope.userInfo.id + '?access_token=' + OUAuth.accessTokenId, $scope.userInfo).success(function (res) {

                OUAuth.currentUserData = JSON.stringify(res);
                OUAuth.save();
                $rootScope.$broadcast('reload', $rootScope.reload);
                CoreService.toastSuccess('Profile Successfully Updated!');
            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
            });
        };

        /**
         * The function to update company detail
         * @returns {*}
         */
        $scope.updateCompanyInfo = function () {

            if ($scope.company.address)
                $scope.company.address = $scope.company.address.formatted_address;
            if ($scope.company.country)
                $scope.company.country = $scope.company.country.name;


            $http.put('api/Companies', $scope.company).success(function (res) {
                console.log(res)
            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
            });
        };
    }


    UpdateCtrl.$inject = ['$scope', '$rootScope', '$http', 'CoreService', 'OUAuth', '$state', 'SyncFromAwsService', 'CheckEmailService', '$timeout'];
    function UpdateCtrl($scope, $rootScope, $http, CoreService, OUAuth, $state, SyncFromAwsService, CheckEmailService, $timeout) {

        $rootScope.relaod = false;
        $scope.countries = countries;

        $scope.user = JSON.parse(OUAuth.currentUserData);
        $scope.company = {};
        $scope.inviteUser = {};
        $scope.inviteUser.role = 'user';
        $scope.inviteUser.createdBy = $scope.user.email;
        $scope.inviteUser.companyId = $scope.user.companyId;
        $scope.key = {};
        $scope.key.companyId = $scope.user.companyId;

        $http.get('api/Companies/' + $scope.user.companyId + '?access_token=' + OUAuth.accessTokenId).success(function (res) {
            $scope.company = res;
        }).error(function (err) {

        });
        $scope.refreshAddresses = function (address) {
            var params = {address: address, sensor: false};
            return $http.get(
                'http://maps.googleapis.com/maps/api/geocode/json',
                {params: params}
            ).then(function (response) {
                    $scope.addresses = response.data.results;
                });
        };

         $scope.isProcessing = false;

        /**
         * The function to update user detail
         * @returns {*}
         */
        $scope.update = function () {
            $('#submitBtn').text("Processing...");
            $scope.isProcessing = true;

            $scope.updateKey();
            // $scope.user already updated!
            $http.put('api/users/' + $scope.user.id + '?access_token=' + OUAuth.accessTokenId, $scope.user).success(function (res) {
                OUAuth.currentUserData = JSON.stringify(res);
                OUAuth.save();
                $rootScope.$broadcast('reload', $rootScope.reload);
            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
            });
        };

        /**
         * The function to update company detail
         * @returns {*}
         */
        $scope.updateCompanyInfo = function (id) {
            $scope.company.keyId = id;

            if ($scope.company.address)
                $scope.company.address = $scope.company.address.formatted_address;
            if ($scope.company.country)
                $scope.company.country = $scope.company.country.name;
            $http.put('api/Companies', $scope.company).success(function (res) {
                OUAuth.isKeyExist = true;
                OUAuth.save();
                $rootScope.$broadcast('reload', $rootScope.reload);

                $timeout(function () {
                    CoreService.toastSuccess('Your profile is updated successfully!');
                    $('#submitBtn').text("SUBMIT");
                         $scope.isProcessing = false;
                    $state.go('app.dashboard');

                }, 3500);

            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
                     $('#submitBtn').text("SUBMIT");
                         $scope.isProcessing = false;
            });
        };

        /**
         * The function to save invite user detail
         * @returns {*}
         */
        $scope.updateInviteUserInfo = function () {
            $('#inviteBtn').text("Processing...");
            $scope.isProcessing = true;
            $http.post('api/Invites?access_token=' + OUAuth.accessTokenId, $scope.inviteUser).success(function (res) {

                $scope.inviteId = res.id;
                $('#myModal_autocomplete').modal('hide');
                CoreService.toastSuccess('Invitation send successfully!');
                $('#inviteBtn').text("INVITE");
                $scope.isProcessing = false;
            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
                $('#inviteBtn').text("INVITE");
                $scope.isProcessing = false;
            });
        };

        $scope.checkEmail = function (email) {
            $scope.alreadyExit = '';
            CheckEmailService.check(email).then(function (response) {
                if (response && response.data.length > 0) {
                    $scope.alreadyExit = 'Email ID already exist'
                }
            }, function (err) {
                console.log(err);
            });
        }

        /**
         * The function to save invite user detail
         * @returns {*}
         */
        $scope.updateKey = function () {
            $http.post('api/KeyManagements?access_token=' + OUAuth.accessTokenId, $scope.key).success(function (res) {

                $scope.updateCompanyInfo(res.id);
                SyncFromAwsService.sync($scope.user.companyId);

            }).error(function (err) {
                console.log(err);
                CoreService.toastError('Oops',
                    'Error ' + err.message);
            });

        };
        $scope.tooltip = {title: 'Invite!'}
    }


    KeyCtrl.$inject = ['$scope', 'OUAuth', '$http', 'CoreService', 'SyncFromAwsService'];
    function KeyCtrl($scope, OUAuth, $http, CoreService, SyncFromAwsService) {

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);

        }

        $scope.keyMang = {};

        $http.get('api/KeyManagements/getKey?id=' + $scope.userData.companyId + '&access_token=' + OUAuth.accessTokenId).success(function (res) {

            if (res.data) {
                $scope.keyMang = res.data;
            }
        }).error(function (err) {

        });

        // This object will be filled by the form

        $scope.keyMang.companyId = $scope.userData.companyId;

        // Register the login() function
        $scope.keyStore = function () {

            $http.put('api/KeyManagements?access_token=' + OUAuth.accessTokenId, $scope.keyMang).success(function (res) {
                CoreService.toastSuccess('Your key is updated successfully!');
                SyncFromAwsService.sync($scope.user.companyId);
                $scope.form.$setPristine();
            }).error(function (err) {
                console.log(err);
                CoreService.toastError('Oops ', 'Error : ' + err.message);
            });

        };
    }

    UserCtrl.$inject = ['$scope', '$http', 'CoreService', 'OUAuth', '$filter', 'NgTableParams', 'CheckEmailService'];
    function UserCtrl($scope, $http, CoreService, OUAuth, $filter, NgTableParams, CheckEmailService) {

        if (OUAuth.currentUserData) {
            $scope.userData = JSON.parse(OUAuth.currentUserData);
        }
        $scope.data = [];
        $scope.countVal = 10;

        $scope.load = function () {

            $scope.loading = true;
            $http.get('api/users?filter[where][companyId] =' + $scope.userData.companyId + '&access_token=' + OUAuth.accessTokenId)
                .success(function (res) {
                    $scope.data = res;
                    initiateNgTable();

                }).error(function (err) {
                    console.log(err);
                    CoreService.toastError('Oops', 'Error in loading instance schedulers')
                }).finally(function () {
                    $scope.loading = false;
                });
        };
        $scope.load();


        function initiateNgTable() {
            $scope.tableParams = new NgTableParams({
                page: 1,            // show first page
                count: 10,          // count per page
                sorting: {
                    name: 'asc'     // initial sorting
                }
            }, {
                counts: [],
                total: $scope.data.length, // length of data
                getData: function ($defer, params) {


                    // use build-in angular filter
                    var orderedData = params.sorting() ?
                        $filter('orderBy')($scope.data, params.orderBy()) :
                        $scope.data;
                    orderedData = params.filter() ?
                        $filter('filter')(orderedData, params.filter()) :
                        orderedData;

                    params.total($scope.data.length); // set total for recalc pagination

                    if (((params.page() * params.count()) - params.count()) === params.total()) {
                        params.page(params.page() - 1);
                    }

                    orderedData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());


                    $defer.resolve(orderedData);
                }
            });
        }


        /**
         * Function to delete schedulerInfo
         * @param schedule
         *
         */
        $scope.delete = function (schedule) {

            CoreService.confirm('Are you sure?', 'Disable user', function () {


                },
                function () {
                    return false;
                });
        };


        $scope.inviteUser = {};
        $scope.inviteUser.role = 'user';
        $scope.inviteUser.createdBy = $scope.userData.email;
        $scope.inviteUser.companyId = $scope.userData.companyId;


        /**
         * The function to save invite user detail
         * @returns {*}
         */
        $scope.updateInviteUserInfo = function () {
            $('#inviteBtn').text("Processing...");
            $scope.isProcessing = true;
            $http.post('api/Invites?access_token=' + OUAuth.accessTokenId, $scope.inviteUser).success(function (res) {

                $scope.inviteId = res.id;
                $('#myModal_autocomplete').modal('hide');
                CoreService.toastSuccess('Invitation send successfully!');
                $('#inviteBtn').text("INVITE");
                $scope.isProcessing = false;
            }).error(function (err) {
                CoreService.toastError('Oops',
                    'Error ' + err.message);
                $('#inviteBtn').text("INVITE");
                $scope.isProcessing = false;
            });
        };

        $scope.checkEmail = function (email) {
            $scope.alreadyExit = '';
            CheckEmailService.check(email).then(function (response) {
                if (response && response.data.length > 0) {
                    $scope.alreadyExit = 'Email ID already exist'
                }
            }, function (err) {
                console.log(err);


            });
        }

    }
})();
