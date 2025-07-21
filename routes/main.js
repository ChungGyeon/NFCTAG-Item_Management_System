const express = require('express');
const router = express.Router();
const { db } = require('./IMS_db'); // DB 연결

/* GET home page. */
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

        res.render('main', { items: results, title: 'ITS 물품대여소' });
    });
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

module.exports = router;