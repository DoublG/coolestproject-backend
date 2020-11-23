'use strict';

var utils = require('../utils/writer.js');
var Login = require('../service/LoginService');

module.exports.loginPOST = function loginPOST(req, res, next) {
  var registration = req.swagger.params['login'].value;
  var logged_in_user = req.user;
  Login.loginPOST(logged_in_user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
module.exports.mailLoginPOST = function mailLoginPOST(req, res, next) {
  var registration = req.swagger.params['login'].value;
  Login.mailLoginPOST(registration)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

