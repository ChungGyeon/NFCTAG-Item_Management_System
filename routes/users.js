var express = require('express');
var router = express.Router();
const { db, testPageConnect } = require('./IMS_db'); //IMS_db.js에서 db 연결변수 가져오기

router.get('/', (req, res) => {
    res.render('login');
})

router.get('/login', (req, res) => {
  res.render('login');
});


router.post('/login', async (req, res) => {
  const { studentnum, password } = req.body;

  const sql = 'SELECT studentNum, password FROM Users WHERE studentNum = ? AND password = ?';
  db.query(sql, [studentnum, password], (err, result) => {
    if(err){
      console.log("DB 오류 : ", err);
    }
    if(result.length <= 0){
      res.status(401).send('학번 또는 비밀번호가 틀렸습니다.');
    }
    else {
      if(!req.session.user) {
        req.session.user = {
          studentnum: studentnum,
          password: password
        };
      }
      res.json({ success: true });
    }
  });
  /*
  // 여기서 DB 확인 또는 검증 작업 수행
  if (studentnum === '2022039115' && password === '1234') {
    if(!req.session.user) {
      req.session.user = {
        studentnum: studentnum,
        password: password
      };
    }
    res.json({ success: true });
  } else {
    res.status(401).send('학번 또는 비밀번호가 틀렸습니다.');
  }
  */
});


module.exports = router;
