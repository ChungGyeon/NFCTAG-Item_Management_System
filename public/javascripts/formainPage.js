//계정 생성용 모달창 오픈
function OpenAddAcountModal() {
    document.getElementById("AddAcountModal").style.display = "block";
}
function CloseModal(){
    document.getElementById("AddAcountModal").style.display = "none";
}


//계정 추가 쿼리
function signUpquery(){
    var studentnum = document.getElementById("studentnum").value;
    var password = document.getElementById("password").value;
    var name = document.getElementById("name").value;
    var grade = document.getElementById("grade").value;

    if(studentnum == "" || password == "" || name == "" || grade == ""){
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
            'Content-Type': 'application/json'},
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
            alert('계정 추가 성공: ' + result.message);
        })
        .catch(error => {
            console.error('에러:', error);
            alert('계정 추가 실패');
        });
         */
        });
}