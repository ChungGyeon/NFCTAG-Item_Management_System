const fs = require('fs').promises;
const path = require('path');
const seedGenerator = require('./seed-generator');

async function writeUrlToNfc(url) {
    const filePath = path.join(__dirname, 'randURL', 'nfc_url.json');
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


async function generateAndWriteUrl() {
    setInterval(async () => {
        const currentSeed = seedGenerator.getCurrentSeed();
        //추후 정해지는 도메인에 따라 여기 주소 변경필요함
        const url = `http://localhost:3001/detect/startRentingItem/${currentSeed}`;
        const result = await writeUrlToNfc(url);
        console.log(`${new Date().toISOString()} - URL 생성됨: ${url}`);
    }, 10 * 1050);
}
generateAndWriteUrl();
