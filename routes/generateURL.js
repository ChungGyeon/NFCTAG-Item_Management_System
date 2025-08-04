const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

async function writeUrlToNfc(url) {
    try {
        const data = { url };
        await fs.writeFile('/tmp/nfc_url.json', JSON.stringify(data));
        console.log(`${new Date().toISOString()} - URL 저장됨: ${url}`);
        return { status: 'success', message: 'URL 파일에 저장됨' };
    } catch (err) {
        console.error(`${new Date().toISOString()} - 파일 쓰기 오류: ${err}`);
        return { status: 'error', message: `파일 쓰기 오류: ${err.message}` };
    }
}

async function generateAndWriteUrl() {
    setInterval(async () => {
        const url = `여기에 랜덤화된 주소 전달`;
        const result = await writeUrlToNfc(url);
        console.log(`${new Date().toISOString()} - 결과: ${JSON.stringify(result)}`);
    }, 30000);
}

generateAndWriteUrl();