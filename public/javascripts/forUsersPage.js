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