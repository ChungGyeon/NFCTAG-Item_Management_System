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
            closeDeleteModal();
        });
}

//부회장 임명 확인 모달창 오픈
function showAppointmentVicePresident(studentNum, userName, isPresident, isVicePresident) {
    const modal = document.getElementById('appointmentVicePresidentModal');
    const message = document.getElementById('appointmentMessage');
    const confirmBtn = document.getElementById('confirmappointment');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;

    if (isPresident || isVicePresident) {
        message.innerHTML = `<strong>${userName}</strong>님은 이미 ${isPresident ? '회장' : '부회장'}이므로 부여할 수 없습니다.`;
        confirmBtn.style.display = 'none';
    } else {
        message.innerHTML = `<strong>${userName}</strong>님의 계정을 정말 부회장으로 임명 하사겠습니까?<br><br>`;
        confirmBtn.style.display = 'inline-block';
    }

    modal.style.display = 'block';
}





// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
}

// 삭제 확인 버튼 이벤트
document.getElementById('confirmDelete').addEventListener('click', function() {
    deleteUser();
});