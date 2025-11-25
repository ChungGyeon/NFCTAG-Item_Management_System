//const https = require('https');
const http = require('http');
//const fs = require('fs');

const app = require('./app');

require('dotenv').config(); //dotenv 사용 설정, .env파일 사용하게 하는 그거

/*
const options = {
    key: fs.readFileSync(process.env.TAGORDER_PRIBUSY_SSL_PATH),
    cert: fs.readFileSync(process.env.TAGORDER_CA_SSL_PATH)
};
*/

//80 2 443 리다이렉션 코드 지금은 없애자
/*
http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers.host + req.url });
    res.end();
}).listen(80);
*/
//const server = https.createServer(options, app);
const server = http.createServer(app);
const SubpoRt = 80;

server.listen(SubpoRt, () => {
    console.log(`서버가 ${SubpoRt} 실행됩니다.`);

    try {
        process.setgid('chunggyeon');
        process.setuid('chunggyeon');
        console.log("루트권한 포기 완료, 일반계정으로 실행 중");
    } catch (err) {
        console.log(`권한 포기 중 오류 발생 :  ${err.message}`);
    }

});