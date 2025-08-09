/*
* 예약리스트 쿠키를 검증하여 예약을 진행하는 라우터
* 취소도 여기서 처리함
*/
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
            const rentStatusSqlInsert = 'UPDATE Items SET status = 1 WHERE itemName = ?';

            db.query(sqlInsert, [insertValues], (err, insertResult) => {
                if (err) {
                    console.error('[❌ INSERT 실패]', err);
                    return res.status(500).send('대여 정보 저장 실패');
                }

                // 모든 아이템의 status 업데이트
                Promise.all(newItemsToRent.map(item =>
                    new Promise((resolve, reject) => {
                        db.query(rentStatusSqlInsert, [item], (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    })
                ))
                    .then(() => {
                        res.clearCookie('reservedItems');
                        return res.send({
                            success: true,
                            message: '대여 완료 ✅',
                            rented: newItemsToRent,
                            skipped: dbItemList.filter(item => cookieItemList.includes(item))
                        });
                    })
                    .catch(err => {
                        console.error('렌트 상태 조정 실패: ', err);
                        return res.status(500).send('렌트 상태 조정 실패');
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
        //최적화가 필요해보이는 군

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

                //대여가능임을 명시하도록 INSERT
                const sqlUpdateStatus = 'UPDATE Items SET status = 0 WHERE itemName = ?';
                db.query(sqlUpdateStatus, [itemName], (err, results) => {
                    if (err) {
                        console.error('[❌ status 업데이트 실패]', err);
                        return res.status(500).json({ success: false, message: 'status 업데이트 실패' });
                    }
                    return res.json({ success: true, message: `${itemName} 대여 취소 완료` });
                });
            });
        });
    });
});


//대여,반납 함수를 객체로 선언
const actionMode ={
    rent: hadleRental,
    return: handleReturn,
};

//양쪽 로직 구현중인 놈
router.post('/verify-step3', (req, res) => {
    const sessionUser = req.session.user;
    const cookieReserved = req.cookies.reservedItems;
    const cookieReturn = req.cookies.returnItemList;

    if (!sessionUser) {
        return res.status(401).send('로그인 후 시도해주세요');
    }

    const hasReserved = cookieReserved.length > 0;
    const hasReturn = cookieReserved.length > 0;
    if(!hasReturn && !hasReserved) return res.status(400).json({ success: false, message:'처리할 항목이 없음'});

    const results = { success: true, messages: [] };
    const operations = [];

    //대여 쿠키 처리
    if (hasReserved) {
        const [cookieStudentNum, itemListStr] = cookieReserved.split(':');
        const cookieItemList = itemListStr?.split(',').filter(Boolean).sort();

        // 학번 변조 검사
        if (cookieStudentNum !== sessionUser.studentnum) {
            res.clearCookie('reservedItems');
            return res.status(403).json({ success: false, message: '쿠키 학번 변조 감지' });
        }

        //아이템이 없다면 패스
        if(cookieItemList.length <= 0) return;

        operations.push(
            new Promise((resolve, reject) => {
                handleRental(req, res, cookieStudentNum, cookieItemList, (result) => {
                    if (result.success) {
                        results.messages.push(`대여: ${result.message}`);
                        res.clearCookie('reservedItems');
                    }
                    resolve(result);
                });
            })
        );
    }

    //반납 쿠키 처리
    if (hasReturn) {
        const [returnStudentNum, returnItemListStr] = cookieReturn.split(':');
        const returnItemList = returnItemListStr?.split(',').filter(Boolean).sort();

        // 학번 변조 검사
        if (returnStudentNum !== sessionUser.studentnum) {
            res.clearCookie('returnItemList');
            return res.status(403).json({ success: false, message: '반납 쿠키 학번 변조 감지' });
        }

        //아이템이 없다면
        if(returnItemList.length <= 0) return;

        operations.push(
            new Promise((resolve, reject) => {
                handleReturn(req, res, returnStudentNum, returnItemList, (result) => {
                    if (result.success) {
                        results.messages.push(`반납: ${result.message}`);
                        res.clearCookie('returnItemList');
                    }
                    resolve(result);
                });
            })
        );
    }

    // 모든 작업 완료 후 응답
    Promise.all(operations)
        .then(operationResults => {
            const allSuccess = operationResults.every(result => result.success);
            return res.json({
                success: allSuccess,
                message: results.messages.join(' / '),
                details: operationResults
            });
        })
        .catch(error => {
            console.error('처리 중 오류:', error);
            return res.status(500).json({ success: false, message: '처리 중 오류가 발생했습니다' });
        });

    /*
    // 대여,반납 이외의 예외처리
    if (!handler) {
        return res.status(400).json({ error: '모드 변조 감지' });
    }
    // 학번 변조 검사
    if (cookieStudentNum !== sessionUser.studentnum) {
        res.clearCookie('reservedItems');
        return res.status(403).send('쿠키 학번 변조 감지');
    }

    return handler(req, res, cookieStudentNum ,cookieItemList);*/
});


//대여 로직
function hadleRental(req, res, cookieStudentNum ,cookieItemList, callback) {

    // 이름 조회
    const sqlName = 'SELECT name FROM Users WHERE studentNum = ?';
    db.query(sqlName, [cookieStudentNum], (err, results) => {
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
            const rentStatusSqlInsert = 'UPDATE Items SET status = 1 WHERE itemName = ?';

            db.query(sqlInsert, [insertValues], (err, insertResult) => {
                if (err) {
                    return callback({ success: false, message: '대여정보 저장 실패' });
                }

                // 모든 아이템의 status 업데이트
                Promise.all(newItemsToRent.map(item =>
                    new Promise((resolve, reject) => {
                        db.query(rentStatusSqlInsert, [item], (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    })
                ))
                    .then(() => {
                        callback({
                            success: true,
                            message: '대여 완료',
                            rented: newItemsToRent
                        });
                    })
                    .catch(err => {
                        console.error('렌트 상태 조정 실패: ', err);
                        return res.status(500).send('렌트 상태 조정 실패');
                    });
            });
        });
    });
}

//반납 로직
function handleReturn(req, res, cookieStudentNum ,cookieItemList, callback) {

    const sqlName = 'SELECT name FROM Users WHERE studentNum = ?';
    db.query(sqlName, [cookieStudentNum], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: '사용자 조회 실패' });
        }

        const userName = results[0].name;

        //현재 대여한 아이템을 불러오기
        const sqlCheck = 'SELECT * FROM Rent_status WHERE whoAreRent = ?';
        db.query(sqlCheck, [userName], (err, checkResult) => {
            if (err) {
                return res.status(500).json({ success: false, message: '대여 기록 확인 실패' });
            }

            const dbItemList = checkResult.map(row => row.itemName);
            const localItemlist = cookieItemList.map(item => item.itemName);
            dbItemList.sorted();
            localItemlist.sorted();

            const targetItemList = [];
            for(let i = 0; i < dbItemList.length; i++) {
                if(dbItemList[i].itemName === localItemlist[i].itemName) targetItemList.push(localItemlist[i].itemName);
            }
            // ✅ 실제로 대여 중일 경우만 삭제 수행
            const sqlDelete = 'DELETE FROM Rent_status WHERE itemName = ? AND whoAreRent = ?';
            db.query(sqlDelete, [targetItemList ,userName], (err, deleteResult) => {
                if (err) {
                    console.error('[❌ 대여 취소 실패]', err);
                    return res.status(500).json({ success: false, message: '대여 취소 실패' });
                }

                //대여가능임을 명시하도록 INSERT
                const sqlUpdateStatus = 'UPDATE Items SET status = 0 WHERE itemName = ?';
                db.query(sqlUpdateStatus, [targetItemList], (err, results) => {
                    if (err) {
                        return callback({ success: false, message: 'status 업데이트 실패' });
                    }
                    return callback({ success: true, message: '반납 완료' });
                });
            });
        });
    });
}

module.exports = router;
