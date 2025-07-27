
function reserveFromServer(itemName) {
    if (confirm(`${itemName} 예약 하시겠습니까?`)) {
        fetch('/reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemName })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(err => {
                alert("예약 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}

function cancelReservation(itemName) {
    if (confirm(`${itemName} 예약을 취소하시겠습니까?`)) {
        fetch('/reservation/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemName })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(err => {
                alert("예약 취소 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}

function cancelRental(itemName) {
    if (confirm(`${itemName} 대여를 취소하시겠습니까?`)) {
        fetch('/rent/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ itemName })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(err => {
                alert("대여 취소 중 오류가 발생했습니다.");
                console.error(err);
            });
    }
}

//detectCookies.js로 이동됨 추후 삭제 예정
function confirmRental() {
    if (confirm("예약한 물품을 대여 확정하시겠습니까?")) {
        fetch('/rent/verify-step2', {
            method: 'POST',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("✅ 대여 완료: " + data.message);
                    location.reload();
                } else {
                    alert("❌ 실패: " + data.message);
                }
            })
            .catch(err => {
                alert("⚠️ 서버 오류 발생");
                console.error('대여 요청 에러:', err);
            });
    }
}