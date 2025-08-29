//예약상태에 따라 버튼 보이는게 다르게 하는 함수
//isReserved는 bool 타입으로 아래 reserveFromServer함수에서 설정함
function updateButtonVisibility(itemName, isReserved) {
    const card = document.querySelector(`[data-item-name="${itemName}"]`);
    if (card) {
        const reserveBtn = card.querySelector('.reserve-btn');
        const cancelBtn = card.querySelector('.cancel-reservation-btn');

        if (isReserved) {
            reserveBtn.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
        } else {
            reserveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'none';
        }
    }
}
/* 기존버전 현버전은 맨 아래에
function reserveFromServer(itemName) {
    if (confirm(`${itemName} 예약 하시겠습니까?`)) {
        fetch('/reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemName })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                updateButtonVisibility(itemName, true);
            }
        })
        .catch(err => {
            alert("예약 중 오류가 발생했습니다.");
            console.error(err);
        });
    }
}
*/
function cancelReservation(itemName) {
    if (confirm(`${itemName} 예약을 취소하시겠습니까?`)) {
        fetch('/reservation/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemName })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                updateButtonVisibility(itemName, false);
            }
        })
        .catch(err => {
            alert("예약 취소 중 오류가 발생했습니다.");
            console.error(err);
        });
    }
}


//이건 이제 어디다 두지
function cancelRental(itemName) {
    if (confirm(`${itemName} 대여를 취소하시겠습니까?`)) {
        fetch('/rent/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ itemName })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(err => {
                alert("대여 취소 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}


//반납 예약 테스트
function reserveFromServer2(itemName) {
    if (confirm(`${itemName} 을 반납 예약 하겠습니까?`)) {
        fetch('/reservation2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ itemName })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(err => {
                alert("반납 신청 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}

//반납 예약 취소
function cancelRental2(itemName) {
    if (confirm(`${itemName} 을 반납 예약 취소 하시겠습니까?`)) {
        fetch('/reservation/cancel2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemName })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
            })
            .catch(err => {
                alert("반납 취소 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}

//남은 대여시간 계산 함수
function initCountdowns() {
    const countdowns = document.querySelectorAll('.countdown');

    countdowns.forEach(countdown => {
        const rentHours = parseInt(countdown.dataset.rentHours, 10);
        const rentStartStr = countdown.dataset.rentStart;

        if (isNaN(rentHours) || !rentStartStr) {
            return;
        }

        const rentStart = new Date(rentStartStr);
        const endTime = new Date(rentStart.getTime() + (rentHours * 60 * 60 * 1000));

        function updateCountdown() {
            const now = new Date();
            const timeLeft = endTime - now;

            if (timeLeft <= 0) {
                countdown.textContent = "대여 시간 종료";
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            countdown.textContent = `(남은시간: ${hours}시간 ${minutes}분)`;
        }

        updateCountdown();
        setInterval(updateCountdown, 60000); // 1분마다 업데이트
    });
}
document.addEventListener('DOMContentLoaded', initCountdowns);


// 비밀번호 변경 모달 표시
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
}

// 비밀번호 변경 모달 닫기
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

// 비밀번호 변경 폼 제출 처리
document.addEventListener('DOMContentLoaded', function() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // 새 비밀번호 확인
            if (newPassword !== confirmPassword) {
                alert('새 비밀번호가 일치하지 않습니다.');
                return;
            }
            
            // 비밀번호 길이 확인
            //만약 이걸 보고 있는 클라이언트분? 최소 숫자를 맞출필요는 없지만, 이후 책임은 안집니다?
            if (newPassword.length < 6) {
                alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
                return;
            }
            
            // 서버에 비밀번호 변경 요청
            fetch('/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('비밀번호가 성공적으로 변경되었습니다.');
                    closeChangePasswordModal();
                } else {
                    alert('비밀번호 변경 실패: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('비밀번호 변경 중 오류가 발생했습니다.');
            });
        });
    }
    
    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
        const modal = document.getElementById('changePasswordModal');
        if (event.target === modal) {
            closeChangePasswordModal();
        }
    }
    initCountdowns();

});



let selectedItemName = null;
let currentSelectedHour = 1;

function reserveFromServer(itemName) {
    selectedItemName = itemName;
    currentSelectedHour = 1;

    // 모달 표시
    document.getElementById("timePickerModal").style.display = "block";

    // 휠 초기화
    initializeWheel();
}

function closeTimePickerModal() {
    document.getElementById("timePickerModal").style.display = "none";
    selectedItemName = null;
    currentSelectedHour = 1;
    isDragging = false;
}

function initializeWheel() {
    const wheelPicker = document.getElementById('wheelPicker');

    // 기존 리스트 아이템 제거
    wheelPicker.innerHTML = '';

    // 1~12시간 리스트 아이템 생성
    for (let i = 1; i <= 12; i++) {
        const li = document.createElement('li');
        li.textContent = i;
        li.dataset.hour = i;

        // 클릭 이벤트 추가
        li.addEventListener('click', function(e) {
            if (!isDragging) {
                selectHour(i);
            }
        });

        wheelPicker.appendChild(li);
    }

    // 드래그 이벤트 리스너 추가
    addDragListeners(wheelPicker);

    // 첫 번째 아이템 선택
    selectHour(1);
}
function addDragListeners(wheelPicker) {
    // 마우스 이벤트
    wheelPicker.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // 터치 이벤트 (모바일)
    wheelPicker.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // 드래그 방지
    wheelPicker.addEventListener('dragstart', e => e.preventDefault());
}

function handleDragStart(e) {
    isDragging = true;
    startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;

    const wheelPicker = document.getElementById('wheelPicker');
    wheelPicker.style.transition = 'none';

    e.preventDefault();
}

function handleDragMove(e) {
    if (!isDragging) return;

    const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    const deltaY = currentY - startY;

    const wheelPicker = document.getElementById('wheelPicker');
    const newTransform = currentTransform + deltaY;

    // 드래그 범위 제한 (1시간~12시간)
    const minTransform = 50 - (12 - 1) * 50; // -500px
    const maxTransform = 50; // 50px

    const clampedTransform = Math.max(minTransform, Math.min(maxTransform, newTransform));
    wheelPicker.style.transform = `translateY(${clampedTransform}px)`;


    // 드래그 중에도 1 미만, 12 초과로 이동 시 자동 복원
    if (clampedTransform === minTransform) {
        selectHour(12);
    } else if (clampedTransform === maxTransform) {
        selectHour(1);
    }

    e.preventDefault();
}

function handleDragEnd(e) {
    if (!isDragging) return;

    isDragging = false;

    const wheelPicker = document.getElementById('wheelPicker');
    const currentY = e.type === 'mouseup' ? e.clientY : (e.changedTouches ? e.changedTouches[0].clientY : startY);
    const deltaY = currentY - startY;

    // 최종 위치 계산
    const newTransform = currentTransform + deltaY;

    // 가장 가까운 시간으로 스냅
    let hourIndex = Math.round((50 - newTransform) / 50);

    if(hourIndex < 0) {
        hourIndex = 0;
    }
    else if (hourIndex > 11) {
        hourIndex = 11;
    }

    const selectedHour = hourIndex + 1;

    // 트랜지션 다시 활성화
    wheelPicker.style.transition = 'transform 0.3s ease';

    // 선택된 시간으로 이동
    selectHour(selectedHour);
}


function selectHour(hour) {
    currentSelectedHour = hour;
    currentTransform = 50 - (hour - 1) * 50;

    const wheelPicker = document.getElementById('wheelPicker');
    const items = wheelPicker.querySelectorAll('li');

    // 모든 아이템에서 selected 클래스 제거
    items.forEach(item => item.classList.remove('selected'));

    // 선택된 아이템에 selected 클래스 추가
    const selectedItem = wheelPicker.querySelector(`li[data-hour="${hour}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }

    // 휠 위치 조정 (선택된 아이템이 중앙에 오도록)
    wheelPicker.style.transform = `translateY(${currentTransform}px)`;

    const displayElement = document.getElementById('selectedHourDisplay');
    if (displayElement) {
        displayElement.textContent = hour;
    }
}

function confirmWheel() {
    if (!selectedItemName || !currentSelectedHour) {
        alert('오류가 발생했습니다. 다시 시도해주세요.');
        return;
    }

    if (confirm(`${selectedItemName}을(를) ${currentSelectedHour}시간 동안 예약하시겠습니까?`)) {
        // 서버에 예약 요청
        fetch('/reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemName: selectedItemName,
                rentalHours: currentSelectedHour
            })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    updateButtonVisibility(selectedItemName, true);
                    closeTimePickerModal();
                }
            })
            .catch(err => {
                alert("예약 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}

// 연체시간 실시간 카운트다운 기능
function startOverdueCountdown() {
    const remainingTimeElement = document.querySelector('.remaining-time');

    if (!remainingTimeElement) return;

    let remainingSeconds = parseInt(remainingTimeElement.dataset.remaining);

    if (remainingSeconds <= 0) {
        // 이미 시간이 다 된 경우 페이지 새로고침
        setTimeout(() => {
            location.reload();
        }, 3000);
        return;
    }

    const countdown = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            clearInterval(countdown);
            remainingTimeElement.textContent = "00:00:00";

            // 권한 복구 메시지 표시
            const overdueAlert = document.querySelector('.overdue-alert');
            if (overdueAlert) {
                overdueAlert.className = 'overdue-alert ready-restore';
                overdueAlert.innerHTML = `
                    <h4>⏰ 연체 제재 해제 가능</h4>
                    <p>연체 제재 시간이 만료되었습니다.</p>
                    <p>5분 이내에 자동으로 대여 권한이 복구됩니다.</p>
                `;
            }

            // 5초 후 페이지 새로고침
            setTimeout(() => {
                location.reload();
            }, 5000);

            return;
        }

        // 시간 형식으로 변환하여 표시
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;

        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        remainingTimeElement.textContent = timeString;

        // 시간이 10분 이하일 때 강조 표시
        if (remainingSeconds <= 600) {
            remainingTimeElement.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
            remainingTimeElement.style.color = '#c0392b';
        }

        // 시간이 1분 이하일 때 깜빡이는 효과
        if (remainingSeconds <= 60) {
            remainingTimeElement.style.animation = 'blink 1s infinite';
        }

    }, 1000);
}

// 깜빡이는 애니메이션을 위한 CSS 동적 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
    }
`;
document.head.appendChild(style);

//페이지 진입시 자동 새로고침
function setupPageReloadOnBack() {
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });
}

//체이지 접속 시 연체 계산, 새로고침을 수행
document.addEventListener('DOMContentLoaded', function() {
    startOverdueCountdown();
    setupPageReloadOnBack();
});