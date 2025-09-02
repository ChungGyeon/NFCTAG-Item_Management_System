#!/bin/bash

# 스크립트 파일 위치 기준으로 경로 설정
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

# 절대 경로 설정
VENV_PATH="$PROJECT_ROOT/nfc_write_sys/venv"  # 파이썬 가상환경 디렉토리 경로
PY_SCRIPT="$SCRIPT_DIR/nfc_write_sys/write_nfctag_i2c2.py"  # 실행할 파이썬 파일 절대 경로
NODE_SCRIPT="$PROJECT_ROOT/app.js"            # 실행할 Node.js 서버 파일 절대 경로

echo "================================================"
echo "ITS-IMS NFC 태그 시스템 시작"
echo "================================================"
echo "- 프로젝트 경로: $PROJECT_ROOT"
echo "- 가상환경 경로: $VENV_PATH"
echo "- 파이썬 스크립트: $PY_SCRIPT"
echo "- Node.js 서버: $NODE_SCRIPT"
echo "================================================"

# 1. Node.js 서버 실행 (백그라운드로)
echo "[$(date)] Node.js 서버 시작 중..."
cd "$PROJECT_ROOT" && node "$NODE_SCRIPT" > "$SCRIPT_DIR/node.log" 2>&1 &
NODE_PID=$!
echo "[$(date)] Node.js 서버 시작됨 (PID: $NODE_PID)"

# 2. Python 가상환경 활성화
if [ -d "$VENV_PATH" ]; then
    echo "[$(date)] 파이썬 가상환경 활성화 중..."
    . "$VENV_PATH/bin/activate"

    # 가상환경이 제대로 활성화되었는지 확인
    if [ $? -ne 0 ]; then
        echo "[$(date)] 오류: 가상환경 활성화 실패"
        exit 1
    fi

    echo "[$(date)] 가상환경 활성화됨"
    echo "[$(date)] 파이썬 버전: $(python3 --version)"
    echo "[$(date)] 가상환경 위치: $(which python3)"
else
    echo "[$(date)] 오류: 가상환경을 찾을 수 없습니다: $VENV_PATH"
    echo "[$(date)] 가상환경 생성을 시도합니다..."

    # 가상환경 생성 시도
    python3 -m venv "$VENV_PATH"
    if [ $? -ne 0 ]; then
        echo "[$(date)] 오류: 가상환경 생성 실패"
        exit 1
    fi

    . "$VENV_PATH/bin/activate"
    echo "[$(date)] 가상환경 생성 및 활성화 성공"

    # 필요한 패키지 설치
    echo "[$(date)] 필수 패키지 설치 중..."
    pip install adafruit-circuitpython-pn532 ndef adafruit-blinka
    if [ $? -ne 0 ]; then
        echo "[$(date)] 오류: 패키지 설치 실패"
        exit 1
    fi
    echo "[$(date)] 패키지 설치 완료"
fi

# 3. Python 코드 실행 (백그라운드로)
echo "[$(date)] 파이썬 스크립트 시작 중..."
cd "$PROJECT_ROOT" && python3 "$PY_SCRIPT" > "$SCRIPT_DIR/python.log" 2>&1 &
PY_PID=$!
echo "[$(date)] 파이썬 스크립트 시작됨 (PID: $PY_PID)"

# 4. 실시간 로그 출력 (두 로그를 병렬로 출력)
echo "[$(date)] 로그 모니터링 시작 (종료하려면 Ctrl+C)"
echo "================================================"
tail -f "$SCRIPT_DIR/node.log" "$SCRIPT_DIR/python.log"

# 5. 스크립트 종료 시 프로세스 정리 (Ctrl+C 누를 때)
trap 'echo "[$(date)] 프로그램 종료 요청"; kill $NODE_PID 2>/dev/null; kill $PY_PID 2>/dev/null; echo "[$(date)] 모든 프로세스 종료됨"; exit 0' INT TERM

# 백그라운드 프로세스가 계속 실행되도록 무한 대기
wait
