var express = require('express');
var router = express.Router();
const mysql = require('mysql'); //mysql 모듈 불러오기
require('dotenv').config(); //dotenv 사용 설정, .env파일 사용하게 하는 그거

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

module.exports = db;