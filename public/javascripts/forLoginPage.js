function loginquery() {
    document.querySelector('form').addEventListener('submit', async function (e) {
        e.preventDefault(); // 폼 기본 제출 방지

        const studentnum = document.getElementById('studentnum').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentnum, password })
            });

            if (response.ok) {
                const result = await response.json();
                alert('로그인 성공');
                window.location.href = '/'; // 로그인 성공 시 리다이렉트

            } else {
                const error = await response.text();
                alert('로그인 실패: ' + error);
            }
        } catch (err) {
            console.error('서버 에러:', err);
            alert('서버 오류가 발생했습니다.');
        }
    });
};