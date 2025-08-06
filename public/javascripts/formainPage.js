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


//아이템 추가용 모달창 오픈
function OpenAddItemModal() {
    document.getElementById("AddItemModal").style.display = "block";
}
function CloseAddItemModal() {
    document.getElementById("AddItemModal").style.display = "none";
}


//아이템 추가 쿼리
function addItemQuery() {
    const itemName = document.getElementById("itemName").value;

    if (!itemName) {
        alert("아이템 이름을 입력해주세요.");
        return;
    }

    fetch('/util/addItem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemName })
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
function OpenViewAccountsModal() {
    document.getElementById("ViewAccountsModal").style.display = "block";

    fetch('/users/list')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("account-table-body");
            tbody.innerHTML = ''; // 초기화
            data.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.studentnum}</td>
                    <td>${user.name}</td>
                    <td>${user.grade}</td>
                    <td>${user.rentedItems || '-'}</td> <!-- ❗ 없는 경우 '-' 표시 -->
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            alert('계정 목록 로딩 실패');
            console.error(err);
        });
}

function CloseViewAccountsModal() {
    document.getElementById("ViewAccountsModal").style.display = "none";
}