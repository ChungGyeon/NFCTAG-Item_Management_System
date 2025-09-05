import board
import busio
import json
import os
import time
import ndef
from datetime import datetime
from adafruit_pn532.i2c import PN532_I2C

# 프로젝트 루트 디렉토리 경로 얻기
current_file = os.path.abspath(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(current_file, "../.."))



def test_nfc_components():
    """detect_and_write_tag() 함수에서 사용하는 모든 컴포넌트들의 동작을 테스트합니다."""
    test_url = "https://example.com/test"
    test_results = {
        "pn532_connection": False,
        "ndef_library": False,
        "ndef_message_creation": False,
        "file_operations": False,
        "overall_status": False
    }

    print(f"[{datetime.now()}] NFC 컴포넌트 테스트를 시작합니다...")

    # 1. PN532 연결 테스트
    try:
        print(f"[{datetime.now()}] 1. PN532 연결 테스트...")
        i2c = busio.I2C(board.SCL, board.SDA)
        pn532 = PN532_I2C(i2c, debug=False)
        ic, ver, rev, support = pn532.firmware_version
        print(f"[{datetime.now()}] ✓ PN532 연결 성공. 펌웨어: {ver}.{rev}")
        test_results["pn532_connection"] = True
        i2c.deinit()
    except Exception as e:
        print(f"[{datetime.now()}] ✗ PN532 연결 실패: {e}")
        test_results["pn532_connection"] = False

    # 2. NDEF 라이브러리 테스트
    try:
        print(f"[{datetime.now()}] 2. NDEF 라이브러리 테스트...")
        # ndef 모듈이 제대로 import 되었는지 확인
        if hasattr(ndef, 'UriRecord') and hasattr(ndef, 'message'):
            print(f"[{datetime.now()}] ✓ NDEF 라이브러리 정상")
            test_results["ndef_library"] = True
        else:
            print(f"[{datetime.now()}] ✗ NDEF 라이브러리 문제")
            test_results["ndef_library"] = False
    except Exception as e:
        print(f"[{datetime.now()}] ✗ NDEF 라이브러리 테스트 실패: {e}")
        test_results["ndef_library"] = False

    # 3. NDEF 메시지 생성 테스트
    try:
        print(f"[{datetime.now()}] 3. NDEF 메시지 생성 테스트...")
        ndef_record = ndef.UriRecord(test_url)
        message_bytes = b''.join(ndef.message_encoder([ndef_record]))
        print(f"[{datetime.now()}] ✓ NDEF 메시지 생성 성공 (크기: {len(message_bytes)} bytes)")
        test_results["ndef_message_creation"] = True
    except Exception as e:
        print(f"[{datetime.now()}] ✗ NDEF 메시지 생성 실패: {e}")
        test_results["ndef_message_creation"] = False

    # 4. 파일 작업 테스트
    try:
        print(f"[{datetime.now()}] 4. 파일 작업 테스트...")
        # 절대 경로 사용
        test_file_path = os.path.join(PROJECT_ROOT, "routes", "sys_management", "randURL", "nfc_url.json")
        test_data = {"url": test_url}

        # 파일 쓰기 테스트
        with open(test_file_path, 'w') as f:
            json.dump(test_data, f)

        # 파일 읽기 테스트
        with open(test_file_path, 'r') as f:
            loaded_data = json.load(f)

        if loaded_data.get('url') == test_url:
            print(f"[{datetime.now()}] ✓ 파일 읽기/쓰기 테스트 성공")
            test_results["file_operations"] = True
        else:
            print(f"[{datetime.now()}] ✗ 파일 데이터 불일치")
            test_results["file_operations"] = False

        # 테스트 파일 정리 (실제 파일을 삭제하지 않도록 주석 처리)
        # if os.path.exists(test_file_path):
        #     os.remove(test_file_path)

    except Exception as e:
        print(f"[{datetime.now()}] ✗ 파일 작업 테스트 실패: {e}")
        test_results["file_operations"] = False
        print(f"[{datetime.now()}] 📁 시도한 파일 경로: {test_file_path}")
        print(f"[{datetime.now()}] 📁 프로젝트 루트: {PROJECT_ROOT}")

    # 5. 전체 상태 평가
    critical_tests = ["pn532_connection", "ndef_library", "ndef_message_creation"]
    passed_critical = sum(test_results[test] for test in critical_tests)

    if passed_critical == len(critical_tests):
        test_results["overall_status"] = True
        print(f"[{datetime.now()}] 🎉 모든 중요 테스트 통과! NFC 쓰기 준비 완료")
    else:
        test_results["overall_status"] = False
        print(f"[{datetime.now()}] ⚠️ 일부 테스트 실패. NFC 쓰기에 문제가 있을 수 있습니다.")

    # 6. 상세 결과 출력
    print(f"\n[{datetime.now()}] === 테스트 결과 요약 ===")
    for test_name, result in test_results.items():
        status = "✓ 통과" if result else "✗ 실패"
        print(f"  {test_name}: {status}")

    return test_results


def check_nfc_url_file(file_path=os.path.join(PROJECT_ROOT, "routes", "sys_management", "randURL", "nfc_url.json")):
    """NFC URL 파일의 존재 여부와 유효성을 확인합니다."""
    try:
        # 파일 존재 여부 확인
        if not os.path.exists(file_path):
            return {
                "exists": False,
                "valid": False,
                "message": f"파일이 존재하지 않습니다: {file_path}",
                "url": None
            }

        # 파일 읽기 권한 확인
        if not os.access(file_path, os.R_OK):
            return {
                "exists": True,
                "valid": False,
                "message": f"파일을 읽을 권한이 없습니다: {file_path}",
                "url": None
            }

        # 파일 크기 확인 (빈 파일 체크)
        if os.path.getsize(file_path) == 0:
            return {
                "exists": True,
                "valid": False,
                "message": f"파일이 비어있습니다: {file_path}",
                "url": None
            }

        # JSON 파싱 및 URL 유효성 확인
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            url = data.get('url')
            if not url:
                return {
                    "exists": True,
                    "valid": False,
                    "message": f"파일에 'url' 키가 없거나 값이 비어있습니다: {file_path}",
                    "url": None
                }

            # URL 형식 간단 검증
            if not isinstance(url, str) or len(url.strip()) == 0:
                return {
                    "exists": True,
                    "valid": False,
                    "message": f"URL이 유효하지 않습니다: {url}",
                    "url": None
                }

            return {
                "exists": True,
                "valid": True,
                "message": f"파일이 유효합니다: {file_path}",
                "url": url.strip()
            }

        except json.JSONDecodeError as e:
            return {
                "exists": True,
                "valid": False,
                "message": f"JSON 형식이 잘못되었습니다: {str(e)}",
                "url": None
            }
        except Exception as e:
            return {
                "exists": True,
                "valid": False,
                "message": f"파일 읽기 오류: {str(e)}",
                "url": None
            }

    except Exception as e:
        return {
            "exists": False,
            "valid": False,
            "message": f"파일 확인 중 오류 발생: {str(e)}",
            "url": None
        }


def write_ndef_message(pn532, message_bytes, uid, start_block=4):
    """NDEF 메시지를 NFC 태그에 씁니다. (NTAG2xx 지원)"""
    try:
        # 아이폰 호환성을 위해 NDEF 메시지를 TLV(Type-Length-Value) 형식으로 래핑합니다.
        # NDEF Message TLV (T=0x03) + Length (L) + Value (V) + Terminator TLV (T=0xFE)
        ndef_length = len(message_bytes)
        if ndef_length > 254:
            raise ValueError(f"오류: NDEF 메시지가 너무 깁니다 ({ndef_length} bytes). 254 바이트를 초과할 수 없습니다.")

        # 전체 페이로드 생성: [NDEF TLV Tag] + [Length] + [NDEF Message] + [Terminator TLV Tag]
        payload = bytes([0x03, ndef_length]) + message_bytes + bytes([0xFE])
        print(f"[{datetime.now()}] NDEF 메시지(TLV 포함) 생성 (총 크기: {len(payload)} bytes)")

        # 데이터를 4바이트 블록으로 나누어 쓰기 (NTAG2xx/Mifare Ultralight)
        print(f"[{datetime.now()}] 블록 단위 쓰기 시작 (시작 블록: {start_block})...")

        total_blocks = (len(payload) + 3) // 4
        print(f"[{datetime.now()}] 총 {total_blocks}개 블록에 쓰기 예정")

        for i in range(total_blocks):
            block_num = start_block + i
            start_idx = i * 4
            chunk = payload[start_idx:start_idx + 4]

            # 마지막 블록이 4바이트보다 작으면 0x00으로 패딩
            if len(chunk) < 4:
                chunk += bytes([0x00] * (4 - len(chunk)))

            print(f"[{datetime.now()}] 블록 {block_num} 쓰기 중... (데이터: {chunk.hex()})")

            # NTAG2xx 블록 쓰기 명령
            if not pn532.ntag2xx_write_block(block_num, chunk):
                raise RuntimeError(f"블록 {block_num} 쓰기 실패")

            print(f"[{datetime.now()}] ✓ 블록 {block_num} 쓰기 성공")
            time.sleep(0.01) # 안정적인 쓰기를 위해 블록 간 짧은 딜레이 추가

        print(f"[{datetime.now()}] ✓ 모든 블록 쓰기 완료")
        return True

    except Exception as e:
        print(f"[{datetime.now()}] NDEF 쓰기 중 오류: {e}")
        # RuntimeError를 발생시켜 상위 루프에서 연결 재설정을 시도하도록 함
        raise RuntimeError(f"NDEF 메시지 쓰기 실패: {str(e)}")


def detect_and_write_tag(pn532, url):
    """NFC 태그를 감지하고 주어진 URL을 NDEF 형식으로 씁니다."""
    try:
        print(f"[{datetime.now()}] NFC 태그를 기다립니다 (10초)...")
        uid = pn532.read_passive_target(timeout=10)
        if uid is None:
            print(f"[{datetime.now()}] 태그를 찾지 못했습니다.")
            return {"status": "info", "message": "태그 미감지"}

        print(f"[{datetime.now()}] 태그 감지됨: {uid.hex()}")

        # ndeflib를 사용하여 표준 NDEF URI 레코드 생성
        ndef_record = ndef.UriRecord(url)
        message_bytes = b''.join(ndef.message_encoder([ndef_record]))

        # NDEF 메시지 쓰기
        write_ndef_message(pn532, message_bytes, uid)

        print(f"[{datetime.now()}] URL 쓰기 성공: {url}")
        return {"status": "success", "message": f"URL 쓰기 성공: {url}"}

    except RuntimeError as e:
        # 통신 오류는 상위로 보내서 연결 재설정을 유도
        raise RuntimeError(f"태그 통신 오류: {e}")
    except Exception as e:
        print(f"[{datetime.now()}] 태그 쓰기 중 예기치 않은 오류: {e}")
        return {"status": "error", "message": f"태그 쓰기 오류: {str(e)}"}


def periodic_writer(file_path=os.path.join(PROJECT_ROOT, "routes", "sys_management", "randURL", "nfc_url.json"), interval=30):
    """주어진 간격(초)마다 파일에서 URL을 읽어 NFC 태그에 씁니다."""
    pn532 = None
    i2c = None

    try:
        while True:
            try:
                # --- 1. PN532 연결 확인 및 시도 ---
                if pn532 is None:
                    print(f"[{datetime.now()}] 1번 시퀸스, PN532 연결을 시도합니다...")
                    try:
                        if i2c:
                            i2c.deinit()
                        i2c = busio.I2C(board.SCL, board.SDA)
                        pn532 = PN532_I2C(i2c, debug=False)
                        ic, ver, rev, support = pn532.firmware_version
                        print(f"[{datetime.now()}] 1번 시퀸스, PN532 연결 성공. 펌웨어: {ver}.{rev}")
                    except Exception as e:
                        print(f"[{datetime.now()}] 1번 시퀸스, PN532 연결 실패: {e}. 다음 주기까지 대기합니다.")
                        pn532 = None
                        if i2c:
                            i2c.deinit()
                        time.sleep(interval)
                        continue

                # --- 2. 파일에서 URL 읽기 ---
                url = None
                if not os.path.exists(file_path):
                    print(f"[{datetime.now()}] 2번 시퀸스, URL 파일({file_path})을 찾을 수 없습니다.")
                else:
                    try:
                        with open(file_path, 'r') as f:
                            data = json.load(f)
                        url = data.get('url')
                        if not url:
                            print(f"[{datetime.now()}] 2번 시퀸스, 파일에 유효한 URL이 없습니다.")
                    except json.JSONDecodeError:
                        print(f"[{datetime.now()}] 2번 시퀸스, JSON 파싱 오류. 파일 내용을 확인해주세요.")
                    except Exception as e:
                        print(f"[{datetime.now()}] 2번 시퀸스, 파일 읽기 오류: {e}")

                # --- 3. URL이 있으면 태그에 쓰기 ---
                if url:
                    print(f"[{datetime.now()}] URL '{url}'을 태그에 쓸 준비가 되었습니다.")
                    result = detect_and_write_tag(pn532, url)
                    if result["status"] == "error":
                        print(f"[{datetime.now()}] 3번 시퀸스, 태그 쓰기 실패: {result['message']}")

                # --- 4. 다음 주기까지 대기 (try 블록 안으로 이동) ---
                print(f"[{datetime.now()}] 다음 쓰기까지 {interval}초 대기합니다.")
                time.sleep(interval)

            except RuntimeError as e:
                # 태그 통신 오류 발생 시 연결 재설정
                print(f"[{datetime.now()}] PN532 통신 오류 발생: {e}. 연결을 초기화합니다.")
                pn532 = None
                if i2c:
                    i2c.deinit()
            except KeyboardInterrupt:
                print("프로그램을 종료합니다.")
                break
            except Exception as e:
                print(f"[{datetime.now()}] 메인 루프 오류: {e}. 연결을 초기화합니다.")
                pn532 = None
                if i2c:
                    i2c.deinit()

    finally:
        # 프로그램 종료 시 리소스 정리
        if i2c:
            i2c.deinit()
        print(f"[{datetime.now()}] I2C 연결이 최종적으로 해제되었습니다.")


if __name__ == "__main__":
    # NFC 컴포넌트 테스트 실행
    test_results = test_nfc_components()

    if test_results["overall_status"]:
        print(f"\n[{datetime.now()}] 테스트 통과! 정상적인 NFC 쓰기를 시작합니다.")
        # 30초마다 ./tmp/nfc_url.json 파일을 읽어 태그에 씁니다.
        periodic_writer(interval=11)
    else:
        print(f"\n[{datetime.now()}] 테스트 실패! 문제를 해결한 후 다시 실행해주세요.")
        print("실패한 항목:")
        for test_name, result in test_results.items():
            if not result and test_name != "overall_status":
                print(f"  - {test_name}")