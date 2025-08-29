// 계정 삭제 모달 표시 함수
function showDeleteModal(studentNum, userName, isPresident, isVicePresident) {
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');
    const confirmBtn = document.getElementById('confirmDelete');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;

    if (isPresident || isVicePresident) {
        message.innerHTML = `<strong>${userName}</strong>님은 ${isPresident ? '회장' : '부회장'}이므로 삭제할 수 없습니다.`;
        confirmBtn.style.display = 'none';
    } else {
        message.innerHTML = `<strong>${userName}</strong>님의 계정을 정말 삭제하시겠습니까?<br><br><small style="color: #dc3545;">※ 이 작업은 되돌릴 수 없습니다.</small>`;
        confirmBtn.style.display = 'inline-block';
    }

    modal.style.display = 'block';
}

// 계정 삭제 모달 닫기 함수
function closeModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.getElementById('appointmentVicePresidentModal').style.display = 'none';
    document.getElementById('removeVicePresidentModal').style.display = 'none';
    document.getElementById('bulkGradeUpdateModal').style.display = 'none';
    window.currentStudentNum = null;
    window.currentAction = null;
    window.currentBulkAction = null;
}

// 계정 삭제 실행 함수
function deleteUser() {
    const studentNum = window.currentStudentNum;
    if (!studentNum) return;

    fetch('/admin/delete-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentNum: studentNum })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('계정이 성공적으로 삭제되었습니다.');
                location.reload();
            } else {
                alert('삭제 실패: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('삭제 중 오류가 발생했습니다.');
        })
        .finally(() => {
            closeModal();
        });
}

// 부회장 임명 확인 모달창 오픈
function showAppointmentVicePresident(studentNum, userName) {
    const modal = document.getElementById('appointmentVicePresidentModal');
    const message = document.getElementById('appointmentMessage');
    const confirmBtn = document.getElementById('confirmappointment');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;
    window.currentAction = 'appoint';

    message.innerHTML = `<strong>${userName}</strong>님을 부회장으로 임명하시겠습니까?<br><br><small style="color: #28a745;">※ 부회장 권한이 부여됩니다.</small>`;
    confirmBtn.style.display = 'inline-block';

    modal.style.display = 'block';
}

// 부회장 해임 확인 모달창 오픈
function showRemoveVicePresident(studentNum, userName) {
    const modal = document.getElementById('removeVicePresidentModal');
    const message = document.getElementById('removeMessage');
    const confirmBtn = document.getElementById('confirmRemove');

    // 전역 변수에 현재 선택된 학번 저장
    window.currentStudentNum = studentNum;
    window.currentAction = 'remove';

    message.innerHTML = `<strong>${userName}</strong>님의 부회장 권한을 해임하시겠습니까?<br><br><small style="color: #dc3545;">※ 부회장 권한이 제거됩니다.</small>`;
    confirmBtn.style.display = 'inline-block';

    modal.style.display = 'block';
}

// 부회장 권한 변경 실행 함수
function changeVicePresidentStatus() {
    const studentNum = window.currentStudentNum;
    const action = window.currentAction;
    
    if (!studentNum || !action) return;

    const endpoint = action === 'appoint' ? '/admin/appoint-vice-president' : '/admin/remove-vice-president';

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentNum: studentNum })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const actionText = action === 'appoint' ? '임명' : '해임';
            alert(`부회장 ${actionText}이 성공적으로 완료되었습니다.`);
            location.reload();
        } else {
            alert(`${action === 'appoint' ? '임명' : '해임'} 실패: ` + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('처리 중 오류가 발생했습니다.');
    })
    .finally(() => {
        closeModal();
    });
}

// 권한 양도 섹션 표시/숨김 기능
function revealThroneSection() {
    const throneSection = document.getElementById('throneSection');
    const secretTrigger = document.querySelector('.secret-throne-trigger');

    // 섹션을 보이게 하고 애니메이션 적용
    throneSection.style.display = 'block';

    // 약간의 딜레이 후 revealed 클래스 추가 (애니메이션 효과)
    setTimeout(() => {
        throneSection.classList.add('revealed');
    }, 50);

    // 비밀 버튼 일시적으로 숨기기
    secretTrigger.style.opacity = '0';
    secretTrigger.style.pointerEvents = 'none';

    // 페이지를 아래로 스크롤하여 섹션이 보이도록
    setTimeout(() => {
        throneSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 300);
}

function hideThroneSection() {
    const throneSection = document.getElementById('throneSection');
    const secretTrigger = document.querySelector('.secret-throne-trigger');

    // revealed 클래스 제거
    throneSection.classList.remove('revealed');

    // 애니메이션이 끝난 후 완전히 숨기기
    setTimeout(() => {
        throneSection.style.display = 'none';
    }, 600);

    // 비밀 버튼 다시 보이게 하기
    setTimeout(() => {
        secretTrigger.style.opacity = '1';
        secretTrigger.style.pointerEvents = 'auto';
    }, 300);
}

// 페이지 외부 클릭 시 권한 양도 섹션 숨기기
document.addEventListener('click', function(event) {
    const throneSection = document.getElementById('throneSection');
    const secretTrigger = document.querySelector('.secret-throne-trigger');

    // 권한 양도 섹션이 열려있고, 클릭한 요소가 섹션 내부가 아니며, 비밀 버튼도 아닐 때
    if (throneSection && throneSection.classList.contains('revealed')) {
        if (!throneSection.contains(event.target) && !secretTrigger.contains(event.target)) {
            hideThroneSection();
        }
    }
});

// ESC 키로 권한 양도 섹션 닫기
document.addEventListener('keydown', function(event) {
    const throneSection = document.getElementById('throneSection');

    if (event.key === 'Escape' && throneSection && throneSection.classList.contains('revealed')) {
        hideThroneSection();
    }
});

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const deleteModal = document.getElementById('deleteModal');
    const appointmentModal = document.getElementById('appointmentVicePresidentModal');
    const removeModal = document.getElementById('removeVicePresidentModal');
    
    if (event.target === deleteModal || event.target === appointmentModal || event.target === removeModal) {
        closeModal();
    }
}
//자동 새로고침
function setupPageReloadOnBack() {
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });
}

// 페이지 로드 시 정렬 및 검색 기능 초기화
document.addEventListener('DOMContentLoaded', function() {
    setupPageReloadOnBack();
    // 정렬 기능 초기화
    initSorting();

    // 검색 기능 초기화
    initSearch();

    // 학년 수정 기능 초기화
    initGradeEditing();

    // 전체 학년 관리 기능 초기화
    initBulkGradeManagement();

    // 기존 이벤트 리스너 설정
    setupModalEventListeners();
});

// 정렬 관련 변수
let currentSortColumn = null;
let currentSortDirection = 'asc';

// 정렬 기능 초기화
function initSorting() {
    const sortableHeaders = document.querySelectorAll('th.sortable');

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortColumn = this.getAttribute('data-sort');

            // 같은 열을 다시 클릭하면 정렬 방향 전환
            if (sortColumn === currentSortColumn) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortColumn;
                currentSortDirection = 'asc';
            }

            // 정렬 아이콘 업데이트
            updateSortIcons(this);

            // 테이블 정렬 실행
            sortTable(sortColumn, currentSortDirection);
        });
    });
}

// 정렬 아이콘 업데이트
function updateSortIcons(activeHeader) {
    // 모든 헤더의 아이콘 초기화
    document.querySelectorAll('th.sortable .sort-icon').forEach(icon => {
        icon.textContent = '⇕';
    });

    // 활성화된 헤더의 아이콘 업데이트
    const activeIcon = activeHeader.querySelector('.sort-icon');
    activeIcon.textContent = currentSortDirection === 'asc' ? '↑' : '↓';
}

// 테이블 정렬 함수
function sortTable(column, direction) {
    const tbody = document.getElementById('userTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // 정렬 함수
    const compareFn = (a, b) => {
        let valueA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        let valueB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();

        // 숫자 데이터인 경우 숫으로 변환
        if (column === 'studentNum' || column === 'grade') {
            valueA = parseInt(valueA) || 0;
            valueB = parseInt(valueB) || 0;
        }

        // 정렬 방향에 따라 비교 결과 반환
        if (direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    };

    // 행 정렬
    rows.sort(compareFn);

    // 정렬된 행을 다시 테이블에 추가
    rows.forEach(row => {
        tbody.appendChild(row);
    });
}

// 검색 기능 초기화
function initSearch() {
    const searchInput = document.getElementById('userSearchInput');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener('click', function() {
        filterTable(searchInput.value.trim());
    });

    // 엔터 키로 검색
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterTable(this.value.trim());
        }
    });

    // 초기화 버튼 클릭 이벤트
    resetButton.addEventListener('click', function() {
        searchInput.value = '';
        filterTable('');
    });
}

// 테이블 필터링 함수
function filterTable(searchTerm) {
    const tbody = document.getElementById('userTableBody');
    const rows = tbody.querySelectorAll('tr');

    searchTerm = searchTerm.toLowerCase();

    rows.forEach(row => {
        const studentNum = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();

        if (studentNum.includes(searchTerm) || name.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 열 인덱스 가져오기 (1부터 시작)
function getColumnIndex(column) {
    const columns = {
        'studentNum': 1,
        'name': 2,
        'grade': 3
    };

    return columns[column] || 1;
}

// 모달 이벤트 리스너 설정
function setupModalEventListeners() {
    // 삭제 확인 버튼
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteUser);
    }

    // 부회장 임명 확인 버튼
    const confirmAppointmentBtn = document.getElementById('confirmappointment');
    if (confirmAppointmentBtn) {
        confirmAppointmentBtn.addEventListener('click', changeVicePresidentStatus);
    }

    // 부회장 해임 확인 버튼
    const confirmRemoveBtn = document.getElementById('confirmRemove');
    if (confirmRemoveBtn) {
        confirmRemoveBtn.addEventListener('click', changeVicePresidentStatus);
    }
}

// 개별 학년 수정 기능 초기화
function initGradeEditing() {
    // 수정 버튼 클릭 이벤트
    const editButtons = document.querySelectorAll('.edit-grade-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 현재 학년 셀
            const gradeCell = this.closest('.grade-cell');

            // 표시 요소와 수정 컨트롤 가져오기
            const gradeDisplay = gradeCell.querySelector('.grade-display');
            const editControls = gradeCell.querySelector('.grade-edit-controls');

            // 표시 요소 숨기고 수정 컨트롤 보이기
            gradeDisplay.style.display = 'none';
            editControls.style.display = 'flex';
            this.style.display = 'none';
        });
    });

    // 취소 버튼 클릭 이벤트
    const cancelButtons = document.querySelectorAll('.cancel-grade-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 현재 학년 셀
            const gradeCell = this.closest('.grade-cell');

            // 표시 요소와 수정 컨트롤, 수정 버튼 가져오기
            const gradeDisplay = gradeCell.querySelector('.grade-display');
            const editControls = gradeCell.querySelector('.grade-edit-controls');
            const editButton = gradeCell.querySelector('.edit-grade-btn');

            // 수정 컨트롤 숨기고 표시 요소와 수정 버튼 보이기
            editControls.style.display = 'none';
            gradeDisplay.style.display = 'inline';
            editButton.style.display = 'inline-block';
        });
    });

    // 저장 버튼 클릭 이벤트
    const saveButtons = document.querySelectorAll('.save-grade-btn');
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 학번과 새 학년 값 가져오기
            const studentNum = this.getAttribute('data-student-num');
            const gradeSelect = this.closest('.grade-edit-controls').querySelector('.grade-select');
            const newGrade = gradeSelect.value;

            // 서버에 학년 업데이트 요청
            updateStudentGrade(studentNum, newGrade, this);
        });
    });
}

// 개별 학생 학년 업데이트 함수
function updateStudentGrade(studentNum, newGrade, buttonElement) {
    // 현재 학년 셀과 표시 요소 가져오기
    const gradeCell = buttonElement.closest('.grade-cell');
    const gradeDisplay = gradeCell.querySelector('.grade-display');

    fetch('/admin/update-student-grade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            studentNum: studentNum,
            grade: parseInt(newGrade)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 성공 시 UI 업데이트
            gradeDisplay.textContent = newGrade;

            // 수정 모드 종료
            const editControls = gradeCell.querySelector('.grade-edit-controls');
            const editButton = gradeCell.querySelector('.edit-grade-btn');

            editControls.style.display = 'none';
            gradeDisplay.style.display = 'inline';
            editButton.style.display = 'inline-block';

            // 성공 메시지 표시
            showNotification('학년이 성공적으로 변경되었습니다.', 'success');
        } else {
            // 실패 메시지 표시
            showNotification('학년 변경에 실패했습니다: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('서버 오류가 발생했습니다.', 'error');
    });
}

// 전체 학년 관리 기능 초기화
function initBulkGradeManagement() {
    // 전체 학년 올리기 버튼
    const incrementAllBtn = document.getElementById('incrementAllGradesBtn');
    if (incrementAllBtn) {
        incrementAllBtn.addEventListener('click', function() {
            showBulkGradeUpdateModal('increment');
        });
    }

    // 졸업생 학년 초기화 버튼
    const resetGraduatesBtn = document.getElementById('resetGraduatesBtn');
    if (resetGraduatesBtn) {
        resetGraduatesBtn.addEventListener('click', function() {
            showBulkGradeUpdateModal('reset');
        });
    }

    // 전체 학년 수정 확인 버튼
    const confirmBulkUpdateBtn = document.getElementById('confirmBulkGradeUpdate');
    if (confirmBulkUpdateBtn) {
        confirmBulkUpdateBtn.addEventListener('click', function() {
            executeBulkGradeUpdate();
        });
    }
}

// 전체 학년 수정 모달 표시
function showBulkGradeUpdateModal(action) {
    const modal = document.getElementById('bulkGradeUpdateModal');
    const message = document.getElementById('bulkGradeUpdateMessage');

    // 현재 선택된 작업 저장
    window.currentBulkAction = action;

    if (action === 'increment') {
        message.innerHTML = '모든 학생의 학년을 1씩 올리시겠습니까?<br><br>' +
            '<small style="color: #dc3545;">※ 4학년 학생들도 5학년으로 올라갑니다. 필요한 경우 졸업생 초기화를 별도로 실행하세요.</small>';
    } else if (action === 'reset') {
        message.innerHTML = '현재 4학년인 모든 학생들의 학년을 1학년으로 초기화하시겠습니까?<br><br>' +
            '<small style="color: #dc3545;">※ 이 작업은 졸업생을 관리하기 위한 것입니다.</small>';
    }

    modal.style.display = 'block';
}

// 전체 학년 수정 실행
function executeBulkGradeUpdate() {
    const action = window.currentBulkAction;

    if (!action) {
        closeModal();
        return;
    }

    fetch('/admin/bulk-update-grades', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('학년이 성공적으로 업데이트되었습니다.', 'success');
            // 페이지 새로고침하여 변경사항 반영
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showNotification('학년 업데이트에 실패했습니다: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('서버 오류가 발생했습니다.', 'error');
    })
    .finally(() => {
        closeModal();
    });
}

// 알림 표시 함수
function showNotification(message, type) {
    // 기존 알림이 있으면 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // 알림을 body에 추가
    document.body.appendChild(notification);

    // 알림 표시 애니메이션
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // 일정 시간 후 알림 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
