document.addEventListener('DOMContentLoaded', () => {
    const prepareButton = document.getElementById('prepare-button');
    const warningModal = document.getElementById('warning-modal');
    const confirmButton = document.getElementById('confirm-button');
    const cancelButton = document.getElementById('cancel-button');
    const successionForm = document.getElementById('succession-form');

    prepareButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        // Check if all fields are filled
        const studentnum = document.getElementById('studentnum').value;
        const name = document.getElementById('name').value;
        const grade = document.getElementById('grade').value;

        if (studentnum && name && grade) {
            warningModal.style.display = 'flex';
        } else {
            alert('모든 필드를 입력해주세요.');
        }
    });

    cancelButton.addEventListener('click', () => {
        warningModal.style.display = 'none';
    });

    confirmButton.addEventListener('click', () => {
        sendInfo();
    });

    // Close modal if clicking on the overlay
    warningModal.addEventListener('click', (e) => {
        if (e.target === warningModal) {
            warningModal.style.display = 'none';
        }
    });
});



//정보 전송
async function sendInfo() {
    const studentNum = document.getElementById('studentnum').value;
    const name = document.getElementById('name').value;
    const grade = document.getElementById('grade').value;

    try {
        const response = await fetch('/Throne/nextDOA', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentNum, name, grade })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.redirectUrl) {
                // Redirect to the confirmation page on success
                window.location.href = result.redirectUrl;
            } else {
                // Handle cases where success is false or redirectUrl is missing
                alert(result.message || '알 수 없는 오류가 발생했습니다.');
            }
        } else {
            // Handle non-2xx responses (like the 409 Conflict)
            const errorResult = await response.json();
            alert(errorResult.message || '입력이 잘못되었습니다.');
        }
    } catch (err) {
        console.error('서버 에러:', err);
        alert('서버 오류가 발생했습니다.');
    }
}