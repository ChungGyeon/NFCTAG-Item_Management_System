


//쿠키 감지 시작
//ckCookie.ejs에 접속하자마자 window.onload가 실행시켜줌
document.addEventListener('DOMContentLoaded', function() {
    if (confirm("예약한 물품을 대여 확정하시겠습니까?")) {
        fetch('/rent/verify-step2', {
            method: 'POST',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("✅ 대여 완료: " + data.message);
                    location.href = '/';
                } else {
                    alert("❌ 실패: " + data.message);
                }
            })
            .catch(err => {
                alert("⚠️ 서버 오류 발생");
                console.error('대여 요청 에러:', err);
            });
    }
});

window.onload = detectRunCookie;