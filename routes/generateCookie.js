const express = require('express');
var router = express.Router();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require('mysql'); //mysql 모듈 불러오기
//const db = require('./routes/IMS_db'); //IMS_db.js에서 db 연결변수 가져오기, testPageConnect 변수는 가져오지않음

// 쿠키 생성 라우트 테스트용임
router.get('/generateCookie', (req, res) => {
    //쿠키 하나에 여러개 넣기 위한 그시기
    let infoObj = {};
    const keys = ['object1', 'object2', 'object3'];
    const values = ['싸인팬', '실험복', '공학용계산기'];

    for (let i = 0; i < keys.length; i++) {
        infoObj[keys[i]] = values[i];
    }
        // 쿠키 설정
    res.cookie('info', JSON.stringify(infoObj),
        { maxAge: 900000}
        { maxAge: 1 * 60 * 1000}
    );

    res.json({ success: true, message: '쿠키가 생성되었습니다.' });
});

//쿠키 목록 조회 라우트
router.get('/detectCookie',(req,res) =>{
    // 쿠키 읽기
    const cookieValue = JSON.parse(req.cookies.info || '{}');
    if (cookieValue) {
        var result = {}
        for (const key in cookieValue) {
            if( cookieValue.hasOwnProperty(key) ) {
                result[key] = cookieValue[key];
            }
        }
        res.json({success: true, message: '쿠키가 존재합니다.', data: result});
    }
    else {
        res.status(404).json({ success: false, message: '쿠키가 존재하지 않습니다.' });
    }

})
module.exports = router;

/*
//express 코드임
//쿠키에 접근
console.log(req.cookies);

//쿠키 생성 & 변경
res.cookie('test-cookie','1234');

// 쿠키 생성 + 옵션
res.cookie('test-cookie','1234',{
    maxAge: 60*60*24,
    httpOnly: true,
    secure: true
});

//쿠키 삭제
res.clearCookie(('test-cookie');

// 쿠키 설정
app.get('/set-cookie', (req, res) => {
  res.cookie('username', 'imjaehyeog', { maxAge: 900000, httpOnly: true });
  res.send('쿠키 설정됨');
});

// 쿠키 읽기
app.get('/get-cookie', (req, res) => {
  res.send(req.cookies);  // { username: 'imjaehyeog' }
});
*/
