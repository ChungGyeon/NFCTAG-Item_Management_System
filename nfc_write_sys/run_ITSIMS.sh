#!/bin/bash

# 현재 스크립트 경로 기준 (필요시 수정)
VENV_PATH="./venv"                # 파이썬 가상환경 디렉토리 경로
PY_SCRIPT="write_nfctag_i2c2.py"            # 실행할 파이썬 파일 이름
NODE_SCRIPT="app.js"          # 실행할 Node.js 서버 파일 이름

# 1. Node.js 서버 실행 (백그라운드로)
echo "Starting Node.js server..."
node "$NODE_SCRIPT" > node.log 2>&1 &
NODE_PID=$!

# 2. Python 가상환경 활성화
if [ -d "$VENV_PATH" ]; then
    echo "Activating Python virtual environment..."
    source "$VENV_PATH/bin/activate"
else
    echo "Virtual environment not found at $VENV_PATH"
    exit 1
fi

# 3. Python 코드 실행 (백그라운드로)
echo "Starting Python script inside virtual environment..."
python3 "$PY_SCRIPT" > python.log 2>&1 &
PY_PID=$!


# 4. 실시간 로그 출력 (두 로그를 병렬로 출력)
echo "[INFO] Tailing both logs (press Ctrl+C to stop)..."
tail -f node.log &
tail -f python.log &

# 5. 두 프로세스 모두 기다리기
wait $NODE_PID
wait $PY_PID
