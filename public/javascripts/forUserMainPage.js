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
});

