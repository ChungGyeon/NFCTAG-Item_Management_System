//예약상태에 따라 버튼 보이는게 다르게 하는 함수
//isReserved는 bool 타입으로 아래 reserveFromServer함수에서 설정함
function updateButtonVisibility(itemName, isReserved) {
    const card = document.querySelector(`[data-item-name="${itemName}"]`);
    if (card) {
        const reserveBtn = card.querySelector('.reserve-btn');
        const cancelBtn = card.querySelector('.cancel-reservation-btn');

        if (isReserved) {
            reserveBtn.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
        } else {
            reserveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'none';
        }
    }
}

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
            if (data.success) {
                updateButtonVisibility(itemName, true);
            }
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
            if (data.success) {
                updateButtonVisibility(itemName, false);
            }
        })
        .catch(err => {
            alert("예약 취소 중 오류가 발생했습니다.");
            console.error(err);
        });
    }
}


//이건 이제 어디다 두지
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