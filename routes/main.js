var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.session.user){
    return res.redirect('/users/login');
  }
  res.render('main', { title: 'ITS 물품대여소' });
});

router.get('/settingForItemList', function(req, res, next) {
    if(!req.session.user){
        return res.redirect('/users/login');
    }
    const { itemName, status, img} = null;

    const sql = 'SELECT * FROM Items';
    db.query(sql, (err, result) => {
      if (err) {
        console.error('아이템 리스트 불러오기 실패', err);
        return res.status(500).send('아이템 리스트 불러오기 실패');
      }
      console.log('아이템 리스트 불러오기 성공:', result);
      res.render('/',{itemName: itemName, status: status, img:img}); // 성공 후 관리자 페이지로 이동
  });
})

module.exports = router;
