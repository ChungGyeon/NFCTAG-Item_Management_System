/**
 * 관리자 허브 도움말 기능 스크립트
 */
//자동새로고침
function setupPageReloadOnBack() {
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 요소 참조
    setupPageReloadOnBack();
    const modal = document.getElementById('helpModal');
    const helpBtn = document.getElementById('helpBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeBtn = document.querySelector('.close-btn');
    const helpContent = document.getElementById('helpContent');
    const helpIcons = document.querySelectorAll('.help-icon');
    const helpBanner = document.querySelector('.help-banner');
    const closeBanner = document.querySelector('.close-banner');
    //계정 추가 모달 관련 요소들
    const addAccountModal = document.getElementById('AddAcountModal');
    const openAddAccountBtn = document.getElementById('openAddAccountBtn');
    const closeAddAccountBtn = document.getElementById('closeAddAccountModal');
    const addAccountForm = document.getElementById('addAccountForm');

    // 도움말 데이터
    const helpData = {
        // 전체 도움말
        'general': {
            title: '관리자 허브 사용 가이드',
            content: `
                <p>ITS-IMS 관리자 허브에 오신 것을 환영합니다. 이 페이지는 시스템의 주요 기능에 접근할 수 있는 중앙 허브입니다.</p>
                
                <h3>시작하기</h3>
                <p>관리자 허브는 기능별로 구분된 카드로 구성되어 있습니다. 각 카드에는 관련 기능을 수행하는 버튼이 포함되어 있습니다.</p>
                <p>특정 기능에 대한 자세한 설명이 필요하면, 각 섹션 제목 옆의 <i class="fas fa-info-circle"></i> 아이콘을 클릭하세요.</p>
                
                <div class="tip">
                    <p>대부분의 기능은 관리자 페이지에서도 접근할 수 있습니다. 관리자 허브는 IMS외에 다른 시스템을 추가하는 것을 고려하여 주요 페이지 접근 용도로 사용됩니다.</p>
                </div>
                
                <h3>권한 안내</h3>
                <p>계정 추가를 제외한 모든 계정 수정 권한은 회장에게 있습니다. 관련 작업은 회장님과 함께 처리해주세요.</p>
            `
        },

        // 기본 기능 섹션
        'basic': {
            title: '기본 기능 가이드',
            content: `
                <h3>아이템 대여소</h3>
                <p>물품 대여 및 반납을 진행하는 페이지입니다.</p>
                <ul>
                    <li><strong>물품 대여 방법</strong> <br>
                    예약 가능한 물품을 확인해 예약 버튼을 클릭하여 몇시간 대여할지 정한 후 예약합니다.
                    <br>예약 최소시간은 1시간, 최대 12시간 입니다.
                    <br> 예약한 기기로 동아리방의 IMS시스템 태그에 핸드폰을 태그하여 핸드폰에 나타나는 페이지에 접근합니다.
                    <br>그곳에서 예약을 확정할 수 있습니다.</li>
                    <li><strong>물품 반납</strong> 
                    <br>반납방식도 대여 방법과 동일합니다. 반납을 예약하고 IMS시스템에 태그하여 반납을 실행합니다.</li>
                    <li><strong>연체에 관하여</strong> 
                    <br>대여자가 정한 시간보다 늦게 반납한 만큼 연체가 시작됩니다.
                    <br>연체 후 시간이 지나면 시스템이 자동으로 해지합니다만, 오직 회장님만 상황에따라 직접 대여권한을 복구 할수 있습니다.
                    <br> 수동으로 대여를 금지하는 기능도 만들었지만, 이는 악용할 가능성에 따라 일단 빼두었습니다.
                    <br>만약 추가하고자 하신다면 verify라우터에 엔드포인트를 남겨놓았으니 수정후 사용하시면 되겠습니다.</li>
                </ul>
                
                <h3>관리자 페이지</h3>
                <p>물품추가, 삭제, 계정 관리, 대여장부 등을 수행하는 페이지입니다.</p>
                <ul>
                    <li><strong>물품 관리 방법</strong> 
                    <br>새 물품 등록: 물건추가를 클릭하면 물건 이름과 사진을 넣을 팝업창이 나옵니다. 그곳에 추가할 물건을 넣으시면 됩니다.
                    <br>물품 삭제: 삭제할 물품을 체크하여 물품 삭제 버튼을 클릭하면 됩니다. 반드시 1개 이상의 아이템이 체크되어 있어야합니다.
                    <br>물품 수정: 각 물품의 수정버튼을 클릭 시, 물건 이름과 사진을 변경할 수 있습니다.</li>
                    <li><strong>대여 현황</strong>
                     <br>간단히 부원들과 각 인원이 빌려간 물품을 체크하는 페이지입니다.
                     <br>학번, 이름, 학년을 한번 클릭 시 내림차, 한번 더 클릭 시 오름차순으로 확인가능합니다.</li>
                     <li><strong>대여 장부</strong>
                     <br>월단위로 대여와 반납 상태를 확인가능한 장부입니다.
                     <br> 검색 기능도 있어, 특정 물품의 대여,반납 상황도 확인 가능합니다.</li>
                     <li><strong>계정 관리</strong>
                     <br><strong>오직 회장님만 접근 가능합니다.</strong>
                     <br>이곳에서 모든 계정의 확인, 대여금지 해지, 계정 삭제 그리고, 부회장의 임명과, 회장권한 양도 기능이 있습니다.</li>
                     <div class="tip">
                        <p><strong>주의:</strong> 개개인의 비밀번호는 관리자, 개발자 모두 알 수 있는 방법이 없습니다.
                        <br>따라서 비밀번호를 잊어버린 부원이 있다면, 그 분의 계정을 삭제 후, 다시 생성해주세요.</p>
                     </div>
                     <br>이 기능은 어드민 허브에서도 사용 가능합니다.</li>
                     <li><strong>계정 추가</strong>
                     <br>새로운 부원의 계정을 추가합니다. 이곳에서 학년,이름,학번,비밀번호를 입력하여 바로 추가할 수 있습니다.
                     <br>이 작업은 어드민 허브에서도 사용 가능합니다.</li>
                </ul>
                
                <div class="tip">
                    <p><strong>주의:</strong> 관리자 페이지에서 변경한 설정은 즉시 적용됩니다. 중요한 설정을 변경할 때는 신중하게 검토하세요.</p>
                </div>
            `
        },

        // 로그 및 통계 섹션
        'logs': {
            title: '로그 및 통계 가이드',
            content: `
                <h3>대여/반납 로그</h3>
                <p>시스템에서 발생한 모든 대여 및 반납 활동을 확인할 수 있습니다.</p>
                <ul>
                    <li><strong>월별 조회:</strong> 특정 월의 대여/반납 기록을 확인할 수 있습니다.</li>
                    <li><strong>검색 기능:</strong> 물품명 또는 사용자 이름으로 기록을 검색할 수 있습니다.</li>
                    <li><strong>통계 확인:</strong> 대여 및 반납 건수 등 기본 통계를 볼 수 있습니다.</li>
                </ul>
            `
        },

        // 시스템 관리 섹션
        'system': {
            title: '계정 관리 가이드',
            content: `
                <h3>계정 관리</h3>
                <p>계정의 추가와, 삭제,권한변경 등, IMS 관리자 페이지의 계정관리와 동일한 기능을 제공합니다.</p>
                
                <ul>
                    <li><strong>계정 관리</strong>
                     <strong>오직 회장님만 접근 가능합니다.</strong>
                     <br>이곳에서 모든 계정의 확인, 대여금지 해지, 계정 삭제 그리고, 부회장의 임명과, 회장권한 양도 기능이 있습니다.</li>
                     <div class="tip">
                        <p><strong>주의:</strong> 개개인의 비밀번호는 관리자, 개발자 모두 알 수 있는 방법이 없습니다.
                        <br>따라서 비밀번호를 잊어버린 부원이 있다면, 그 분의 계정을 삭제 후, 다시 생성해주세요.</p>
                     </div>
                     <br>
                </ul>
                <h3>계정 추가</h3>
                <p>새로운 부원의 계정을 추가하는 기능입니다.</p>
                <ul>
                    <li>새로운 부원의 계정을 추가합니다. 이곳에서 학년,이름,학번,비밀번호를 입력하여 바로 추가할 수 있습니다.</li>
                </ul>
            `
        },

        // 확장 기능 섹션
        'expansion': {
            title: '확장 기능 안내',
            content: `
                <h3>확장 기능 영역</h3>
                <p>이 영역은 향후 추가될 새로운 기능을 위한 공간입니다.</p>
                <p>시스템 업데이트 시 이 영역에 새로운 기능 버튼을 추가할 수 있습니다.</p>
                
                <h3>기능 개발</h3>
                <p>새로운 능력자 분께서 다른 시스템을 개발하신다면 어드민 접근 경로는 이곳에서 수행하시길 바랍니다.</p>
                
                <div class="tip">
                    <p><strong>알림:</strong> 이 관리자허브는 능력만 있다면 누구든 수정이 가능합니다.</p>
                </div>
            `
        }
    };

    // 모달 열기 함수
    function openModal(helpType = 'general') {
        const data = helpData[helpType];

        // 모달 내용 업데이트
        if (data) {
            if (helpType !== 'general') {
                document.querySelector('.modal-header h2').innerHTML = `<i class="fas fa-book"></i> ${data.title}`;
            } else {
                document.querySelector('.modal-header h2').innerHTML = `<i class="fas fa-book"></i> 관리자 허브 사용 가이드`;
            }
            helpContent.innerHTML = data.content;
        } else {
            helpContent.innerHTML = '<p>해당 도움말 내용을 찾을 수 없습니다.</p>';
        }

        // 모달 표시
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }


    // 모달 닫기 함수
    function closeModalFunc() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 배경 스크롤 복원
    }

    // 계정 추가 모달 열기
    function openAddAccountModal() {
        addAccountModal.style.display = "block";
    }

    // 계정 추가 모달 닫기
    function closeAddAccountModal() {
        addAccountModal.style.display = "none";
    }

    // 계정 추가 처리
    function handleSignUp(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        // FormData를 URLSearchParams로 변환
        const params = new URLSearchParams();
        for (const [key, value] of formData) {
            params.append(key, value);
        }

        fetch('/users/signUpquery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP 에러!: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                alert('계정이 성공적으로 추가되었습니다.');
                form.reset();
                closeAddAccountModal();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('계정 추가에 실패했습니다: ' + error.message);
            });
    }

    // 이벤트 리스너 설정
    helpBtn.addEventListener('click', () => openModal('general'));
    closeModalBtn.addEventListener('click', closeModalFunc);
    closeBtn.addEventListener('click', closeModalFunc);
    //계정추가 모달 관련
    openAddAccountBtn.addEventListener('click', openAddAccountModal);
    closeAddAccountBtn.addEventListener('click', closeAddAccountModal);
    addAccountForm.addEventListener('submit', handleSignUp);

    // 도움말 아이콘 클릭 이벤트
    helpIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const helpType = e.target.getAttribute('data-help');
            if (helpType) {
                openModal(helpType);
            }
        });
    });

    // 배너 닫기 이벤트
    if (closeBanner) {
        closeBanner.addEventListener('click', () => {
            helpBanner.style.display = 'none';
            // 배너 상태 로컬 스토리지에 저장 (선택적)
            localStorage.setItem('adminHubBannerClosed', 'true');
        });
    }

    // 배너 초기 표시 상태 설정 (선택적)
    if (localStorage.getItem('adminHubBannerClosed') === 'true') {
        helpBanner.style.display = 'none';
    }

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalFunc();
        }
        if (e.target === addAccountModal) {
            closeAddAccountModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModalFunc();
        }
    });

});