/*
 이용자가 주도적으로 요청하는 내용을 처리하는 라우트
 로그인,회원가입,로그아웃 등
 */
const express = require('express');
const router = express.Router();
const { db, testPageConnect } = require('./IMS_db'); //IMS_db.js에서 db 연결변수 가져오기

router.get('/', (req, res) => {
    res.render('login');
})

router.get('/login', (req, res) => {
  res.render('login', {title: '로그인'});
});


router.post('/login', async (req, res) => { //login
  const { studentnum, password } = req.body;

  const sql = 'SELECT studentNum, password FROM Users WHERE studentNum = ? AND password = ?';
  db.query(sql, [studentnum, password], (err, result) => {
    if(err){
      console.log("DB 오류 : ", err); //error
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
});


//계정추가 구문, 새로운 방식을 습득했다
router.post('/signUpquery', async (req,res)=> {
  const {studentnum, name, grade, password} = req.body;

  if (!studentnum || !name || !grade || !password) {
    return res.status(400).json({message: '모든 필드를 입력해주세요.'});
  }
  // 계정 중복 확인
  const sql = 'SELECT * FROM Users WHERE studentNum = ?';
  db.query(sql, [studentnum], (err, result) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({message: '서버 오류가 발생했습니다.'});
    }

    if (result.length > 0) {
      return res.status(409).json({message: '이미 존재하는 계정입니다.'});
    }
    else {
      // 중복이 없으면 계정 추가
      const insertSql = 'INSERT INTO Users (name, studentNum, grade, password) VALUES (?, ?, ?, ?)';
      db.query(insertSql, [name, studentnum, grade, password], (err, result) => {
        if (err) {
          console.error('DB 오류:', err);
          return res.status(500).json({message: '서버 오류가 발생했습니다.'});
        }
        return res.status(201).json({message: '계정이 성공적으로 추가되었습니다.'});
      });
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 삭제 실패:', err);
      return res.status(500).send('로그아웃 중 오류 발생');
    }

    res.clearCookie('connect.sid');       // 세션 쿠키 삭제
    res.clearCookie('reservedItems');     // 예약 쿠키 삭제

    res.redirect('/users/login');         // 로그인 페이지로 이동
  });
});



module.exports = router;
