// 계정 삭제 모달 표시 함수
function showDeleteModal(studentNum, userName, isPresident, isVicePresident) {
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');
    const confirmBtn = document.getElementById('confirmDelete');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;

    if (isPresident || isVicePresident) {
        message.innerHTML = `<strong>${userName}</strong>님은 ${isPresident ? '회장' : '부회장'}이므로 삭제할 수 없습니다.`;
        confirmBtn.style.display = 'none';
    } else {
        message.innerHTML = `<strong>${userName}</strong>님의 계정을 정말 삭제하시겠습니까?<br><br><small style="color: #dc3545;">※ 이 작업은 되돌릴 수 없습니다.</small>`;
        confirmBtn.style.display = 'inline-block';
    }

    modal.style.display = 'block';
}

// 계정 삭제 모달 닫기 함수
function closeModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.getElementById('appointmentVicePresidentModal').style.display = 'none';
    document.getElementById('removeVicePresidentModal').style.display = 'none';
    window.currentStudentNum = null;
}

// 계정 삭제 실행 함수
function deleteUser() {
    const studentNum = window.currentStudentNum;
    if (!studentNum) return;

    fetch('/admin/delete-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentNum: studentNum })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('계정이 성공적으로 삭제되었습니다.');
                location.reload();
            } else {
                alert('삭제 실패: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('삭제 중 오류가 발생했습니다.');
        })
        .finally(() => {
            closeModal();
        });
}

// 부회장 임명 확인 모달창 오픈
function showAppointmentVicePresident(studentNum, userName) {
    const modal = document.getElementById('appointmentVicePresidentModal');
    const message = document.getElementById('appointmentMessage');
    const confirmBtn = document.getElementById('confirmappointment');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;
    window.currentAction = 'appoint';

    message.innerHTML = `<strong>${userName}</strong>님을 부회장으로 임명하시겠습니까?<br><br><small style="color: #28a745;">※ 부회장 권한이 부여됩니다.</small>`;
    confirmBtn.style.display = 'inline-block';

    modal.style.display = 'block';
}

// 부회장 해임 확인 모달창 오픈
function showRemoveVicePresident(studentNum, userName) {
    const modal = document.getElementById('removeVicePresidentModal');
    const message = document.getElementById('removeMessage');
    const confirmBtn = document.getElementById('confirmRemove');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;
    window.currentAction = 'remove';

    message.innerHTML = `<strong>${userName}</strong>님의 부회장 권한을 해임하시겠습니까?<br><br><small style="color: #dc3545;">※ 부회장 권한이 제거됩니다.</small>`;
    confirmBtn.style.display = 'inline-block';

    modal.style.display = 'block';
}





// 부회장 권한 변경 실행 함수
function changeVicePresidentStatus() {
    const studentNum = window.currentStudentNum;
    const action = window.currentAction;
    
    if (!studentNum || !action) return;

    const endpoint = action === 'appoint' ? '/admin/appoint-vice-president' : '/admin/remove-vice-president';

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentNum: studentNum })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const actionText = action === 'appoint' ? '임명' : '해임';
            alert(`부회장 ${actionText}이 성공적으로 완료되었습니다.`);
            location.reload();
        } else {
            alert(`${action === 'appoint' ? '임명' : '해임'} 실패: ` + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('처리 중 오류가 발생했습니다.');
    })
    .finally(() => {
        closeModal();
    });
}

// 권한 양도 섹션 표시/숨김 기능
function revealThroneSection() {
    const throneSection = document.getElementById('throneSection');
    const secretTrigger = document.querySelector('.secret-throne-trigger');

    // 섹션을 보이게 하고 애니메이션 적용
    throneSection.style.display = 'block';

    // 약간의 딜레이 후 revealed 클래스 추가 (애니메이션 효과)
    setTimeout(() => {
        throneSection.classList.add('revealed');
    }, 50);

    // 비밀 버튼 일시적으로 숨기기
    secretTrigger.style.opacity = '0';
    secretTrigger.style.pointerEvents = 'none';

    // 페이지를 아래로 스크롤하여 섹션이 보이도록
    setTimeout(() => {
        throneSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 300);
}

function hideThroneSection() {
    const throneSection = document.getElementById('throneSection');
    const secretTrigger = document.querySelector('.secret-throne-trigger');

    // revealed 클래스 제거
    throneSection.classList.remove('revealed');

    // 애니메이션이 끝난 후 완전히 숨기기
    setTimeout(() => {
        throneSection.style.display = 'none';
    }, 600);

    // 비밀 버튼 다시 보이게 하기
    setTimeout(() => {
        secretTrigger.style.opacity = '1';
        secretTrigger.style.pointerEvents = 'auto';
    }, 300);
}

// 페이지 외부 클릭 시 권한 양도 섹션 숨기기
document.addEventListener('click', function(event) {
    const throneSection = document.getElementById('throneSection');
    const secretTrigger = document.querySelector('.secret-throne-trigger');

    // 권한 양도 섹션이 열려있고, 클릭한 요소가 섹션 내부가 아니며, 비밀 버튼도 아닐 때
    if (throneSection && throneSection.classList.contains('revealed')) {
        if (!throneSection.contains(event.target) && !secretTrigger.contains(event.target)) {
            hideThroneSection();
        }
    }
});

// ESC 키로 권한 양도 섹션 닫기
document.addEventListener('keydown', function(event) {
    const throneSection = document.getElementById('throneSection');

    if (event.key === 'Escape' && throneSection && throneSection.classList.contains('revealed')) {
        hideThroneSection();
    }
});

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const deleteModal = document.getElementById('deleteModal');
    const appointmentModal = document.getElementById('appointmentVicePresidentModal');
    const removeModal = document.getElementById('removeVicePresidentModal');
    
    if (event.target === deleteModal || event.target === appointmentModal || event.target === removeModal) {
        closeModal();
    }
}

// DOM이 완전히 로드된 후 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 삭제 확인 버튼 이벤트
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteUser();
        });
    }

    // 부회장 임명 확인 버튼 이벤트
    const confirmAppointmentBtn = document.getElementById('confirmappointment');
    if (confirmAppointmentBtn) {
        confirmAppointmentBtn.addEventListener('click', function() {
            changeVicePresidentStatus();
        });
    }

    // 부회장 해임 확인 버튼 이벤트
    const confirmRemoveBtn = document.getElementById('confirmRemove');
    if (confirmRemoveBtn) {
        confirmRemoveBtn.addEventListener('click', function() {
            changeVicePresidentStatus();
        });
    }

    const restoreRentPermBtns = document.querySelectorAll('.restore-rent-perm-btn');
    restoreRentPermBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const studentNum = this.getAttribute('data-student-num');
            const name = this.getAttribute('data-name');

            if (!studentNum) {
                alert('학번 정보가 없습니다.');
                return;
            }

            fetch('/checkOverdue/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({studentNum: studentNum})
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(`${name}님의 대여권한을 성공적으로 복구했습니다.`);
                        location.reload();
                    } else {
                        alert(`${name}님의 대여권한 복구 실패: ${data.message}`);
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('처리 중 오류가 발생했습니다.');
                });
        });
    });
});