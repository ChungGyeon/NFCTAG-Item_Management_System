/*
reservedList 쿠키를 감지하는 라우트

/startRentingItem/:seed 는 랜덤 시드를 적용하여 nfc모듈에서 생성하는 주소로만 접근가능하게 만든 파일
이 라우트 전체가 랜덤시드 영향을 받고 있어 실질적인 쿠키 처리는 verify.js에서 처리함

이곳에선 쿠키가 있으면 쿠키를 처리하는 페이지로 넘겨주고
로그인이 안되어있거나 잘못된 시드로 접근시 각각의 원인을 안내함

잘못된 시드를 입력하면 이스터에그를 해놨지 ㅋㅋ
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
         return res.status(403).send('로그인부터 하고 오십쇼');
     }
     res.render('ckCookie',{title:"ITS-IMS : 쿠키 읽는 중"});
    } else {
     res.status(400).render('wrongAccess',{title:"이전시드 감지"});
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