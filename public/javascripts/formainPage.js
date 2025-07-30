//계정 생성용 모달창 오픈
function OpenAddAcountModal() {
    document.getElementById("AddAcountModal").style.display = "block";
}
function CloseModal(){
    document.getElementById("AddAcountModal").style.display = "none";
    document.getElementById("editItemModal").style.display = "none";
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
}

//아이템수정 섹션 여는 놈
function editModalOpen(button) {
    document.getElementById("editItemModal").style.display = "block";
    const tableCard = button.closest('.table-card');
    const itemName = tableCard.querySelector('h3').textContent;
    const imgSrc = tableCard.querySelector('img').getAttribute('src');

    const container = document.getElementById('editItemModalContainer');

    //메모리관리용, 기존내용제거
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // 텍스트 요소 생성
    const paragraph = document.createElement('p');
    paragraph.textContent = itemName;

    // 이미지 요소 생성
    const img = document.createElement('img');
    img.id = 'itemImg';
    img.src = imgSrc;
    img.alt = '이미지가 안보인다고요? 어쩌라구요';

    // 구분선 생성
    const hr = document.createElement('hr');

    // 요소들을 순서대로 추가
    container.appendChild(paragraph);
    container.appendChild(img);
    container.appendChild(hr);
}