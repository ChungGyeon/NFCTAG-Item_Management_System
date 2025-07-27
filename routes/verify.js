const express = require('express');
const router = express.Router();
const { db } = require('./IMS_db');

// ✅ 대여 확정 및 DB 반영 라우트
router.post('/verify-step2', (req, res) => {
    const sessionUser = req.session.user;
    const cookieReserved = req.cookies.reservedItems;

    if (!sessionUser || !cookieReserved) {
        return res.status(401).send('로그인 또는 쿠키 없음');
    }

    const [cookieStudentNum, itemListStr] = cookieReserved.split(':');
    const cookieItemList = itemListStr?.split(',').filter(Boolean).sort();

    // 학번 변조 검사
    if (cookieStudentNum !== sessionUser.studentnum) {
        res.clearCookie('reservedItems');
        return res.status(403).send('쿠키 학번 변조 감지');
    }

    // 이름 조회
    const sqlName = 'SELECT name FROM Users WHERE studentNum = ?';
    db.query(sqlName, [sessionUser.studentnum], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).send('DB 오류 또는 사용자 없음');
        }

        const userName = results[0].name;

        // 기존 대여 내역 조회
        const sqlRent = 'SELECT itemName FROM Rent_status WHERE whoAreRent = ?';
        db.query(sqlRent, [userName], (err, rentResults) => {
            if (err) {
                return res.status(500).send('대여 내역 조회 실패');
            }

            const dbItemList = rentResults.map(row => row.itemName);
            const alreadyRentedSet = new Set(dbItemList);

            // 이미 대여된 항목 제외
            const newItemsToRent = cookieItemList.filter(item => !alreadyRentedSet.has(item));

            if (newItemsToRent.length === 0) {
                res.clearCookie('reservedItems');
                return res.send({
                    success: true,
                    message: '이미 대여된 항목입니다.',
                    skipped: cookieItemList
                });
            }

            // rentToHour 기본값 1시간으로 설정
            const insertValues = newItemsToRent.map(item => [item, userName, 1, new Date()]);
            const sqlInsert = 'INSERT INTO Rent_status (itemName, whoAreRent, rentToHour, date) VALUES ?';

            console.log('[📝 INSERT할 데이터]', insertValues);

            db.query(sqlInsert, [insertValues], (err, insertResult) => {
                if (err) {
                    console.error('[❌ INSERT 실패]', err);
                    return res.status(500).send('대여 정보 저장 실패');
                }

                res.clearCookie('reservedItems');

                return res.send({
                    success: true,
                    message: '대여 완료 ✅',
                    rented: newItemsToRent,
                    skipped: dbItemList.filter(item => cookieItemList.includes(item))
                });
            });
        });
    });
});

// ✅ 대여 취소 라우트 (기록 유무 확인 후 삭제)
router.post('/cancel', (req, res) => {
    const sessionUser = req.session.user;
    const itemName = req.body.itemName;

    if (!sessionUser) {
        return res.status(401).json({ success: false, message: '세션 없음' });
    }

    const sqlName = 'SELECT name FROM Users WHERE studentNum = ?';
    db.query(sqlName, [sessionUser.studentnum], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: '사용자 조회 실패' });
        }

        const userName = results[0].name;

        // ✅ 먼저 해당 대여 기록이 존재하는지 확인
        const sqlCheck = 'SELECT * FROM Rent_status WHERE itemName = ? AND whoAreRent = ?';
        db.query(sqlCheck, [itemName, userName], (err, checkResult) => {
            if (err) {
                return res.status(500).json({ success: false, message: '대여 기록 확인 실패' });
            }

            if (checkResult.length === 0) {
                return res.json({ success: false, message: `${itemName}은(는) 현재 대여하지 않았습니다.` });
            }

            // ✅ 실제로 대여 중일 경우만 삭제 수행
            const sqlDelete = 'DELETE FROM Rent_status WHERE itemName = ? AND whoAreRent = ?';
            db.query(sqlDelete, [itemName, userName], (err, deleteResult) => {
                if (err) {
                    console.error('[❌ 대여 취소 실패]', err);
                    return res.status(500).json({ success: false, message: '대여 취소 실패' });
                }

                return res.json({ success: true, message: `${itemName} 대여 취소 완료` });
            });
        });
    });
});
module.exports = router;
