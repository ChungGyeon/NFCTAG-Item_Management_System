


//쿠키 감지 시작
//ckCookie.ejs에 접속하자마자 window.onload가 실행시켜줌
document.addEventListener('DOMContentLoaded', function() {
    if (confirm("예약한 물품을 대여/반납 확정하시겠습니까?")) {
        fetch('/rent/verify-step3', {
            method: 'POST',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("✅ 완료: " + data.message);
                    location.href = '/itemlist';
                } else {
                    alert("❌ 실패: " + data.message);
                    location.href = '/itemlist';
                }
            })
            .catch(err => {
                alert("⚠️ 서버 오류 발생");
                console.error('대여 요청 에러:', err);
                location.href = '/itemlist';
            });
    }
});

//window.onload = detectRunCookie;