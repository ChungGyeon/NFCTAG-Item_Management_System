/*
* 원래 쿠키를 생성하는 라우트
* 하지만 쿠키 생성은 main.js에서 실질적으로 이루어짐
* 나중에 여기로 옳기거나 이 파일은 삭제 예정이다
*
* */

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
        // 쿠키
    res.cookie('info', JSON.stringify(infoObj),
        { maxAge: 900000}
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
// 아이템 추가 라우트 (임시 운영 중)
const { db } = require('./IMS_db');

router.post('/addItem', (req, res) => {
    const { itemName } = req.body;

    if (!itemName) {
        return res.status(400).json({ message: '아이템 이름이 필요합니다.' });
    }

    const sql = 'INSERT INTO Items (itemName, status) VALUES (?, 0)';
    db.query(sql, [itemName], (err, result) => {
        if (err) {
            console.error('DB 오류:', err);
            return res.status(500).json({ message: 'DB 오류 발생' });
        }
        return res.status(200).json({ message: '아이템 추가 성공!' });
    });
});