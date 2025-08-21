// routes/log.js
const express = require('express');
const router = express.Router();
const { db } = require('./sys_management/IMS_db'); // ✅ 프로젝트 내 export와 맞춰서!

// 유틸: year, month를 Date 범위로 변환 (해당 월 1일 00:00:00 ~ 다음달 1일 00:00:00)
function getMonthRange(year, month) {
    const y = Number(year);
    const m = Number(month);
    if (!y || m < 1 || m > 12) return null;

    // 로컬 타임 기준. MySQL tz 설정에 따라 오프셋 차이가 나면 UTC로 맞추는 것도 고려.
    const start = new Date(y, m - 1, 1, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0);
    return { start, end };
}

// /log → 오늘 연-월로 리다이렉트
router.get('/', (req, res) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return res.redirect(`/log/${year}/${month}`);
});

// /log/:year/:month  (예: /log/2025/08)
router.get('/:year/:month', (req, res) => {
    if (!req.session.user) {
        // 관리자 전용이면 여기서 role 체크 추가 가능
        return res.redirect('/users/login');
    }

    const { year, month } = req.params;
    const range = getMonthRange(year, month);
    if (!range) return res.status(400).send('잘못된 연-월 형식입니다.');
    const { start, end } = range;

    const ymLabel = `${year}-${String(month).padStart(2, '0')}`;

    // ✅ UNION ALL 정렬은 서브쿼리로 감싸서 ORDER BY 해야 안전
    const sqlLogs = `
        SELECT *
        FROM (
                 SELECT id, itemName, name, '대여' AS action, rentTime AS at
                 FROM Log_rent
                 WHERE rentTime >= ? AND rentTime < ?

                 UNION ALL

                 SELECT id, itemName, name, '반납' AS action, returnTime AS at
                 FROM Log_rent
                 WHERE returnTime IS NOT NULL
                   AND returnTime >= ? AND returnTime < ?
             ) AS u
        ORDER BY u.at ASC;

    `;

    const sqlHasPrev = `
        SELECT EXISTS(
            SELECT 1 FROM Log_rent
            WHERE rentTime < ? OR (returnTime IS NOT NULL AND returnTime < ?)
            LIMIT 1
        ) AS hasPrev
    `;

    const sqlHasNext = `
        SELECT EXISTS(
            SELECT 1 FROM Log_rent
            WHERE rentTime >= ? OR (returnTime IS NOT NULL AND returnTime >= ?)
            LIMIT 1
        ) AS hasNext
    `;

    db.query(sqlLogs, [start, end, start, end], (err, logs = []) => {
        if (err) {
            console.error('[LOG] sqlLogs Error:', err);
            return res.status(500).send('DB 오류');
        }

        db.query(sqlHasPrev, [start, start], (err2, prevRows) => {
            if (err2) {
                console.error('[LOG] sqlHasPrev Error:', err2);
                return res.status(500).send('DB 오류');
            }
            const hasPrev = !!(prevRows && prevRows[0] && prevRows[0].hasPrev);

            db.query(sqlHasNext, [end, end], (err3, nextRows) => {
                if (err3) {
                    console.error('[LOG] sqlHasNext Error:', err3);
                    return res.status(500).send('DB 오류');
                }
                const hasNext = !!(nextRows && nextRows[0] && nextRows[0].hasNext);

                // 이전/다음 월 링크 계산
                const y = Number(year);
                const m = Number(month);
                const prevDate = new Date(y, m - 2, 1); // (m-1)월의 이전 달 -> 0-base라 -2
                const nextDate = new Date(y, m, 1);     // 다음 달

                const prevY = prevDate.getFullYear();
                const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
                const nextY = nextDate.getFullYear();
                const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');

                res.render('log', {
                    // res.locals.baseTitle는 app.js에서 이미 세팅됨
                    title: ' | 장부 열람',
                    ymLabel,
                    year: y,
                    month: String(m).padStart(2, '0'),
                    logs,
                    hasPrev,
                    hasNext,
                    prevLink: `/log/${prevY}/${prevM}`,
                    nextLink: `/log/${nextY}/${nextM}`,
                });
            });
        });
    });
});

module.exports = router;