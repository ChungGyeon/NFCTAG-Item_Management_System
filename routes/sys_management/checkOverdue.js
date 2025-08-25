/*
* 연체된 사람의 시간을 측정하고 이후 권한을 복구하는 라우터
* 아래 checkAndRestoreOverdueUsers()를 5분마다 동작시키는 several를 시켜놨기에 아래에 선언된 라우터들은 한마ㅏㄹ곤 사용 잘 안됨
* 수동으로 권한 복구 기능만 남겨놓음
* 추후 누군가 이를 사용하려고 튜닝한다면 엔드포인트를 참고하시오
* */
const express = require('express');
const router = express.Router();
const { db } = require('./IMS_db');

//연체자 권한 확인 및 복구 함수
function checkAndRestoreOverdueUsers() {
    console.log('[🔍 연체자 권한 확인 시작]', new Date().toISOString());

    //rent_perm이 0인 사용자들의 연체 상황을 확인
    const sqlCheckOverdue = `
        SELECT DISTINCT 
            up.studentNum,
            u.name,
            up.rent_perm,
            lr.delinquencyTime,
            lr.returnTime,
            TIMESTAMPDIFF(SECOND, lr.returnTime, NOW()) as timeSinceReturn
        FROM user_permissions up
        JOIN Users u ON up.studentNum = u.studentNum
        LEFT JOIN Log_rent lr ON u.name = lr.name 
            AND lr.returnTime IS NOT NULL 
            AND lr.delinquencyTime IS NOT NULL
            AND lr.returnTime = (
                SELECT MAX(returnTime) 
                FROM Log_rent lr2 
                WHERE lr2.name = lr.name 
                AND lr2.delinquencyTime IS NOT NULL
            )
        WHERE up.rent_perm = 0
    `;

    db.query(sqlCheckOverdue, (err, results) => {
        if (err) {
            console.error('연체자 조회 실패: ', err);
            return;
        }

        if (results.length === 0) {
            console.log('[권한 제한된 사용자 없음]');
            return;
        }

        console.log(`[권한 제한된 사용자 ${results.length}명 발견]`);

        results.forEach(user => {
            const { studentNum, name, delinquencyTime, timeSinceReturn } = user;

            if (!delinquencyTime) {
                console.log(`[⚠️ ${name}(${studentNum}): 연체시간 정보 없음 - 수동 확인 필요`);
                return;
            }

            // delinquencyTime을 초 단위로 변환
            const delinquencySeconds = timeToSeconds(delinquencyTime);

            if (timeSinceReturn >= delinquencySeconds) {
                // 연체시간만큼 시간이 지났으므로 권한 복구
                restoreUserPermission(studentNum, name, delinquencyTime, timeSinceReturn);
            } else {
                const remainingTime = delinquencySeconds - timeSinceReturn;
                console.log(`[${name}(${studentNum}): 권한 복구까지 ${formatTime(remainingTime)} 남음]`);
            }
        });
    });
}

// 사용자 권한 복구
function restoreUserPermission(studentNum, name, delinquencyTime, timeSinceReturn) {
    const sqlUpdatePerm = 'UPDATE user_permissions SET rent_perm = 1 WHERE studentNum = ?';

    db.query(sqlUpdatePerm, [studentNum], (err, result) => {
        if (err) {
            console.error(`[${name}(${studentNum}) 권한 복구 실패]: `, err);
            return;
        }

        if (result.affectedRows > 0) {
            console.log(`[✅ ${name}(${studentNum}) 권한 복구 완료] 연체시간: ${delinquencyTime}, 경과시간: ${formatTime(timeSinceReturn)}`);
        } else {
            console.log(`[⚠️ ${name}(${studentNum}) 권한 복구 대상 없음]`);
        }
    });
}

// 시간 문자열(HH:MM:SS)을 초 단위로 변환
function timeToSeconds(timeString) {
    if (!timeString) return 0;

    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
}

// 초를 HH:MM:SS 형태로 변환
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 수동으로 특정 사용자의 권한을 제한하는 함수
function restrictUserPermission(studentNum, reason = '연체') {
    const sqlUpdatePerm = 'UPDATE user_permissions SET rent_perm = 0 WHERE studentNum = ?';

    db.query(sqlUpdatePerm, [studentNum], (err, result) => {
        if (err) {
            console.error(`[❌ 사용자(${studentNum}) 권한 제한 실패]`, err);
            return false;
        }

        if (result.affectedRows > 0) {
            console.log(`[🚫 사용자(${studentNum}) 권한 제한 완료] 사유: ${reason}`);
            return true;
        } else {
            console.log(`[⚠️ 사용자(${studentNum}) 권한 제한 대상 없음]`);
            return false;
        }
    });
}

// 정기적으로 연체자 확인 (5분마다)
const CHECK_INTERVAL = 5 * 60 * 1000; // 5분
setInterval(checkAndRestoreOverdueUsers, CHECK_INTERVAL);

// 서버 시작 시 즉시 한 번 실행
checkAndRestoreOverdueUsers();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 엔드포인트

//수동으로 연체자 권한 확인 실행 엔드포인트, 8월19일기준 사용은 안함
router.get('/check', (req, res) => {
    checkAndRestoreOverdueUsers();
    res.json({ success: true, message: '연체자 권한 확인을 실행했습니다.' });
});

//대여권한 수동제한 엔드포인트, 이 역시 사용x
router.post('/restrict/:studentNum', (req, res) => {
    const { studentNum } = req.params;
    const { reason } = req.body;

    if (!studentNum) {
        return res.status(400).json({ success: false, message: '학번이 필요합니다.' });
    }

    restrictUserPermission(studentNum, reason);
    res.json({ success: true, message: `사용자(${studentNum}) 권한을 제한했습니다.` });
});

//대여권한 수동복구 엔드포인트, 이건 대여권한 금지 버튼에서 사용중
router.post('/restore', (req, res) => {
    const studentNum = req.body.studentNum;

    if (!studentNum) {
        return res.status(400).json({ success: false, message: '학번이 필요합니다.' });
    }

    const sqlUpdatePerm = 'UPDATE user_permissions SET rent_perm = 1 WHERE studentNum = ?';

    db.query(sqlUpdatePerm, [studentNum], (err, result) => {
        if (err) {
            console.error(`사용자(${studentNum}) 수동 권한 복구 실패: `, err);
            return res.status(500).json({ success: false, message: '권한 복구 실패' });
        }

        if (result.affectedRows > 0) {
            console.log(`[사용자(${studentNum}) 수동 권한 복구 완료]`);
            res.json({ success: true, message: `사용자(${studentNum}) 권한을 복구했습니다.` });
        } else {
            res.json({ success: false, message: '권한 복구 대상이 없습니다.' });
        }
    });
});

// 현재 권한 제한된 사용자 목록 조회
//지금은 사용하지않는 기능, 애초에 어드민-계정관리페이지에서 볼 수 있으니 별로 필요없을듯
router.get('/restricted-users', (req, res) => {
    const sqlGetRestrictedUsers = `
        SELECT 
            up.studentNum,
            u.name,
            lr.delinquencyTime,
            lr.returnTime,
            TIMESTAMPDIFF(SECOND, lr.returnTime, NOW()) as timeSinceReturn
        FROM user_permissions up
        JOIN Users u ON up.studentNum = u.studentNum
        LEFT JOIN Log_rent lr ON u.name = lr.name 
            AND lr.returnTime IS NOT NULL 
            AND lr.delinquencyTime IS NOT NULL
            AND lr.returnTime = (
                SELECT MAX(returnTime) 
                FROM Log_rent lr2 
                WHERE lr2.name = lr.name 
                AND lr2.delinquencyTime IS NOT NULL
            )
        WHERE up.rent_perm = 0
        ORDER BY u.name
    `;

    db.query(sqlGetRestrictedUsers, (err, results) => {
        if (err) {
            console.error('[제한된 사용자 조회 실패]: ', err);
            return res.status(500).json({ success: false, message: '조회 실패' });
        }

        const processedResults = results.map(user => {
            const delinquencySeconds = timeToSeconds(user.delinquencyTime);
            const remainingTime = Math.max(0, delinquencySeconds - (user.timeSinceReturn || 0));

            return {
                ...user,
                delinquencySeconds,
                remainingTimeSeconds: remainingTime,
                remainingTimeFormatted: formatTime(remainingTime),
                canRestore: remainingTime <= 0
            };
        });

        res.json({
            success: true,
            restrictedUsers: processedResults,
            count: processedResults.length
        });
    });
});

module.exports = router;
