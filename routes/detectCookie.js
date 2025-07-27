/*
nfc 모듈로 들어온 녀석을 처리하는 과정을 여기다 구현할거야
이건 내가 한다고 하지
*/



const express = require('express');
var router = express.Router();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require('mysql'); //mysql 모듈 불러오기

//쿠키 목록 조회 라우트 테스트 용
router.get('/detectCookie',(req,res) => {
    // 쿠키 읽기
    const cookieValue = req.cookies.reservedItems;
    if (cookieValue) {
        console.log("reservedItems cookie:", cookieValue);
        const numberPart = cookieValue.split(':')[0];
        console.log("이거 쿠키 번호: ", numberPart);
        res.json({success: true, message: '쿠키에서 숫자 부분을 추출했습니다.', number: numberPart});
    }
    else {
        res.status(404).json({ success: false, message: '쿠키가 존재하지 않습니다.' });
    }

})



/*
쿠키에 담긴 물품을 토대로 대여 시작하게 하는 라우트 젤 중요한 곳

우선 쿠키에 있는 아이디가 현재 로그인한 아이디와 동일한지 비교
그 다음 서버에 저장된 사용자가 빌리려한 아이템의 리스트와 쿠키의 리스트가 맞는지 비교
그 후 예약 쿠키를 없애고, 대여를 시작하도록 처리하는 기능이 verify.js 에 있는 기능
이걸 아래 페이지에서 post요청을 보내서 받고 처리하는 형태로 할 예정
* */
router.get('/startRentingItem/:seed',(req,res) => {
    //구버전const urlSeed = req.baseUrl.replace('/', ''); // /abcdef1234 → abcdef1234
    const urlSeed = req.params.seed;
    const { currentSeed, lastSeed } = req;
    if(!currentSeed || !lastSeed) return res.status(404).send('랜덤시드에 오류 발생');

    if (urlSeed === currentSeed || urlSeed === lastSeed) {
     if (!req.session.user) {
         return res.status(404).send('로그인부터 하고 오십쇼');
     }
     res.render('ckCookie',{title:"쿠키 거시기용"});
    } else {
     res.status(404).send('시드가 다르군. 너 죽고싶니?');
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