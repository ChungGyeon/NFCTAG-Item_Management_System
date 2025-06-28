var express = require('express');
var router = express.Router();
const { db, testPageConnect } = require('./IMS_db'); //IMS_db.js에서 db 연결변수 가져오기

/* GET home page. */
router.get('/', function(req, res, next) {
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

});


router.post('/reservation', (req, res) => {
    const itemName = req.body.itemName;  // JSON.parse 제거
    let currentReserved = req.cookies.reservedItems || '';

    let reservedList = currentReserved
        .split(',')
        .filter(item => item);

    if (reservedList.includes(itemName)) {
        return res.send({ success: false, message: `${itemName}은(는) 이미 예약됨` });
    }

    reservedList.push(itemName);

    res.cookie('reservedItems', reservedList.join(','), {
        maxAge: 3600000,
        httpOnly: false,
        path: '/'
    });

    console.log('현재 예약 목록:', reservedList);
    res.send({ success: true, message: `${itemName} 예약되었습니다.` });
});

router.post('/reservation/cancel', (req, res) => {
    const itemName = req.body.itemName;
    let currentReserved = req.cookies.reservedItems || '';

    let reservedList = currentReserved
        .split(',')
        .filter(item => item);

    if (!reservedList.includes(itemName)) {
        return res.send({
            success: false,
            message: `${itemName}은(는) 예약된 항목이 아닙니다.`
        });
    }

    // 실제 취소 처리
    const updatedList = reservedList.filter(item => item !== itemName);
    res.cookie('reservedItems', updatedList.join(','), {
        maxAge: 3600000,
        httpOnly: false,
        path: '/'
    });

    console.log(`${itemName} 예약 취소됨. 현재 목록:`, updatedList);
    res.send({
        success: true,
        message: `${itemName} 예약이 취소되었습니다.`
    });
});


module.exports = router;


//히히 오줌발싸