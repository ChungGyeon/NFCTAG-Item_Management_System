const fs = require('fs').promises;
const path = require('path');
const seedGenerator = require('./seed-generator');

//nfc_url.json에 생성된 랜덤주소 입력하는 함수
async function writeUrlToNfc(url) {
    const filePath = path.join(__dirname, '/randURL', 'nfc_url.json');
    try {
        let data = {};
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (error) {
            // 파일이 존재하지 않는 경우(ENOENT)는 패스(자기가 직접 생성), 다른 읽기 오류는 로그 기록
            if (error.code !== 'ENOENT') {
                console.error(`${new Date().toISOString()} - 기존 URL 파일 읽기 오류: ${error.message}`);
            }
        }
        // url 프로퍼티를 업데이트
        data.url = url;

        // 업데이트된 객체를 다시 JSON 문자열로 변환하여 파일에 씁니다. (null, 2로 가독성 좋게 포맷)
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return { status: 'success', message: 'URL 파일에 저장됨' };
    } catch (err) {
        console.error(`${new Date().toISOString()} - 파일 쓰기 오류: ${err}`);
        return { status: 'error', message: `파일 쓰기 오류: ${err.message}` };
    }
}

/*
랜덤함수 쓰는 함수
이곳에서 랜덤함수 접속 URL을 지정하고
url 생성 시간을 정하는 함수
 */
async function generateAndWriteUrl() {
    setInterval(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const currentSeed = seedGenerator.getCurrentSeed();
        const targetURL = process.env.SERVER_URL
        const url = `https://${targetURL}/detect/startRentingItem/${currentSeed}`;
        const result = await writeUrlToNfc(url);
        if(process.env.DEVELOP_MODE === 'develop') console.log(`${new Date().toISOString()} - URL 생성됨: ${url}`); //debugingPrint
    }, 10 * 1000);


}
generateAndWriteUrl();
