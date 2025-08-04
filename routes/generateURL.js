const fs = require('fs').promises;
const { seedGenerator } = require('../app'); //앱에서 만든 시드랜덤생성 모듈 가져오기

async function writeUrlToNfc(url) {
    try {
        const data = { url };
        await fs.writeFile('./randURL/nfc_url.json', JSON.stringify(data));
        console.log(`${new Date().toISOString()} - URL 저장됨: ${url}`);
        return { status: 'success', message: 'URL 파일에 저장됨' };
    } catch (err) {
        console.error(`${new Date().toISOString()} - 파일 쓰기 오류: ${err}`);
        return { status: 'error', message: `파일 쓰기 오류: ${err.message}` };
    }
}

async function generateAndWriteUrl() {
    setInterval(async () => {
        const currentSeed = seedGenerator.getCurrentSeed();
        const url = `https://localhost:3001/${currentSeed}`;
        const result = await writeUrlToNfc(url);
        console.log(`${new Date().toISOString()} - URL 생성됨: ${url}`);
    }, 30000);
}
generateAndWriteUrl();
