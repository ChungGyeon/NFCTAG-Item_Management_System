//계정 생성용 모달창 오픈
function OpenAddAcountModal() {
    document.getElementById("AddAcountModal").style.display = "block";
}
function CloseModal(){
    document.getElementById("AddAcountModal").style.display = "none";
}


//계정 추가 쿼리
function signUpquery() {
    var studentnum = document.getElementById("studentnum").value;
    var password = document.getElementById("password").value;
    var name = document.getElementById("name").value;
    var grade = document.getElementById("grade").value;

    if (studentnum == "" || password == "" || name == "" || grade == "") {
        console.error("모든 필드를 입력해주세요.");
        return;
    }

    const data = {
        studentnum: studentnum,
        password: password,
        name: name,
        grade: grade
    };
    fetch('/users/signUpquery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(async (response) => {
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('계정 추가 성공: ' + result.message);
        })
        .catch(error => {
            alert('계정 추가 실패: ' + error.message);
            /*
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('서버 요청 실패');
                }
            })
            .then(result => {
                alert('계정 추가 성공 : ' + result.message);
            })
            .catch(error => {
                alert('계정 추가 실패 : ' + error.message);
            });
    }*/
        });
};

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
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
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

