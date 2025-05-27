var express = require('express');
const db = require("./routes/IMS_db");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.session.user){
    return res.redirect('/users/login');
  }
  res.render('main', { title: 'ITS 물품대여소' });
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
