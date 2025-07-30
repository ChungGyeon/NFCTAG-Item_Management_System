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

    //itemName가져오는놈
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = 'itemName';
    hiddenInput.value = itemName;
    container.appendChild(hiddenInput);

    // 텍스트 요소 생성
    const paragraph = document.createElement('input');
    paragraph.type = 'text';
    paragraph.id = 'textInput';
    paragraph.placeholder = '이름 수정 시 이곳에 입력   현재이름 : itemName';

    // 이미지 업로드를 위한 input 생성
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.id = 'imageInput';
    imageInput.style.display = 'none';

    // 이미지 프리뷰 요소 생성
    const img = document.createElement('img');
    img.id = 'itemImg';
    img.src = imgSrc;
    img.alt = '이미지가 안보인다구요? 어쩌라구여';
    img.style.cursor = 'pointer';

    // 이미지 클릭 시 파일 선택 창 열기
    img.addEventListener('click', () => imageInput.click());

    // 이미지 파일이 선택되면 프리뷰 업데이트
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => img.src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    // 구분선 생성
    const hr = document.createElement('hr');

    // 요소들을 순서대로 추가
    container.appendChild(paragraph);
    container.appendChild(imageInput);
    container.appendChild(img);
    container.appendChild(hr);
}


//수정 내용을 서버에 전송하여 수정하는 함수
function updateItem() {
    const formData = new FormData();
    const originItemName = document.getElementById('itemName').value;
    const textInput = document.getElementById('textInput');
    const imageInput = document.getElementById('imageInput');

    if(!textInput.value && !imageInput.value) {
        return console.error('입력된게 아무것도 없는뎁슝');
    }
    if(textInput.value) formData.append('itemName', textInput.value);
    if (imageInput.files[0]) formData.append('image', imageInput.files[0]);
    formData.append('originItemName', originItemName);

    fetch('/imgProcess/updateItem', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('수정이 완료되었습니다.');
                CloseModal();
                location.reload();
            }
        })
        .catch(error => alert('수정 중 오류가 발생했습니다.'));
}