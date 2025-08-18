/*
* 예약리스트 쿠키를 검증하여 예약을 진행하는 라우터
* 취소도 여기서 처리함
*/
const express = require('express');
const router = express.Router();
const { db } = require('./IMS_db');

//10~148라인은 옛날 버전, 혹시 모르니 남겨두고 추후 삭제
// ✅ 대여 확정 및 DB 반영 라우트, 이전버전
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
        const sqlRent = 'SELECT itemName FROM Rent_status WHERE studentNum = ?';
        db.query(sqlRent, [sessionUser.studentnum], (err, rentResults) => {
            if (err) {
                return res.status(500).send('대여 내역 조회 실패');
            }

            const dbItemList = rentResults.map(row => row.itemName);
            const alreadyRentedSet = new Set(dbItemList);

            // 이미 대여된 항목 제외
            const newItemsToRent = cookieItemList.filter(item => !alreadyRentedSet.has(item));

            if (newItemsToRent.length === 0) {
                return res.send({
                    success: true,
                    message: '이미 대여된 항목입니다.',
                    skipped: cookieItemList
                });
            }

            // rentToHour 기본값 1시간으로 설정
            const insertValues = newItemsToRent.map(item => [item, userName, 1, new Date(), cookieStudentNum]);
            const sqlInsert = 'INSERT INTO Rent_status (itemName, whoAreRent, rentToHour, date, studentNum) VALUES ?';
            const rentStatusSqlInsert = 'UPDATE Items SET status = 1 WHERE itemName = ?';

            db.query(sqlInsert, [insertValues], (err, insertResult) => {
                if (err) {
                    console.error('[❌ INSERT 실패]', err);
                    return res.status(500).send('대여 정보 저장 실패');
                }

                // ✅ Log_rent에도 대여 기록 INSERT
                const logValues = newItemsToRent.map(item => [userName, item.itemName]);
                const sqlLogInsert = 'INSERT INTO Log_rent (name, itemName) VALUES ?';
                db.query(sqlLogInsert, [logValues], (logErr) => {
                    if (logErr) console.error('[❌ Log_rent INSERT 실패]', logErr);
                });
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

// ✅ 대여 취소 라우트 (기록 유무 확인 후 삭제), 이전버전
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

        const sqlCheck = 'SELECT * FROM Rent_status WHERE itemName = ? AND studentNum = ?';
        db.query(sqlCheck, [itemName, sessionUser.studentnum], (err, checkResult) => {
            if (err) {
                return res.status(500).json({ success: false, message: '대여 기록 확인 실패' });
            }

            if (checkResult.length === 0) {
                return res.json({ success: false, message: `${itemName}은(는) 현재 대여하지 않았습니다.` });
            }

            const sqlDelete = 'DELETE FROM Rent_status WHERE itemName = ? AND studentNum = ?';
            db.query(sqlDelete, [itemName, sessionUser.studentnum], (err, deleteResult) => {
                if (err) {
                    console.error('[❌ 대여 취소 실패]', err);
                    return res.status(500).json({ success: false, message: '대여 취소 실패' });
                }

                const sqlUpdateStatus = 'UPDATE Items SET status = 0 WHERE itemName = ?';
                db.query(sqlUpdateStatus, [itemName], (err, results) => {
                    if (err) {
                        console.error('[❌ status 업데이트 실패]', err);
                        return res.status(500).json({ success: false, message: 'status 업데이트 실패' });
                    }

                    // ✅ Log_rent 반납 기록 + 연체시간 계산
                    const sqlUpdateLog = `
                        UPDATE Log_rent
                        SET returnTime = NOW(),
                            delinquencyTime = SEC_TO_TIME(TIMESTAMPDIFF(SECOND, rentTime, NOW()))
                        WHERE name = ? AND itemName = ? AND returnTime IS NULL
                    `;
                    db.query(sqlUpdateLog, [userName, itemName], (logErr) => {
                        if (logErr) console.error('[❌ Log_rent UPDATE 실패]', logErr);
                    });

                    return res.json({ success: true, message: `${itemName} 대여 취소 완료` });
                });
            });
        });
    });
});

const actionMode ={
    rent: handleRental,
    return: handleReturn,
};

router.post('/verify-step3', (req, res) => {
    const sessionUser = req.session.user;
    const cookieReserved = req.cookies.reservedItems;
    const cookieReturn = req.cookies.returnItemList;

    if (!sessionUser) {
        return res.status(401).send('로그인 후 시도해주세요');
    }

    const hasReserved = cookieReserved && cookieReserved.length > 0;
    const hasReturn = cookieReturn && cookieReturn.length > 0;
    if(!hasReturn && !hasReserved) return res.status(400).json({ success: false, message:'처리할 항목이 없음'});

    const results = { success: true, messages: [] };
    const operations = [];

    if (hasReserved) {
        const [cookieStudentNum, itemListStr] = cookieReserved.split(':');
        const cookieItemEntries = itemListStr?.split(',').filter(Boolean);
        const cookieItemData = cookieItemEntries.map(entry => {
            if (entry.includes('#')) {
                const [itemName, hours] = entry.split('#');
                return { itemName, hours: parseInt(hours) || 1 };
            } else {
                // 기존 형식 호환성
                return { itemName: entry, hours: 1 };
            }
        });
        if (cookieStudentNum !== sessionUser.studentnum) {
            res.clearCookie('reservedItems');
            return res.status(403).json({ success: false, message: '쿠키 학번 변조 감지' });
        }

        if(cookieItemData.length <= 0) return;

        operations.push(
            new Promise((resolve, reject) => {
                handleRental(req, res, cookieStudentNum, cookieItemData, (result) => {
                    if (result.success) {
                        results.messages.push(`대여: ${result.message}`);
                        res.clearCookie('reservedItems');
                    }
                    resolve(result);
                });
            })
        );
    }

    if (hasReturn) {
        const [returnStudentNum, returnItemListStr] = cookieReturn.split(':');
        const returnItemList = returnItemListStr?.split(',').filter(Boolean).sort();

        if (returnStudentNum !== sessionUser.studentnum) {
            res.clearCookie('returnItemList');
            return res.status(403).json({ success: false, message: '반납 쿠키 학번 변조 감지' });
        }

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
});

function handleRental(req, res, cookieStudentNum, cookieItemData, callback) {
    const sqlName = 'SELECT name FROM Users WHERE studentNum = ?';
    db.query(sqlName, [cookieStudentNum], (err, results) => {
        if (err || results.length === 0) {
            return callback({ success: false, message: 'DB 오류 또는 사용자 없음' });
        }

        const userName = results[0].name;

        const sqlRent = 'SELECT itemName FROM Rent_status WHERE studentNum = ?';
        db.query(sqlRent, [cookieStudentNum], (err, rentResults) => {
            if (err) {
                return callback({ success: false, message: '대여 내역 조회 실패' });
            }

            const dbItemList = rentResults.map(row => row.itemName);
            const alreadyRentedSet = new Set(dbItemList);

            const newItemsToRent = cookieItemData.filter(item => !alreadyRentedSet.has(item.itemName));


            if (newItemsToRent.length === 0) {
                res.clearCookie('reservedItems');
                return res.send({
                    success: true,
                    message: '이미 대여된 항목입니다.',
                    skipped: cookieItemData.map(item => item.itemName)
                });
            }

            const insertValues = newItemsToRent.map(item => [
                item.itemName,
                userName,
                item.hours,
                new Date(),
                cookieStudentNum
            ]);

            const sqlInsert = 'INSERT INTO Rent_status (itemName, whoAreRent, rentToHour, date, studentNum) VALUES ?';
            db.query(sqlInsert, [insertValues], (err, insertResult) => {
                if (err) {
                    return callback({ success: false, message: '대여정보 저장 실패' });
                }

                // ✅ Log_rent 기록 추가
                const logValues = newItemsToRent.map(item => [userName, item.itemName]);
                const sqlLogInsert = 'INSERT INTO Log_rent (name, itemName) VALUES ?';
                db.query(sqlLogInsert, [logValues], (logErr) => {
                    if (logErr) console.error('[❌ Log_rent INSERT 실패]', logErr);
                });

                Promise.all(newItemsToRent.map(item =>
                    new Promise((resolve, reject) => {
                        const sqlUpdate = 'UPDATE Items SET status = 1 WHERE itemName = ?';
                        db.query(sqlUpdate, [item.itemName], (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        });
                    })
                ))
                    .then(() => {
                        const rentedItems = newItemsToRent.map(item => `${item.itemName}(${item.hours}시간)`);
                        callback({
                            success: true,
                            message: `대여 완료: ${rentedItems.join(', ')}`,
                            rented: newItemsToRent
                        });
                    })
                    .catch(err => {
                        callback({ success: false, message: '렌트 상태 조정 실패' });
                    });
            });
        });
    });
}

function handleReturn(req, res, cookieStudentNum ,cookieItemList, callback) {
    const sqlName = 'SELECT name FROM Users WHERE studentNum = ?';
    db.query(sqlName, [cookieStudentNum], (err, results) => {
        if (err || results.length === 0) {
            return callback({ success: false, message: '사용자 조회 실패' });
        }

        const userName = results[0].name;

        const sqlCheck = 'SELECT itemName FROM Rent_status WHERE studentNum = ?';
        db.query(sqlCheck, [cookieStudentNum], (err, checkResult) => {
            if (err) {
                return callback({ success: false, message: '대여 기록 확인 실패' });
            }

            const dbItemList = checkResult.map(row => row.itemName);
            const targetItemList = cookieItemList.filter(item => dbItemList.includes(item));

            if (targetItemList.length === 0) {
                return callback({ success: false, message: '반납할 수 있는 항목이 없습니다' });
            }

            const deletePromises = targetItemList.map(item =>
                new Promise((resolve, reject) => {
                    const sqlDelete = 'DELETE FROM Rent_status WHERE itemName = ? AND studentNum = ?';
                    db.query(sqlDelete, [item, cookieStudentNum], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                })
            );

            Promise.all(deletePromises)
                .then(() => {
                    const updatePromises = targetItemList.map(item =>
                        new Promise((resolve, reject) => {
                            const sqlUpdateStatus = 'UPDATE Items SET status = 0 WHERE itemName = ?';
                            db.query(sqlUpdateStatus, [item], (err, result) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        })
                    );
                    return Promise.all(updatePromises);
                })
                .then(() => {
                    // ✅ Log_rent 반납 처리 + 연체시간 계산
                    targetItemList.forEach(item => {
                        const sqlUpdateLog = `
                            UPDATE Log_rent
                            SET returnTime = NOW(),
                                delinquencyTime = SEC_TO_TIME(TIMESTAMPDIFF(SECOND, rentTime, NOW()))
                            WHERE name = ? AND itemName = ?
                              AND returnTime IS NULL
                            ORDER BY rentTime DESC
                            LIMIT 1
                        `;
                        db.query(sqlUpdateLog, [userName, item], (logErr) => {
                            if (logErr) console.error('[❌ Log_rent UPDATE 실패]', logErr);
                        });
                    });

                    callback({ success: true, message: '반납 완료' });
                })
                .catch(err => {
                    callback({ success: false, message: '반납 처리 실패' });
                });
        });
    });
}

module.exports = router;