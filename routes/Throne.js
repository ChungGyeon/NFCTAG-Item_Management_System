/*
* 회장 권한 양도를 위한 라우터
* */
const express = require('express');
const router = express.Router();
const { db, testPageConnect } = require('./IMS_db'); //IMS_db.js에서 db 연결변수 가져오기


//페이지 접근 엔드포인트
router.get('/DOA',(req, res) => {
    //로그인한 사용자의 학번을 세션에서 가져옴
    const presidentNum = req.session.user ? req.session.user.studentnum : null;

    if (!presidentNum) {
        return res.redirect('/users/login');
    }

    //권한 확인 쿼리
    const president_verificate = 'SELECT president FROM user_permissions WHERE studentNum = ?';
    db.query(president_verificate, [presidentNum], (err, verifyRows) => {
        if (err) {
            console.error('권한 확인 중 DB 오류:', err);
            return res.status(500).send('서버 오류');
        }
        //권한 없으면 그냥 빠꾸
        if (verifyRows.length === 0 || !verifyRows[0].president) {
            return res.redirect('/users/login');
        }

        res.render('Throne/successionToTheThrone', {title: '신성한 왕위를 계승 하는 곳'});
    });
});

router.post('/nextDOA',(req, res) => {
    const nextPresidentStudentNum = req.body.studentNum;
    const nextPresidentName = req.body.name;
    const nextPresidentGrade = req.body.grade;

    // 입력값 검증 추가
    if (!nextPresidentStudentNum || !nextPresidentName || !nextPresidentGrade) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    //전송한 사람이 존재는 하는지 확인
    const verifySQL = `SELECT studentNum FROM Users WHERE studentNum = ? AND name = ?`;
    db.query(verifySQL, [nextPresidentStudentNum, nextPresidentName], (err, verifyRows) => {
        if(err) {
            console.error('SQL 오류:', err); // 디버깅을 위한 로그 추가
            return res.status(500).json({ success: false, message: 'DB 처리 중 오류가 발생했습니다.' });
        }
        //사용자 존재 여부 확인
        if(verifyRows.length === 0) return res.status(404).json({ success: false, message: '해당 사용자를 찾을 수 없습니다.' });

       //이미 회장인지 확인
       const verifyPresidentAthoritySQL = `SELECT president FROM user_permissions WHERE studentNum = ?;`;
       db.query(verifyPresidentAthoritySQL, [nextPresidentStudentNum], (err, resultPresidentAthority) => {
           if(err) {
               console.log('이미 회장인지에서 발생: '+err);
               return res.status(500).json({ success: false, message: '사용자 권한 확인 중 서버 에러가 발생했습니다.' });
           }
           if(resultPresidentAthority.length > 0 && resultPresidentAthority[0].president) {
                // A 409 Conflict status is more appropriate here than a redirect.
                return res.status(409).json({ success: false, message: '이미 회장입니다.' });
           } else {
                // Store candidate info in session to pass it to the next page
                req.session.nextPresident = {
                    studentNum: nextPresidentStudentNum,
                    name: nextPresidentName,
                    grade: nextPresidentGrade
                };
                // Respond with JSON indicating success and where to redirect next.
                res.status(200).json({ success: true, redirectUrl: '/Throne/confirmation' });
           }
       });
    });
});


// This new route handles rendering the confirmation page.
router.get('/confirmation', (req, res) => {
    const nextPresident = req.session.nextPresident;

    if (!nextPresident) {
        return res.redirect('/Throne/DOA');
    }

    res.render('Throne/successionToTheThrone2', {
        title: '권력을 양도하라',
        studentNum: nextPresident.studentNum,
        name: nextPresident.name,
        grade: nextPresident.grade
    });

    req.session.nextPresident = null;
});


// 권한 양도 처리 엔드포인트
router.post('/transfer', (req, res) => {
    const { studentNum, name, grade } = req.body;
    const currentPresidentNum = req.session.user ? req.session.user.studentnum : null;

    if (!currentPresidentNum) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    // 현재 회장 권한 제거
    const removePresidentSQL = 'UPDATE user_permissions SET president = 0 WHERE studentNum = ?';
    db.query(removePresidentSQL, [currentPresidentNum], (err) => {
        if (err) {
            console.error('현재 회장 권한 제거 오류:', err);
            return res.status(500).json({ success: false, message: '권한 제거 중 오류가 발생했습니다.' });
        }

        // 새로운 회장 권한 부여
        const grantPresidentSQL = 'UPDATE user_permissions SET president = 1 WHERE studentNum = ?';
        db.query(grantPresidentSQL, [studentNum], (err) => {
            if (err) {
                console.error('새 회장 권한 부여 오류:', err);
                return res.status(500).json({ success: false, message: '권한 부여 중 오류가 발생했습니다.' });
            }

            res.json({ success: true, message: '권한이 성공적으로 양도되었습니다.', redirectUrl: '/Throne/lastToTheThrone' });
        });
    });
});

router.get('/lastToTheThrone', (req, res) => {
    const presidentNum = req.session.user ? req.session.user.studentnum : null;

    if (!presidentNum) {
        return res.redirect('/users/login');
    }

    if(!req.session.nextPresident) return res.redirect('/');

    res.render('Throne/lastToTheThrone', {title: '마지막을 기념하며'});
});
module.exports = router;
