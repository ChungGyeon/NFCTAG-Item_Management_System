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
const genCookie = require('./routes/generateCookie'); //쿠키 생성 라우트
const db = require('./routes/IMS_db'); //IMS_db.js에서 db 연결변수 가져오기

const verifyRouter = require('./routes/verify'); // 🔺 추가

var app = express();

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


app.use('/', mainRouter);
app.use('/users', usersRouter);
app.use('/util', genCookie);
//app.use('/users', require('./routes/users'));

// app.get('/LoadMysql', (req, res) => {
//     const sql = 'SELECT itemName, img FROM Items';
//
//     db.query(sql, (err, results) => {
//         if (err) {
//             console.error('DB 오류:', err);
//         }
//
//         res.render('main',{ items: results });
//     });
// });





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

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));ve
});*/

//module.exports = app;
const SubpoRt = 3001;
app.listen(SubpoRt, () => {
  console.log(`서버가 ${SubpoRt} 실행됩니다.`);
});

