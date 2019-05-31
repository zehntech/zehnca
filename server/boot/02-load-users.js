'use strict';

// to enable these logs set `DEBUG=boot:02-load-users` or `DEBUG=boot:*`
var log = require('debug')('boot:02-load-users');

module.exports = function(app) {

  createDefaultUsers();

  function createDefaultUsers() {

    log('Creating roles and users');

    var User = app.models.User;
    var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;

    var users = [];
    var roles = [{
      name: 'admin',
      users: [{
        name: 'Tony Stark',
        email: 'admin@zehnaws.com',
        username: 'admin@zehnaws.com',
        password: '123456',
        emailVerified: true
        }]
      }, {
      name: 'users',
      users: [{
        name: 'Guest User',
        email: 'user@zehnaws.com',
        username: 'User',
        password: '123456',
        emailVerified: true
      }]
    }];

    roles.forEach(function(role) {
      Role.findOrCreate(
        {where: {name: role.name}}, // find
        {name: role.name}, // create
        function(err, createdRole) {
          if (err) {
            console.error('error running findOrCreate('+role.name+')', err);
          }

          role.users.forEach(function(roleUser) {
            User.findOrCreate(
              {where: {username: roleUser.username}}, // find
              roleUser, // create
              function(err, createdUser) {
                if (err) {
                  console.error('error creating roleUser', err);
                }

                createdRole.principals.create({
                  principalType: RoleMapping.USER,
                  principalId: createdUser.id
                }, function(err) {
                  if (err) {
                    console.error('error creating rolePrincipal', err);
                  }
                  users.push(createdUser);
                });
              });
          });
        });
    });
    return users;
  }

};
