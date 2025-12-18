//계정 생성용 모달창 오픈
function OpenAddAcountModal() {
    document.getElementById("AddAcountModal").style.display = "block";
}
function CloseModal(){
    document.getElementById("AddAcountModal").style.display = "none";
    document.getElementById("editItemModal").style.display = "none";
    document.getElementById("AddItemModal").style.display = "none";
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
    */
        });
}

//아이템수정 섹션 여는 놈
function editModalOpen(button) {
    document.getElementById("editItemModal").style.display = "block";
    const tableCard = button.closest('.table-card');
    const itemName = tableCard.querySelector('h3').textContent;
    const sourceImg = tableCard.querySelector('img');
    const imgSrc = sourceImg ? sourceImg.src : "";
    const container = document.getElementById('editItemModalContainer');

    //메모리관리용, 기존내용제거
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    //itemName가져오는놈
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = 'edit_itemName';
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
    imageInput.accept = '.jpg,.jpeg,.png,.webp';
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
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            //확장자 검증
            if (!allowedExtensions.includes(extension)) {
                alert('jpg, jpeg, png, webp 파일만 업로드 가능합니다.');
                imageInput.value = ''; // 선택된 파일 초기화
                return;
            }
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
    const originItemName = document.getElementById('edit_itemName').value;
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



//아이템 추가 쿼리
function addItemQuery() {
    const formData = new FormData();
    const itemName = document.getElementById("addItem_itemName").value;
    const itemImg = document.getElementById("addimageInput");
    if (!itemName) {
        return console.error('입력된게 아무것도 없는뎁슝');
    }

    formData.append('itemName', itemName);
    if(itemImg.files && itemImg.files.length > 0){
        formData.append('itemImg', itemImg.files[0]);
        console.log("테스테테스ㅡ테틑: "+ itemImg.files[0].length);
    }

    fetch('/imgProcess/addItem', {
        method: 'POST',
        body: formData
    })
        .then(async (response) => {
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('아이템 추가 성공: ' + result.message);
            location.reload();
        })
        .catch(error => {
            alert('아이템 추가 실패: ' + error.message);
        });
}


//아이템 추가 모달창 생성
function OpenAddItemModal(button){
    document.getElementById("AddItemModal").style.display = "block";
    const container = document.getElementById('addItemModalContainer');

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const addForm = document.createElement('form');
    addForm.method = 'POST';
    addForm.addEventListener('submit', function(event){
        event.preventDefault();
        addItemQuery();
    });

    const addLabel = document.createElement('label');
    addLabel.setAttribute('for', 'addItem_itemName');
    addLabel.textContent = '아이템 이름';

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.id = 'addItem_itemName';
    addInput.name = 'itemName';
    addInput.required = true;

    const addimageInput = document.createElement('input');
    addimageInput.type = 'file';
    addimageInput.accept = 'image/*';
    addimageInput.id = 'addimageInput';
    //addimageInput.required = true;
    addimageInput.style.display = 'none';

    const img = document.createElement('img');
    img.id = 'itemImg';
    img.src = '/images/introItemAdding.png';
    img.alt = '이미지가 안보인다구요? 어쩌라구여';
    img.style.width = '280px';
    img.style.height = '320px';
    img.style.objectFit = 'cover';
    img.style.cursor = 'pointer';

    // 이미지 클릭 시 파일 선택 창 열기
    img.addEventListener('click', () => addimageInput.click());

    // 이미지 파일이 선택되면 프리뷰 업데이트
    addimageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                img.style.width = '280px';
                img.style.height = '320px';
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer';
            }
            reader.readAsDataURL(file);
        }
    });

    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'AddAcountModal-buttons';

    const addButton = document.createElement('button');
    addButton.type = 'submit';
    addButton.textContent = '추가';

    addForm.appendChild(addLabel);
    addForm.appendChild(addInput);
    addForm.appendChild(addimageInput);
    addForm.appendChild(img);
    buttonDiv.appendChild(addButton);
    addForm.appendChild(buttonDiv);
    container.appendChild(addForm);
}

let originalAccounts = []; //불러오는대로 정렬한 배열
let sortedAccounts = []; //정렬된 배열
let sortState = {}; //현 정렬 상태 (오름차,내림차,원래)

//사용자 리스트 출력
function OpenViewAccountsModal() {
    document.getElementById("ViewAccountsModal").style.display = "block";

    fetch('/users/list')
        .then(res => res.json())
        .then(data => {
            originalAccounts = [...data];
            sortedAccounts = [...data];
            renderAccountTable(sortedAccounts);
        })
        .catch(err => {
            alert('계정 목록 로딩 실패');
            console.error(err);
        });
}

function renderAccountTable(accounts) {
    const tbody = document.getElementById("account-table-body");
    tbody.innerHTML = ''; // 초기화
    accounts.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.studentnum}</td>
            <td>${user.name}</td>
            <td>${user.grade}</td>
            <td>${user.rentedItems || '-'}</td> <!-- ❗ 없는 경우 '-' 표시 -->
        `;
        tbody.appendChild(tr);
    });
}

function sortAccounts(key) {
    if (!sortState[key]) {
        sortState[key] = 'asc';
    } else if (sortState[key] === 'asc') {
        sortState[key] = 'desc';
    } else {
        sortState[key] = null;
    }

    for (let k in sortState) {
        if (k !== key) {
            sortState[k] = null;
        }
    }

    if (sortState[key]) {
        sortedAccounts.sort((a, b) => {
            if (a[key] < b[key]) return sortState[key] === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return sortState[key] === 'asc' ? 1 : -1;
            return 0;
        });
    } else {
        sortedAccounts = [...originalAccounts];
    }

    renderAccountTable(sortedAccounts);
}

function CloseViewAccountsModal() {
    document.getElementById("ViewAccountsModal").style.display = "none";
}

//물건 삭제 요청 쿼리
function deleteSelectedItems() {
    const selectedCheckboxes = document.querySelectorAll('.table-check:checked');

    if (selectedCheckboxes.length === 0) {
        alert('삭제할 물건을 선택해주세요.');
        return;
    }

    const selectedItems = Array.from(selectedCheckboxes).map(checkbox =>
        //data-item-name이 없는데 뭐임
        checkbox.getAttribute('data-item-name')
    );

    if (confirm(`선택된 ${selectedItems.length}개의 물건을 삭제하시겠습니까?`)) {
        // 서버에 삭제 요청 보내기
        fetch('/imgProcess/deleteItems', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: selectedItems })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('물건이 성공적으로 삭제되었습니다.');
                    location.reload(); // 페이지 새로고침
                } else {
                    alert('삭제 실패: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('삭제 중 오류가 발생했습니다.');
            });
    }
}


//관리자 페이지에서 로그 확인하는 곳으로
function goToLog() {
    window.location.href = '/log';
}

//관리자 페이지에서 계정 확인하는 곳으로
function goToAccountList() {
    // 현재 로그인한 사용자의 학번을 서버에 전송하여 권한 확인
    fetch('/admin/check-permission', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 권한이 있으면 계정 관리 페이지로 이동
            window.location.href = '/admin/users';
        } else {
            // 권한이 없으면 에러 메시지 표시
            alert('권한이 없습니다: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
    });
}
//자동새로고침
function setupPageReloadOnBack() {
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupPageReloadOnBack();
});