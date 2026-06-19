# 교구/구역 출결 및 활동 관리 시스템

본 프로젝트는 교회 또는 단체의 **교구 및 구역별 성도 출결 및 활동 현황**을 체계적으로 관리하기 위해 개발된 웹 애플리케이션입니다. React와 Firebase Firestore를 기반으로 구현되어 있으며, 반응형 웹 디자인을 적용하여 데스크톱과 모바일 환경 모두에서 편리하게 사용할 수 있습니다.

---

## 🌟 핵심 기능

1. **역할 기반 권한 제어 (Role-based Authorization)**
   * **총괄 관리자 (Admin)**: 시스템 전체 제어, 팀/구역/성도 CRUD, 사용자 계정 생성 및 매핑, 월 마감 처리, 감사 로그 조회.
   * **팀장 (Team Leader)**: 본인 소속 팀의 구역/성도 현황 조회, 출결 입력 및 대시보드 통계 조회.
   * **구역장 (Zone Leader)**: 본인 담당 구역 성도의 출결 및 활동 입력/수정 (타 구역 데이터 접근 불가능).

2. **스프레드시트 방식의 출결 입력 그리드**
   * 주일예배, 삼일예배, 구역예배 등 주차별 항목들의 빠른 일괄 입력.
   * **월간 누적 항목 동기화**: `전도`, `십일조`, `청체비` 등 월간 단위 항목은 임의의 주차에서 한 번 체크하면 당월 모든 주차에 자동으로 실시간 동기화됩니다.

3. **시각화 대시보드**
   * 구역별/교구별 출석률을 테마 그라데이션 차트로 시각화.
   * 출석률 계산 공식: `(주일예배 + 삼일예배 + 구역예배) / (총원 * 3) * 100`

4. **월 마감 및 권한 잠금**
   * 월 마감 완료 시, 해당 월의 데이터는 일반 팀장/구역장에게 **읽기 전용(Read-only)**으로 전환되며 다음 달 데이터베이스가 자동으로 개설됩니다.

5. **수정 이력 감사 로그**
   * 출결 및 활동 내용의 변경 내역(수정한 사람, 일시, 이전 값 ➡️ 변경 값)을 데이터베이스에 실시간으로 기록하여 투명하게 유지합니다.

---

## 🛠 기술 스택

* **Frontend**: React (Vite), Lucide-React
* **Styling**: Vanilla CSS (자체 HSL 컬러 토큰 기반 Dark/Light 테마 및 Glassmorphism 적용)
* **Backend**: Firebase Cloud Firestore
* **Local Mode**: Firebase 미연동 시 브라우저 `localStorage`를 사용하여 즉각 가동 가능 (자동 감지)

---

## 🚀 시작하기

### 1. 패키지 설치 및 로컬 서버 실행
```bash
# 의존성 패키지 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```
실행이 완료되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

### 2. 로그인 계정 안내 (테스트용)
로그인 화면 하단의 **데모 간편 로그인** 버튼을 통해 쉽게 테스트하실 수 있습니다.
* **총괄 관리자**: `admin` / `admin123`
* **해봄 팀장**: `team_haebom` / `haebom123`
* **해봄 8구역 리더**: `leader8` / `leader123`
* **해봄 9구역 리더**: `leader9` / `leader123`

---

## 🔥 Firebase 연동 및 데이터 초기화 (Seed)

본 서비스는 개인 정보 보호를 위해 **일반 사용자 공개 회원가입을 지원하지 않으며**, 총괄 관리자가 직접 계정을 생성 및 부여하는 구조로 설계되어 있습니다.

### 1. 환경 변수 설정
프로젝트 루트 폴더에 `.env.local` 파일을 생성하고 본인의 Firebase 설정 정보를 추가합니다.
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. 초기 데모 데이터 업로드 (Seed)
1. `.env.local` 연결 후 앱을 실행하여 총괄 관리자 계정(`admin`)으로 로그인합니다.
2. **월 마감 설정** 탭으로 이동합니다.
3. 하단에 표시되는 **시스템 초기화 (Firebase Seed)** 패널에서 **Firebase 초기 데이터 업로드 (Seed)** 버튼을 클릭합니다.
4. Firestore 데이터베이스에 교구, 구역, 성도(33명), 테스팅용 로그인 계정 등의 기초 데이터가 자동으로 구축 및 업로드됩니다.
