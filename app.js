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
app.use(session({ // 세션 설정
    secret: 'SESSION_SECRET',
    resave: false,
    saveUninitialized: false
}));

//mysql DB 연결변수 설정
const db = mysql.createConnection({
    host: process.env.IMS_DB_HOST,
    user: process.env.IMS_DB_USER,
    password: process.env.IMS_DB_PASSWORD,
    database: process.env.IMS_DB,
    port: process.env.IMS_DB_PORTNUM,
    multipleStatements: true // 여러 쿼리 실행을 허용
});

//db 연결
db.connect((err) => {
    if (err) {
        console.error('데이터베이스 연결 실패: ' + err.stack);
        const readline = require('readline'); //readline 활성화
        const tsuzukeru = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        tsuzukeru.question('계속 진행하겠습니까? (Y/N)', (answer) => {
            if(answer=='Y' || answer=='y'){
                console.log('계속 진행합니다');
                testPageConnect=true;
                tsuzukeru.close();
            }
            else{
                console.log('잘못 입력했어도 종료합니다.')
                tsuzukeru.close();
                process.exit(1);
            }
        });
    }
    else{
        console.log('데이터베이스와 연결 성공!');
    }
});

app.use((req, res, next) => {
    req.db = db;
    next();
});

app.use('/', mainRouter);
//app.use('/users', usersRouter);
app.use('/users', require('./routes/users'));

app.get('/LoadMysql', (req, res) => {
    const sql = 'SELECT itemName, img FROM Items';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB 오류:', err);
        }

        res.render('main',{ items: results });
    });
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});*/

//module.exports = app;
const SubpoRt = 3001;
app.listen(SubpoRt, () => {
  console.log(`서버가 ${SubpoRt} 실행됩니다.`);
});
