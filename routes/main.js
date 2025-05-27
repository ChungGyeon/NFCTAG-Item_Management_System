var express = require('express');
var router = express.Router();
const db = require('./IMS_db'); //IMS_db.js에서 db 연결변수 가져오기

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.session.user){
    return res.redirect('/users/login');
  }
  //res.render('main', { title: 'ITS 물품대여소' });
  res.redirect('/LoadMysql');
});


router.get('/LoadMysql', (req, res) => {
    const sql = 'SELECT itemName, img FROM Items';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB 오류:', err);
        }

        res.render('main',{ items: results });
    });
});
module.exports = router;


//히히 오줌발싸