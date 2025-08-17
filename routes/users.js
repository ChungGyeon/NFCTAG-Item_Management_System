/*
 이용자가 주도적으로 요청하는 내용을 처리하는 라우트
 로그인,회원가입,로그아웃 등
 */
const express = require('express');
const router = express.Router();
const { db, testPageConnect } = require('./IMS_db'); //IMS_db.js에서 db 연결변수 가져오기

router.get('/', (req, res) => {
    res.render('login');
})

router.get('/login', (req, res) => {
  res.render('login', {title: '로그인'});
});


router.post('/login', async (req, res) => { //login
  const { studentnum, password } = req.body;

  const sql = 'SELECT studentNum, password FROM Users WHERE studentNum = ? AND password = ?';
  db.query(sql, [studentnum, password], (err, result) => {
    if(err){
      console.log("DB 오류 : ", err); //error
    }
    if(result.length <= 0){
      res.status(401).send('학번 또는 비밀번호가 틀렸습니다.');
    }
    else {
      if(!req.session.user) {
        req.session.user = {
          studentnum: studentnum,
          password: password
        };
      }
      res.json({ success: true });
    }
  });
});


router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 삭제 실패:', err);
      return res.status(500).send('로그아웃 중 오류 발생');
    }

    res.clearCookie('connect.sid');       // 세션 쿠키 삭제
    res.clearCookie('reservedItems');     // 예약 쿠키 삭제
    res.clearCookie('returnItemList');    // 반납 예약 쿠키 삭제

    res.redirect('/users/login');         // 로그인 페이지로 이동
  });
});



///////////////////////////////////////
/*
어드민이 사용하는 기능 쿼리 작성 영역
*/
//계정추가 구문, 콜백 기반으로 리팩토링
router.post('/signUpquery', (req, res) => {
  const {studentnum, name, grade, password} = req.body;

  if (!studentnum || !name || !grade || !password) {
    return res.status(400).json({message: '모든 필드를 입력해주세요.'});
  }

  // 로그인한 사용자의 학번을 세션에서 가져옴
  const presidentNum = req.session.user ? req.session.user.studentnum : null;

  if (!presidentNum) {
    return res.status(401).json({message: '로그인이 필요합니다.'});
  }

  //권한 확인 쿼리
  const president_verificate = 'SELECT president, vice_president FROM user_permissions WHERE studentNum = ?';
  db.query(president_verificate, [presidentNum], (err, verifyRows) => {
    if (err) {
      console.error('권한 확인 중 DB 오류:', err);
      return res.status(500).send('서버 오류');
    }

    //계정추가는 회장, 부회장 권한 둘다 가능
    //따라서 둘중 하나라도 없으면 차단
    if (verifyRows.length === 0 || (!verifyRows[0].president && !verifyRows[0].vice_president)) {
      return res.status(403).json({message: '회장 또는 부회장 권한이 없습니다.'});
    }

    // 트랜잭션 시작
    db.beginTransaction(err => {
      if (err) {
        console.error('트랜잭션 시작 오류:', err);
        return res.status(500).send('서버 오류');
      }
      const sql = 'SELECT * FROM Users WHERE studentNum = ?';
      db.query(sql, [studentnum], (err, result) => {
        if (err) {
          console.error('DB 오류:', err);
          return res.status(500).json({message: '서버 오류가 발생했습니다.'});
        }

        if (result.length > 0) {
          return res.status(409).json({message: '이미 존재하는 계정입니다.'});
        } else {

          // Users 테이블에 삽입
          const userInsertQuery = 'INSERT INTO Users (name, studentNum, grade, password) VALUES (?, ?, ?, ?)';
          db.query(userInsertQuery, [name, studentnum, grade, password], (err, userResult) => {
            if (err) {
              return db.rollback(() => {
                console.error('Users 테이블 삽입 오류:', err);
                res.status(500).send('등록 실패');
              });
            }

            // user_permissions 테이블에 삽입
            const permInsertQuery = 'INSERT INTO user_permissions (studentNum, rent_perm) VALUES (?, ?)';
            db.query(permInsertQuery, [studentnum, true], (err, permResult) => {
              if (err) {
                return db.rollback(() => {
                  console.error('user_permissions 테이블 삽입 오류:', err);
                  res.status(500).send('등록 실패');
                });
              }

              // 모든 쿼리가 성공하면 커밋
              db.commit(err => {
                if (err) {
                  return db.rollback(() => {
                    console.error('커밋 오류:', err);
                    res.status(500).send('등록 실패');
                  });
                }
                console.log('계정이 성공적으로 생성되었습니다.');
                res.json({message: '등록 성공'});
              });
            });
          });
        }

      });
    });
  });
});



router.get('/list', (req, res) => {
  const sql = `
    SELECT
      Users.studentnum,
      Users.name,
      Users.grade,
      GROUP_CONCAT(Rent_status.itemName SEPARATOR ', ') AS rentedItems
    FROM Users
           LEFT JOIN Rent_status ON Users.name = Rent_status.whoAreRent
    GROUP BY Users.studentnum, Users.name, Users.grade
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ message: 'DB 오류' });
    }
    return res.json(results);
  });
});




// 비밀번호 변경 엔드포인트
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // 세션에서 현재 로그인한 사용자 정보 가져오기
  const userStudentNum = req.session.user?.studentnum;
  
  if (!userStudentNum) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다.'
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
    });
  }

  // 새 비밀번호 길이 확인
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
    });
  }

  // 현재 비밀번호 확인
  const checkPasswordSql = 'SELECT password FROM Users WHERE studentNum = ?';
  db.query(checkPasswordSql, [userStudentNum], (err, result) => {
    if (err) {
      console.error('비밀번호 확인 DB 오류:', err);
      return res.status(500).json({
        success: false,
        message: '데이터베이스 오류가 발생했습니다.'
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 현재 비밀번호가 일치하는지 확인
    if (result[0].password !== currentPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호가 일치하지 않습니다.'
      });
    }

    // 새 비밀번호로 업데이트
    const updatePasswordSql = 'UPDATE Users SET password = ? WHERE studentNum = ?';
    db.query(updatePasswordSql, [newPassword, userStudentNum], (err, updateResult) => {
      if (err) {
        console.error('비밀번호 변경 DB 오류:', err);
        return res.status(500).json({
          success: false,
          message: '데이터베이스 오류가 발생했습니다.'
        });
      }

      console.log(`학번 ${userStudentNum}의 비밀번호가 변경되었습니다.`);
      res.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      });
    });
  });
});







//회장 권한 위임 엔드포인트

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

    res.render('Thron/successionToTheThrone', {title: '신성한 왕위를 계승 하는 곳'});
  });
});






module.exports = router;
