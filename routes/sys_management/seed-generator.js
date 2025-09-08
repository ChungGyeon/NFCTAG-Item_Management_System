/*
랜덤 시드 만드는 라우터
*/
function generateRandomSeed() {
    return Math.random().toString(36).substr(2, 10);
}

const seedGenerator = {
    currentSeed: generateRandomSeed(),
    lastSeed: null,
    getCurrentSeed(){
        return this.currentSeed
    }
}
setInterval(() => {
    seedGenerator.lastSeed = seedGenerator.currentSeed;
    seedGenerator.currentSeed = generateRandomSeed();
    if(process.env.DEVELOP_MODE === 'develop') console.log('새 시드:', seedGenerator.currentSeed); //debugingPrint
}, 10 * 1000);

module.exports = seedGenerator;