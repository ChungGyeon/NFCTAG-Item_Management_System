var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.session.user){
    return res.redirect('/users/login');
  }
  //res.render('main', { title: 'ITS 물품대여소' });
  res.redirect('/LoadMysql');
});

module.exports = router;
