/*
* 가장 중요
* 예약리스트 쿠키생성, 쿠키 취소
* 이용자가 메인으로 접근하는 페이지를 전부 다루는 곳
* */

const express = require('express');
const router = express.Router();
const { db } = require('./IMS_db'); // DB 연결

router.get('/', function(req, res, next) {//router123
    const urlSeed = req.baseUrl.replace('/', ''); // /abcdef1234 → abcdef1234
    const { currentSeed, lastSeed } = req;

    /*  비활성화
    근데 아직 이 코드의 표준화 사용법을 적지 않아서 냄겨둠
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
    const sql = 'SELECT I.itemName, I.img, I.status, R.whoAreRent, R.date, R.rentToHour FROM Items I LEFT JOIN Rent_status R ON I.itemName = R.itemName';

    db.query(sql, (err, items) => {
        if (err) {
            console.error('DB 오류:', err);
            return res.status(500).send('DB 오류 발생');
        }

        // 현재 사용자의 예약 목록을 쿠키에서 가져옴
        const studentnum = req.session.user?.studentnum;
        const reservedCookie = req.cookies.reservedItems || '';
        let userReservedItems = [];

        if (studentnum && reservedCookie.startsWith(studentnum + ':')) {
            userReservedItems = reservedCookie.split(':')[1].split(',').filter(Boolean);
        }

        // 각 아이템에 예약 상태(isReserved) 추가
        const itemsWithStatus = items.map(item => ({
            ...item,
            isReserved: userReservedItems.includes(item.itemName)
        }));

        res.render('main', { items: itemsWithStatus, title: '물품대여소' });
    });
});

/* 예약하기
* 쿠키도 여기서 구워줌
*/
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





/* 예약 취소하기 */
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
    //관리자 권한 췤
    //그전에 로그인 했는지 확인
    if (!req.session.user) {
        return res.redirect('/users/login');
    }

    const userStudentNum = req.session.user?.studentnum;
    const verificate_perm = 'SELECT studentNum FROM user_permissions WHERE studentNum = ? AND (president = true OR vice_president = true)';
    db.query(verificate_perm, [userStudentNum],(err, results) => {
        if(err){
            console.error('권한 확인 중 DB 오류:', err);
            return res.status(500).send('권한 확인 오류');
        }

        if (results.length === 0) {
            return res.status(403).send('관리자 권한이 필요합니다');
        }

        const sql = 'SELECT itemName, status, img FROM Items';
        db.query(sql, (err, results)=> {
            if(err) {
                console.error('DB 오류:', err);
                return res.status(500).send('데이터베이스 오류');
            }
            res.render('admin', { title: '관리자 페이지', items: results });
        });
    });
});


//반납 예약 쿠키
router.post('/reservation2', (req, res) => {
    const itemName = req.body.itemName;
    const studentnum = req.session.user?.studentnum;

    if (!studentnum) {
        return res.status(401).send('로그인 세션 없음');
    }

    let currentReserved = req.cookies.returnItemList || '';
    let returnedList = [];

    if (currentReserved.includes(':')) {
        const [cookieStudentNum, items] = currentReserved.split(':');
        if (cookieStudentNum === String(studentnum)) {
            returnedList = items.split(',').filter(Boolean);
        } else {
            returnedList = [];
        }
    }

    if (returnedList.includes(itemName)) {
        return res.send({ success: false, message: `${itemName}은(는) 이미 예약됨` });
    }

    returnedList.push(itemName);
    const newCookieValue = `${studentnum}:${returnedList.join(',')}`;

    res.cookie('returnItemList', newCookieValue, {
        maxAge: 3600000,
        httpOnly: false,
        path: '/'
    });

    console.log('반납 예정 목록:', returnedList);
    res.send({ success: true, message: `${itemName} 반납 신청되었습니다.` });
});


/* 반납예약취소는 안만드는게 좋겠지만 일단 해보자 */
router.post('/reservation/cancel2', (req, res) => {
    const itemName = req.body.itemName;
    const studentnum = req.session.user?.studentnum;

    if (!studentnum) {
        return res.status(401).send('로그인 세션 없음');
    }

    let currentReserved = req.cookies.returnItemList || '';
    let returnList = [];

    if (currentReserved.includes(':')) {
        const [cookieStudentNum, items] = currentReserved.split(':');
        if (cookieStudentNum === String(studentnum)) {
            returnList = items.split(',').filter(Boolean);
        }
    }

    if (!returnList.includes(itemName)) {
        return res.send({
            success: false,
            message: `${itemName}은(는) 예정된 반납 목록이 아닙니다.`
        });
    }

    // ✅ 실제 취소 처리
    const updatedList = returnList.filter(item => item !== itemName);
    const newCookieValue = `${studentnum}:${updatedList.join(',')}`;

    res.cookie('returnItemList', newCookieValue, {
        httpOnly: false,
        path: '/'
        // maxAge 생략 → 브라우저 종료 시 자동 삭제
    });

    console.log(`${itemName} 반납 예정 취소됨. 현재 목록:`, updatedList);
    res.send({
        success: true,
        message: `${itemName} 반납이 취소되었습니다.`
    });
});

router.get('/admin/users', (req, res) => {
    const sql = `
        SELECT u.studentNum, u.name, u.grade, 
               COALESCE(up.president, false) as president,
               COALESCE(up.vice_president, false) as vice_president,
               COALESCE(up.rent_perm, false) as rent_perm
        FROM Users u
        LEFT JOIN user_permissions up ON u.studentNum = up.studentNum
        ORDER BY u.studentNum
    `;

    db.query(sql, (err, users) => {
        if(err) {
            console.error('DB 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        res.render('users', { title: '사용자 관리', users: users });
    });
});

// 계정 삭제 기능
router.post('/admin/delete-user', (req, res) => {
    const { studentNum } = req.body;

    if (!studentNum) {
        return res.status(400).json({
            success: false,
            message: '학번이 제공되지 않았습니다.'
        });
    }

    // 먼저 president, vice_president 권한 확인
    const checkSql = 'SELECT president, vice_president FROM user_permissions WHERE studentNum = ?';
    db.query(checkSql, [studentNum], (err, permissions) => {
        if (err) {
            console.error('권한 확인 DB 오류:', err);
            return res.status(500).json({
                success: false,
                message: '데이터베이스 오류가 발생했습니다.'
            });
        }

        // 권한이 있는 경우 삭제 불가
        if (permissions.length > 0 && (permissions[0].president || permissions[0].vice_president)) {
            return res.status(403).json({
                success: false,
                message: '회장 또는 부회장은 삭제할 수 없습니다.'
            });
        }

        // 트랜잭션으로 안전하게 삭제
        db.beginTransaction((err) => {
            if (err) {
                console.error('트랜잭션 시작 오류:', err);
                return res.status(500).json({
                    success: false,
                    message: '데이터베이스 오류가 발생했습니다.'
                });
            }

            // user_permissions 테이블에서 삭제 (president, vice_president가 false인 경우만)
            const deletePermissionsSql = 'DELETE FROM user_permissions WHERE studentNum = ? AND president = false AND vice_president = false';
            db.query(deletePermissionsSql, [studentNum], (err, permissionsResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('user_permissions 삭제 오류:', err);
                        res.status(500).json({
                            success: false,
                            message: '데이터베이스 오류가 발생했습니다.'
                        });
                    });
                }

                // Users 테이블에서 삭제
                const deleteUserSql = 'DELETE FROM Users WHERE studentNum = ?';
                db.query(deleteUserSql, [studentNum], (err, userResult) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Users 삭제 오류:', err);
                            res.status(500).json({
                                success: false,
                                message: '데이터베이스 오류가 발생했습니다.'
                            });
                        });
                    }

                    // 트랜잭션 커밋
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('트랜잭션 커밋 오류:', err);
                                res.status(500).json({
                                    success: false,
                                    message: '데이터베이스 오류가 발생했습니다.'
                                });
                            });
                        }

                        console.log(`학번 ${studentNum} 계정이 삭제되었습니다.`);
                        res.json({
                            success: true,
                            message: '계정이 성공적으로 삭제되었습니다.'
                        });
                    });
                });
            });
        });
    });
});

/* ✅ 관리자 물건 삭제 기능 */
router.post('/admin/delete-items', (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: '삭제할 물건이 선택되지 않았습니다.'
        });
    }

    // 관리자 권한 확인 (선택사항)
    /*
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.'
        });
    */

    // 선택된 물건들을 데이터베이스에서 삭제
    const placeholders = items.map(() => '?').join(',');
    const sql = `DELETE FROM Items WHERE itemName IN (${placeholders})`;

    db.query(sql, items, (err, result) => {
        if (err) {
            console.error('DB 삭제 오류:', err);
            return res.status(500).json({
                success: false,
                message: '데이터베이스 오류가 발생했습니다.'
            });
        }

        console.log(`${items.length}개의 물건이 삭제되었습니다:`, items);
        res.json({
            success: true,
            message: `${items.length}개의 물건이 성공적으로 삭제되었습니다.`,
            deletedItems: items
        });
    });
});



//부회장 임명 기능
router.post('/admin/appoint-vice-president', (req, res) => {
    const { studentNum } = req.body;

    if (!studentNum) {
        return res.status(400).json({
            success: false,
            message: '학번이 제공되지 않았습니다.'
        });
    }

    //먼저 해당 사용자가 존재하는지 확인
    const checkUserSql = 'SELECT studentNum FROM Users WHERE studentNum = ?';
    db.query(checkUserSql, [studentNum], (err, users) => {
        if (err) {
            console.error('사용자 확인 DB 오류:', err);
            return res.status(500).json({
                success: false,
                message: '데이터베이스 오류가 발생했습니다.'
            });
        }

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 학번의 사용자를 찾을 수 없습니다.'
            });
        }

        //이미 부회장인지 확인
        const checkViceSql = 'SELECT vice_president FROM user_permissions WHERE studentNum = ?';
        db.query(checkViceSql, [studentNum], (err, permissions) => {
            if (err) {
                console.error('권한 확인 DB 오류:', err);
                return res.status(500).json({
                    success: false,
                    message: '데이터베이스 오류가 발생했습니다.'
                });
            }

            if (permissions.length > 0 && permissions[0].vice_president) {
                return res.status(400).json({
                    success: false,
                    message: '이미 부회장으로 임명된 사용자입니다.'
                });
            }

            //user_permissions 테이블에 레코드가 있는지 확인하고 업데이트 또는 삽입
            if (permissions.length > 0) {
                // 기존 레코드 업데이트
                const updateSql = 'UPDATE user_permissions SET vice_president = TRUE WHERE studentNum = ?';
                db.query(updateSql, [studentNum], (err, result) => {
                    if (err) {
                        console.error('부회장 임명 DB 오류:', err);
                        return res.status(500).json({
                            success: false,
                            message: '데이터베이스 오류가 발생했습니다.'
                        });
                    }

                    console.log(`학번 ${studentNum}을 부회장으로 임명했습니다.`);
                    res.json({
                        success: true,
                        message: '부회장으로 성공적으로 임명되었습니다.'
                    });
                });
            } else {
                // 새 레코드 삽입
                const insertSql = 'INSERT INTO user_permissions (studentNum, vice_president) VALUES (?, TRUE)';
                db.query(insertSql, [studentNum], (err, result) => {
                    if (err) {
                        console.error('부회장 임명 DB 오류:', err);
                        return res.status(500).json({
                            success: false,
                            message: '데이터베이스 오류가 발생했습니다.'
                        });
                    }

                    console.log(`학번 ${studentNum}을 부회장으로 임명했습니다.`);
                    res.json({
                        success: true,
                        message: '부회장으로 성공적으로 임명되었습니다.'
                    });
                });
            }
        });
    });
});

// 부회장 해임 기능
router.post('/admin/remove-vice-president', (req, res) => {
    const { studentNum } = req.body;

    if (!studentNum) {
        return res.status(400).json({
            success: false,
            message: '학번이 제공되지 않았습니다.'
        });
    }

    // 부회장 권한 확인
    const checkSql = 'SELECT vice_president FROM user_permissions WHERE studentNum = ?';
    db.query(checkSql, [studentNum], (err, permissions) => {
        if (err) {
            console.error('권한 확인 DB 오류:', err);
            return res.status(500).json({
                success: false,
                message: '데이터베이스 오류가 발생했습니다.'
            });
        }

        if (permissions.length === 0 || !permissions[0].vice_president) {
            return res.status(400).json({
                success: false,
                message: '부회장이 아닌 사용자입니다.'
            });
        }

        // 부회장 권한 해제
        const updateSql = 'UPDATE user_permissions SET vice_president = FALSE WHERE studentNum = ?';
        db.query(updateSql, [studentNum], (err, result) => {
            if (err) {
                console.error('부회장 해임 DB 오류:', err);
                return res.status(500).json({
                    success: false,
                    message: '데이터베이스 오류가 발생했습니다.'
                });
            }

            console.log(`학번 ${studentNum}의 부회장 권한을 해임했습니다.`);
            res.json({
                success: true,
                message: '부회장 권한이 성공적으로 해임되었습니다.'
            });
        });
    });
});



module.exports = router;


//히히 오줌발싸
