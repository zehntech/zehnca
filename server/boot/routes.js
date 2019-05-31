var config = require('../config.json');

module.exports = function (app) {
    var User = app.models.user;
    var Invite = app.models.Invite;

    //verified
    app.get('/verified', function (req, res) {

        res.render('verified');
    });


  //send an email with instructions to reset an existing user's password
  app.post('/request-password-reset', function(req, res, next) {
    User.resetPassword({
      email: req.body.email
    }, function(err) {
      if (err) return res.status(401).send(err);

      res.render('response', {
        title: 'Password reset requested',
        content: 'Check your email for further instructions',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
    });
  });

    //show password reset form
    app.get('/reset-password', function (req, res,next) {
        if (!req.accessToken) return res.sendStatus(401);

        res.render('password-reset', {
            accessToken: req.accessToken.id
        });
    });


    //reset the user's password
    app.post('/reset-password', function (req, res, next) {
        if (!req.accessToken) return res.sendStatus(401);


        //verify passwords match
        if (!req.body.password || !req.body.confirmation ||
            req.body.password !== req.body.confirmation) {
            return res.sendStatus(400, new Error('Passwords do not match'));
        }

        User.findById(req.accessToken.userId, function (err, user) {
            if (err) return res.sendStatus(404);
            user.updateAttribute('password', req.body.password, function (err) {
                if (err) return res.sendStatus(404);
                console.log('> password reset processed successfully');
                res.writeHead(303, {
                    'Location': config.domain+'/#/access/signin'
                });
                res.end();
            });
        });
    });


    //show password reset form
    app.get('/invite', function (req, res) {

        if (!req.query.token) return res.sendStatus(401);

        Invite.findOne({
            where: {
                token: req.query.token
            }
        }, function (err, user) {
            if (err) return res.sendStatus(401);
            if (!user) {
                res.render('response', {
                    title: 'Link expired',
                    content: 'Link your are trying' +
                    ' to access either wrong or expire',
                    redirectTo: '/',
                    redirectToLinkText: 'Log in'
                });
            } else {
                res.render('register', {
                    token: req.query.token,
                    user: user
                });
            }
        });


    });


    //reset the user's password
    app.post('/invite', function (req, res) {
        if (!req.query.token) return res.sendStatus(401);

        //verify passwords match
        if (!req.body.password || !req.body.confirmation ||
            req.body.password !== req.body.confirmation) {
            return res.sendStatus(400, new Error('Passwords do not match'));
        }

        Invite.findOne({
            where: {
                token: req.query.token
            }
        }, function (err, data) {
            if (err) {
                console.log(err);
                return res.sendStatus(401);
            }

            var user1 = new User({
                name: req.body.name,
                password: req.body.password,
                email: data.email,
                role: data.role,
                emailVerified: true,
                companyId: data.companyId
            });
            user1.save(function (err) {
                if (err){

                    return res.sendStatus(err.statusCode);
                }

                data.token = 'invalid';
                data.save(function (err, res) {
                    if (err)
                        console.log(err);
                    else {
                        console.log('data');
                        console.log(res);
                    }


                });
                console.log('> User register successfully');
                res.writeHead(303, {
                    'Location': config.domain+'/#/access/signin'
                });
                res.end();


            });
        });
    });

};
