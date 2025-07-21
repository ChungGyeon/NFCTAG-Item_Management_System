const express = require('express');
const router = express.Router();
const { db } = require('./IMS_db'); // DB 연결

let currentSeed = generateRandomSeed();
let lastSeed = null; // (선택) 이전 시드도 잠깐 허용하려면 사용

function generateRandomSeed() {
    return Math.random().toString(36).substr(2, 10);
}

// 5분마다 시드 갱신
setInterval(() => {
    lastSeed = currentSeed;
    currentSeed = generateRandomSeed();
    console.log('새 시드:', currentSeed);
}, 20*1000);

/* 테스트 후 삭제 예정
router.get('/get-current-seed', (req, res) => {
    res.json({ seed: currentSeed });
});

router.use('/:seed', (req, res, next) => {
    req.currentSeed = currentSeed;
    req.lastSeed = lastSeed;
    next();
}, mainRouter);
*/

/* GET home page. */
/* 아래 router123 
router.get('/', function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }

    const sql = 'SELECT itemName, img FROM Items';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB 오류:', err);
            return res.status(500).send('DB 오류 발생');
        }
*/
router.get('/', function(req, res, next) {//router123
    const urlSeed = req.baseUrl.replace('/', ''); // /abcdef1234 → abcdef1234
    const { currentSeed, lastSeed } = req;

    /*  비활성화
    if (urlSeed === currentSeed || urlSeed === lastSeed) {
        if (!req.session.user) {
            return res.redirect('/users/login');
        }
        const sql = 'SELECT itemName, img FROM Items';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('DB 오류:', err);
            }
            console.log(results);
            res.render('main', {items: results, title: 'ITS 물품대여소'});
            //res.render('main', { title: 'ITS 물품대여소' });
            //res.redirect('/LoadMysql');
        });
    } else {
        res.status(404).send('존재하지 않는 페이지입니다.');
    }
*/
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    const sql = 'SELECT itemName, img FROM Items';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB 오류:', err);
        }
        console.log(results);
        res.render('main', {items: results, title: 'ITS 물품대여소'});
        //res.render('main', { title: 'ITS 물품대여소' });
        //res.redirect('/LoadMysql');
    });

        res.render('main', { items: results, title: 'ITS 물품대여소' });
    });

/* ✅ 예약하기 */
router.post('/reservation', (req, res) => {
    const itemName = req.body.itemName;
    const studentnum = req.session.user?.studentnum;

    if (!studentnum) {
        return res.status(401).send('로그인 세션 없음');
    }

    let currentReserved = req.cookies.reservedItems || '';
    let reservedList = [];

    if (currentReserved.includes(':')) {
        const [cookieStudentNum, items] = currentReserved.split(':');
        if (cookieStudentNum === String(studentnum)) {
            reservedList = items.split(',').filter(Boolean);
        } else {
            reservedList = [];
        }
    }

    if (reservedList.includes(itemName)) {
        return res.send({ success: false, message: `${itemName}은(는) 이미 예약됨` });
    }

    reservedList.push(itemName);
    const newCookieValue = `${studentnum}:${reservedList.join(',')}`;

    res.cookie('reservedItems', newCookieValue, {
        maxAge: 3600000,
        httpOnly: false,
        path: '/'
    });

    console.log('현재 예약 목록:', reservedList);
    res.send({ success: true, message: `${itemName} 예약되었습니다.` });
});

/* ✅ 예약 취소하기 */
router.post('/reservation/cancel', (req, res) => {
    const itemName = req.body.itemName;
    const studentnum = req.session.user?.studentnum;

    if (!studentnum) {
        return res.status(401).send('로그인 세션 없음');
    }

    let currentReserved = req.cookies.reservedItems || '';
    let reservedList = [];

    if (currentReserved.includes(':')) {
        const [cookieStudentNum, items] = currentReserved.split(':');
        if (cookieStudentNum === String(studentnum)) {
            reservedList = items.split(',').filter(Boolean);
        }
    }

    if (!reservedList.includes(itemName)) {
        return res.send({
            success: false,
            message: `${itemName}은(는) 예약된 항목이 아닙니다.`
        });
    }

    // ✅ 실제 취소 처리
    const updatedList = reservedList.filter(item => item !== itemName);
    const newCookieValue = `${studentnum}:${updatedList.join(',')}`;

    res.cookie('reservedItems', newCookieValue, {
        httpOnly: false,
        path: '/'
        // maxAge 생략 → 브라우저 종료 시 자동 삭제
    });

    console.log(`${itemName} 예약 취소됨. 현재 목록:`, updatedList);
    res.send({
        success: true,
        message: `${itemName} 예약이 취소되었습니다.`
    });
});


//관리자 페이지
router.get('/admin',(req,res)=> {
    /* 관리자 권한 췤
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('관리자 권한이 필요합니다.');
    }*/
    const sql = 'SELECT itemName, status, img FROM Items';
    db.query(sql, (err, results)=> {
        if(err) {
            console.error('DB 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        res.render('admin', { title: '관리자 페이지', items: results });
    });
});

module.exports = router;


//히히 오줌발싸
