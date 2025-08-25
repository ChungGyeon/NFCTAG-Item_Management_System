let crown = document.getElementById('crown');
let person1 = document.getElementById('person1');
let person2 = document.getElementById('person2');
let draggedElement = null;
let currentOwner = person1;

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const gameContainer = document.querySelector('.game-container');

    // Start door opening animation
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 500); // 0.5초 후 문이 열리기 시작합니다.

    // Start content fade-in
    setTimeout(() => {
        gameContainer.classList.add('fade-in');
    }, 1500); // 1.5초 후 콘텐츠가 페이드인됩니다. (문이 어느정도 열린 시점)

    // Start loading screen fade-out (after doors are mostly open)
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
    }, 2000); // 2초 후 로딩 화면 전체가 페이드 아웃되기 시작합니다.

    // Hide loading screen completely after fade-out
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 3000); // 2초(페이드 아웃 시작) + 1초(페이드 아웃 지속) 후 로딩 화면이 완전히 사라집니다.
});

// 드래그 시작
crown.addEventListener('dragstart', function(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
});

// 드래그 종료
crown.addEventListener('dragend', function(e) {
    this.classList.remove('dragging');
});

// 각 사람에 대한 드롭 이벤트 설정
[person1, person2].forEach(person => {
    const dropZone = person.querySelector('.drop-zone');

    person.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropZone.classList.add('drag-over');
    });

    person.addEventListener('dragleave', function(e) {
        dropZone.classList.remove('drag-over');
    });

    person.addEventListener('drop', async function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        if (draggedElement && person !== currentOwner) {
            // 현재 왕관을 제거
            draggedElement.remove();

            // 새로운 위치에 왕관 추가
            const newCrown = document.createElement('div');
            newCrown.className = 'crown';
            newCrown.id = 'crown';
            newCrown.draggable = true;
            newCrown.innerHTML = `
                        <div class="crown-points">
                            <div class="point point1"></div>
                            <div class="point point2"></div>
                            <div class="point point3">
                                <div class="gems"></div>
                            </div>
                            <div class="point point4"></div>
                            <div class="point point5"></div>
                        </div>
                        <div class="crown-base"></div>
                    `;

            const head = person.querySelector('.head');
            head.appendChild(newCrown);

            // 새로운 왕관에 이벤트 리스너 추가
            setupCrownEvents(newCrown);

            // 현재 소유자 업데이트
            currentOwner = person;


            // 성공 효과
            person.style.transform = 'scale(1.1)';
            setTimeout(() => {
                person.style.transform = 'scale(1)';
            }, 200);

            //서버로 전달
            if (person === person2) {
                await transferAuthority();
            }
        }
    });
});

function setupCrownEvents(crownElement) {
    crownElement.addEventListener('dragstart', function(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.outerHTML);
    });

    crownElement.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
    });

    crown = crownElement; // 전역 변수 업데이트
}

async function transferAuthority() {
    try {
        const response = await fetch('/Throne/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentNum: window.userData.studentNum,
                name: window.userData.name,
                grade: window.userData.grade
            })
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = result.redirectUrl;
        } else {
            alert('권한 양도 실패: ' + result.message);
        }
    } catch (error) {
        console.error('권한 양도 중 오류:', error);
        alert('서버 통신 오류가 발생했습니다.');
    }
}

// 초기 설정
setupCrownEvents(crown);