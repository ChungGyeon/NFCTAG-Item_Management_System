/*
* 예약리스트 쿠키를 검증하여 예약을 진행하는 라우터
* 취소도 여기서 처리함
*/
const express = require('express');
const router = express.Router();
const { db } = require('./sys_management/IMS_db');

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

            // ✅ 먼저 대여 기간 정보를 조회
            const sqlGetRentInfo = `
                SELECT lr.rentTime, rs.rentToHour
                FROM Log_rent lr
                JOIN Rent_status rs ON lr.itemName = rs.itemName AND lr.name = rs.whoAreRent
                WHERE lr.name = ? AND lr.itemName = ? AND lr.returnTime IS NULL
                ORDER BY lr.rentTime DESC
                LIMIT 1
            `;

            db.query(sqlGetRentInfo, [userName, itemName], (err, rentInfoResults) => {
                if (err) {
                    console.error('[❌ 대여 정보 조회 실패]', err);
                    return res.status(500).json({ success: false, message: '대여 정보 조회 실패' });
                }

                const rentInfo = rentInfoResults.length > 0 ? rentInfoResults[0] : null;

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

                        // ✅ Log_rent 반납 기록 + 조건부 연체시간 계산
                        if (rentInfo && rentInfo.rentTime && rentInfo.rentToHour) {
                            // 먼저 연체 여부를 확인
                            const currentTime = new Date();
                            const rentTime = new Date(rentInfo.rentTime);
                            const rentEndTime = new Date(rentTime.getTime() + rentInfo.rentToHour * 60 * 60 * 1000);
                            const isOverdue = currentTime > rentEndTime;

                            const sqlUpdateLog = `
                                UPDATE Log_rent
                                SET returnTime = NOW(),
                                    delinquencyTime = CASE 
                                        WHEN TIMESTAMPDIFF(HOUR, ?, NOW()) > ?
                                        THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, DATE_ADD(?, INTERVAL ? HOUR), NOW()))
                                        ELSE NULL
                                    END
                                WHERE name = ? AND itemName = ? AND returnTime IS NULL
                                ORDER BY rentTime DESC
                                LIMIT 1
                            `;

                            db.query(sqlUpdateLog, [
                                rentInfo.rentTime,
                                rentInfo.rentToHour,
                                rentInfo.rentTime,
                                rentInfo.rentToHour,
                                userName,
                                itemName
                            ], (logErr) => {
                                if (logErr) {
                                    console.error('[❌ Log_rent UPDATE 실패]', logErr);
                                    return;
                                }

                                // ✅ 연체가 감지된 경우 rent_perm을 0으로 설정
                                if (isOverdue) {
                                    const sqlUpdatePerm = `
                                        UPDATE user_permissions 
                                        SET rent_perm = 0 
                                        WHERE studentNum = ?
                                    `;

                                    db.query(sqlUpdatePerm, [sessionUser.studentnum], (permErr, permResult) => {
                                        if (permErr) {
                                            console.error('[❌ 권한 제한 실패]', permErr);
                                        } else if (permResult.affectedRows > 0) {
                                            console.log(`[🚫 연체로 인한 권한 제한] ${userName}(${sessionUser.studentnum}) - 아이템: ${itemName}`);
                                        } else {
                                            console.log(`[⚠️ 권한 제한 대상 없음] ${userName}(${sessionUser.studentnum}) - user_permissions 레코드가 없습니다`);
                                        }
                                    });
                                }
                            });
                        } else {
                            console.error('[❌ 대여 정보 누락으로 연체시간 계산 불가]: ', itemName);
                        }

                        return res.json({ success: true, message: `${itemName} 대여 취소 완료` });
                    });
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
                message: results.messages.join(' /itemlist '),
                details: operationResults
            });
        })
        .catch(error => {
            console.error('처리 중 오류:', error);
            return res.status(500).json({ success: false, message: '처리 중 오류가 발생했습니다' });
        });
});

function handleRental(req, res, cookieStudentNum, cookieItemData, callback) {
    // 사용자 대여 권한 확인
    const sqlCheckPerm = 'SELECT rent_perm FROM user_permissions WHERE studentNum = ?';
    db.query(sqlCheckPerm, [cookieStudentNum], (permErr, permResults) => {
        if (permErr) {
            console.error('[❌ 대여 권한 확인 실패]: ', permErr);
            // 권한 확인 실패시 계속 진행 (기본적으로 대여 허용)
        } else if (permResults.length > 0 && permResults[0].rent_perm === 0) {
            return callback({ success: false, message: '대여 권한이 제한된 상태입니다. 관리자에게 문의하세요.' });
        }

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
                    return callback({
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

                    // ✅ Log_rent 기록 추가 - Promise로 변환하여 완료 여부 확인
                    const logInsertPromise = new Promise((resolve, reject) => {
                        const logValues = newItemsToRent.map(item => [userName, item.itemName]);
                        const sqlLogInsert = 'INSERT INTO Log_rent (name, itemName) VALUES ?';
                        db.query(sqlLogInsert, [logValues], (logErr, logResult) => {
                            if (logErr) {
                                console.error('[❌ Log_rent INSERT 실패]', logErr);
                                reject(logErr);
                            } else {
                                resolve(logResult);
                            }
                        });
                    });

                    // Items 테이블 status 업데이트
                    const statusUpdatePromises = newItemsToRent.map(item =>
                        new Promise((resolve, reject) => {
                            const sqlUpdate = 'UPDATE Items SET status = 1 WHERE itemName = ?';
                            db.query(sqlUpdate, [item.itemName], (err, results) => {
                                if (err) reject(err);
                                else resolve(results);
                            });
                        })
                    );

                    // 모든 작업이 완료된 후에 콜백 호출
                    Promise.all([logInsertPromise, ...statusUpdatePromises])
                        .then(() => {
                            const rentedItems = newItemsToRent.map(item => `${item.itemName}(${item.hours}시간)`);
                            callback({
                                success: true,
                                message: `대여 완료: ${rentedItems.join(', ')}`,
                                rented: newItemsToRent
                            });
                        })
                        .catch(err => {
                            console.error('[❌ 대여 처리 중 오류]: ', err);
                            callback({ success: false, message: '대여 처리 중 오류가 발생했습니다' });
                        });
                });
            });
        });
    });
}

//여러개 한번에 반납하면 Log_rent에 하나만 입력됨, 이거 고쳐야해
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

            //먼저 대여 기간 정보를 조회하여 저장
            const getRentInfoPromises = targetItemList.map(item =>
                new Promise((resolve, reject) => {
                    const sqlGetRentInfo = `
                        SELECT lr.rentTime, rs.rentToHour
                        FROM Log_rent lr
                        JOIN Rent_status rs ON lr.itemName = rs.itemName AND lr.name = rs.whoAreRent
                        WHERE lr.name = ? AND lr.itemName = ? AND lr.returnTime IS NULL
                        ORDER BY lr.rentTime DESC
                        LIMIT 1
                    `;

                    db.query(sqlGetRentInfo, [userName, item], (err, results) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (results.length === 0) {
                            console.error('대여 정보를 찾을 수 없음', item);
                            resolve({ itemName: item, rentTime: null, rentToHour: null });
                            return;
                        }

                        resolve({
                            itemName: item,
                            rentTime: results[0].rentTime,
                            rentToHour: results[0].rentToHour
                        });
                    });
                })
            );

            Promise.all(getRentInfoPromises)
                .then(rentInfoList => {
                    //대여중인 상태를 나타내는 Rent_status테이블 업데이트
                    const deletePromises = targetItemList.map(item =>
                        new Promise((resolve, reject) => {
                            const sqlDelete = 'DELETE FROM Rent_status WHERE itemName = ? AND studentNum = ?';
                            db.query(sqlDelete, [item, cookieStudentNum], (err, result) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        })
                    );

                    return Promise.all([Promise.all(deletePromises), rentInfoList]);
                })
                .then(([deleteResults, rentInfoList]) => {
                    //Items 테이블 status 업데이트
                    const updatePromises = targetItemList.map(item =>
                        new Promise((resolve, reject) => {
                            const sqlUpdateStatus = 'UPDATE Items SET status = 0 WHERE itemName = ?';
                            db.query(sqlUpdateStatus, [item], (err, result) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        })
                    );

                    return Promise.all([Promise.all(updatePromises), rentInfoList]);
                })
                .then(([updateResults, rentInfoList]) => {
                    //Log_rent 반납 처리 + 조건부 연체시간 계산
                    // 이 부분을 변경: 모든 로그 업데이트가 완료된 후에 콜백 호출하도록 수정
                    const logUpdatePromises = rentInfoList.map(rentInfo => {
                        return new Promise((resolve, reject) => {
                            if (!rentInfo.rentTime || !rentInfo.rentToHour) {
                                console.error('대여 정보 누락: ', rentInfo.itemName);
                                resolve(null); // 정보가 누락된 경우 건너뛰기
                                return;
                            }

                            // 먼저 연체 여부를 확인
                            const currentTime = new Date();
                            const rentTime = new Date(rentInfo.rentTime);
                            const rentEndTime = new Date(rentTime.getTime() + rentInfo.rentToHour * 60 * 60 * 1000);
                            const isOverdue = currentTime > rentEndTime;

                            //대여 기간 초과 여부 확인 후 연체시간 계산
                            const sqlUpdateLog = `
                                UPDATE Log_rent
                                SET returnTime = NOW(),
                                    delinquencyTime = CASE
                                        WHEN NOW() > DATE_ADD(?, INTERVAL ? HOUR)
                                        THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, DATE_ADD(?, INTERVAL ? HOUR), NOW()))
                                        ELSE NULL
                                    END
                                WHERE name = ? AND itemName = ?
                                  AND returnTime IS NULL
                                ORDER BY rentTime DESC
                                LIMIT 1
                            `;

                            db.query(sqlUpdateLog, [
                                rentInfo.rentTime,
                                rentInfo.rentToHour,
                                rentInfo.rentTime,
                                rentInfo.rentToHour,
                                userName,
                                rentInfo.itemName
                            ], (logErr, logResult) => {
                                if (logErr) {
                                    console.error('[❌ Log_rent UPDATE 실패]: ', logErr);
                                    resolve({ error: logErr, itemName: rentInfo.itemName });
                                    return;
                                }

                                // 연체가 감지된 경우 rent_perm을 0으로 설정
                                if (isOverdue) {
                                    const sqlUpdatePerm = `
                                        UPDATE user_permissions 
                                        SET rent_perm = 0 
                                        WHERE studentNum = ?
                                    `;

                                    db.query(sqlUpdatePerm, [cookieStudentNum], (permErr, permResult) => {
                                        if (permErr) {
                                            console.error('[❌ 권한 제한 실패]', permErr);
                                        } else if (permResult.affectedRows > 0) {
                                            console.log(`[🚫 연체로 인한 권한 제한] ${userName}(${cookieStudentNum}) - 아이템: ${rentInfo.itemName}`);
                                        } else {
                                            console.log(`[⚠️ 권한 제한 대상 없음] ${userName}(${cookieStudentNum}) - user_permissions 레코드가 없습니다`);
                                        }
                                        resolve({ success: true, itemName: rentInfo.itemName, isOverdue });
                                    });
                                } else {
                                    resolve({ success: true, itemName: rentInfo.itemName, isOverdue });
                                }
                            });
                        });
                    });

                    // 모든 로그 업데이트가 완료된 후에 콜백 호출
                    return Promise.all(logUpdatePromises).then(logResults => {
                        const overdueItems = logResults
                            .filter(result => result && result.success && result.isOverdue)
                            .map(result => result.itemName);

                        const returnMessage = overdueItems.length > 0
                            ? `반납 완료 (연체 항목: ${overdueItems.join(', ')})`
                            : '반납 완료';

                        callback({ success: true, message: returnMessage });
                    });
                })
                .catch(err => {
                    console.error('[❌ 반납 처리 중 오류]: ', err);
                    callback({ success: false, message: '반납 처리 실패' });
                });
        });
    });
}

module.exports = router;
