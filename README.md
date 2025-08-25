# NFCTAG-Item_Management_System 프로젝트 구조 및 용도 설명

이 문서는 NFCTAG-Item_Management_System 프로젝트의 파일 구조와 각 파일/디렉토리의 용도를 설명합니다.

## 프로젝트 개요
이 프로젝트는 NFC 태그를 활용한 물품 관리 시스템으로, 대여 및 반납 기능, 사용자 관리, 로그 관리 등의 기능을 제공합니다.

## 루트 디렉토리 파일
- `app.js`: Express 애플리케이션의 메인 설정 파일, 라우팅 및 미들웨어 설정

## public 디렉토리
프론트엔드 자원들이 저장되는 디렉토리입니다.

### images 디렉토리
- `어딜오는거야.jpg`: 시스템 내 사용되는 안내 이미지
- `이미지추가안내.png`: 이미지 업로드 관련 안내 이미지
- `item_IMG/`: 물품 이미지가 저장되는 디렉토리
  - `더미.gitkeep`: 빈 디렉토리 유지를 위한 파일
- `mainPageIMG/`: 메인 페이지에 사용되는 이미지
  - `ITS-IMS.png`: 메인 페이지 로고/배너 이미지

### javascripts 디렉토리
프론트엔드 JavaScript 파일들이 저장됩니다.

- `adminHub.js`: 관리자 허브 페이지 기능
- `forAdminPage.js`: 관리자 물품관리 페이지 기능
- `forDetCookiePage.js`: 쿠키 감지 페이지 기능
- `forLoginPage.js`: 로그인 페이지 기능
- `forManagementUserList.js`: 사용자 관리 페이지 기능
- `forUserMainPage.js`: 사용자 메인 페이지 기능
- `Throne/`: 관리자 권한 이양 관련 기능
  - `forLastToTheThrone.js`: 권한 이양 최종 페이지 기능
  - `forThronePage.js`: 권한 이양 첫 페이지 기능
  - `forThronePage2.js`: 권한 이양 두번째 페이지 기능

### stylesheets 디렉토리
CSS 스타일시트 파일들이 저장됩니다.

- `adminHub.css`: 관리자 허브 페이지 스타일
- `forAdmin.css`: 관리자 물품관리 페이지 스타일
- `forLog.css`: 로그 페이지 스타일
- `forMain.css`: 메인 페이지 스타일
- `forManagementUserList.css`: 사용자 관리 페이지 스타일
- `login.css`: 로그인 페이지 스타일
- `testMainPage.css`: 테스트용 메인 페이지 스타일
- `Throne/`: 관리자 권한 이양 관련 스타일
  - `forLastToTheThrone.css`: 권한 이양 최종 페이지 스타일
  - `forsuccessionToTheThrone2.css`: 권한 이양 두번째 페이지 스타일
  - `successionToTheThrone.css`: 권한 이양 첫 페이지 스타일

## routes 디렉토리
서버 라우터 및 백엔드 로직 파일들이 저장됩니다.

- `generateCookie.js`: 쿠키 생성 관련 라우터
- `imgProcess.js`: 이미지 처리 관련 라우터
- `log.js`: 로그 관리 라우터
- `main.js`: 메인 기능 라우터 (물품 대여, 반납, 관리자 기능 등)
- `Throne.js`: 관리자 권한 이양 관련 라우터
- `users.js`: 사용자 관리 라우터 (로그인, 회원가입 등)
- `verify.js`: 인증 관련 라우터
- `sys_management/`: 시스템 관리 관련 기능
  - `checkOverdue.js`: 연체 확인 기능
  - `detectCookie.js`: 쿠키 감지 기능
  - `generateURL.js`: URL 생성 기능
  - `IMS_db.js`: 데이터베이스 연결 및 관리 모듈
  - `seed-generator.js`: 시드 생성 모듈
  - `randURL/`: 랜덤 URL 관련 데이터
    - `nfc_url.json`: NFC 태그용 URL 데이터 (Git에서 무시됨)

## views 디렉토리
EJS 템플릿 파일들이 저장됩니다.

- `ckCookie.ejs`: 쿠키 확인 페이지
- `error.ejs`: 오류 페이지
- `genCookie.ejs`: 쿠키 생성 페이지(추후 삭제 예정)
- `login.ejs`: 로그인 페이지
- `main.ejs`: 메인 페이지 (물품 대여 및 반납)
- `wrongAccess.ejs`: 잘못된 접근 페이지
- `adminFolder/`: 관리자 관련 페이지
  - `admin.ejs`: 관리자 페이지
  - `adminHub.ejs`: 관리자 허브 페이지
  - `log.ejs`: 로그 조회 페이지
  - `managementUserList.ejs`: 사용자 관리 페이지
- `Throne/`: 관리자 권한 이양 관련 페이지
  - `lastToTheThrone.ejs`: 권한 이양 최종 페이지
  - `successionToTheThrone.ejs`: 권한 이양 첫 페이지
  - `successionToTheThrone2.ejs`: 권한 이양 두번째 페이지

## 주요 기능 설명

1. **물품 관리 시스템**
   - 물품 대여 및 반납 기능
   - 물품 상태 확인
   - 대여 예약 기능

2. **사용자 관리**
   - 로그인 및 인증
   - 사용자 권한 관리
   - 회장/부회장 권한 관리

3. **관리자 기능**
   - 물품 관리
   - 사용자 관리
   - 로그 관리
   - 권한 이양 (Throne 시스템)

4. **연체 관리**
   - 연체 확인 및 처리
   - 대여 권한 제한 및 복구

5. **NFC 태그 기능**
   - NFC 태그를 통한 대여 및 반납
   - 랜덤 URL 생성 및 관리
   - 위 기능은 파이썬으로 구동되며 추후 설명 추가 예정
