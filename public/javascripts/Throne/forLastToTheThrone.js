function setupPageReloadOnBack() {
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });
}

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    setupPageReloadOnBack();
    setCurrentDate();

    // 클릭해서도 열 수 있게
    document.getElementById('envelope').addEventListener('click', function() {
        if (!this.classList.contains('opening')) {
            this.classList.add('opening');
            playOpenSound();
            createSparkleEffect();
        }
    });
});

function setCurrentDate() {
    const dateElement = document.querySelector('.letter-date');
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();

    const formattedDate = `${year}년 ${month}월 ${date}일`;
    dateElement.textContent = formattedDate;
}

function playOpenSound() {
    // 웹 오디오 API를 사용한 간단한 사운드 효과
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 편지 여는 소리 효과
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function createSparkleEffect() {
    const container = document.querySelector('.envelope-container');

    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.position = 'absolute';
            sparkle.style.left = Math.random() * 400 + 'px';
            sparkle.style.top = Math.random() * 300 + 'px';
            sparkle.style.animationDelay = '0s';
            sparkle.style.background = ['#ffd700', '#ffb6c1', '#98fb98', '#87ceeb'][Math.floor(Math.random() * 4)];

            container.appendChild(sparkle);

            setTimeout(() => {
                sparkle.remove();
            }, 2000);
        }, i * 100);
    }
}

// 편지 내용을 타이핑 효과로 보여주기 (선택사항)
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// 마우스 따라다니는 반짝이 효과
document.addEventListener('mousemove', function(e) {
    if (Math.random() < 0.1) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.position = 'fixed';
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.zIndex = '999';

        document.body.appendChild(sparkle);

        setTimeout(() => {
            sparkle.remove();
        }, 2000);
    }
});

function goHome() {
    // 클릭 효과음
    playClickSound();

    // 페이지 이동
    setTimeout(() => {
        window.location.href = '/';
    }, 200);
}

function playClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}