const express = require('express');
const path = require('path');
const createError = require('http-errors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql'); //mysql 모듈 불러오기
require('dotenv').config(); //dotenv 사용 설정, .env파일 사용하게 하는 그거

//각 실행경로 설정
const mainRouter = require('./routes/main');
const usersRouter = require('./routes/users');
const detCookie = require('./routes/sys_management/detectCookie'); //쿠키 감지 처리 관련 라우트
const db = require('./routes/sys_management/IMS_db'); //IMS_db.js에서 db 연결변수 가져오기
const verifyRouter = require('./routes/verify'); // 물건리스트 쿠키 확인 라우트
const imgProcessor = require('./routes/imgProcess'); //이미지처리 라우트
require('./routes/sys_management/generateURL'); //nfc_url에 내용 고쳐 쓰는 라우터
const seedGenerator = require('./routes/sys_management/seed-generator'); //랜덤시드 라우터
const logRouter = require('./routes/log'); //장부기능
const successionToTheThroneRouter  = require('./routes/Throne'); //회장 권한 양도 라우터
const checkOverdueRouter = require('./routes/sys_management/checkOverdue'); //연체자 권한 관리 라우터

const app = express();

//베이스타이틀 지정
app.use((req, res, next) => {
    res.locals.baseTitle = 'ITS-IMS';
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* 세션설정 */
app.use(session({
    secret: 'SESSION_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true
        // maxAge 생략 → 브라우저 종료 시 세션도 종료됨
    }
}));

/* 랜덤시드 사용하는 거 활성화 해야해 쓸꺼면
아직 사용 표준화 안시켜서 냄겨둠
app.use('/:seed', (req, res, next) => {
    req.currentSeed = currentSeed;
    req.lastSeed = lastSeed;
    next();
}, mainRouter);*/
app.use('/', mainRouter);
app.use('/users', usersRouter);
app.use('/imgProcess',imgProcessor);
//랜덤시드 적용
//app.use('/detect', detCookie);
app.use('/:seed', (req, res, next) => {
    req.currentSeed = seedGenerator.currentSeed;
    req.lastSeed = seedGenerator.lastSeed;
    next();
}, detCookie);



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.use('/rent', verifyRouter);
app.use('/log', logRouter);
app.use('/Throne',successionToTheThroneRouter);
app.use('/checkOverdue', checkOverdueRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});


//module.exports = app;
const SubpoRt = 3001;
app.listen(SubpoRt, () => {
  console.log(`서버가 ${SubpoRt} 실행됩니다.`);
});

//오직 서버라우터만 또 만들어놔야지
module.exports = app;
