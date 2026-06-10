# FindRegister 🔍 - 스마트 저항 식별기 & 생성기

FindRegister는 웹 브라우저 상에서 카메라 및 이미지 파일을 통해 실시간으로 저항을 검출하고, 저항 색띠 값을 자동으로 해독해 주는 프리미엄 클라이언트 사이드 웹 애플리케이션입니다. 또한 사용자가 원하는 저항값을 입력하면 실물 규격에 맞게 4색띠/5색띠 저항을 정밀 렌더링해 주는 저항 생성기 기능을 함께 포함하고 있습니다.

서버 백엔드가 전혀 필요 없는 **100% Client-Side Web Application**으로, GitHub Pages에 무설정으로 즉시 배포하여 모바일과 PC 기기 모두에서 사용할 수 있습니다.

---

## 🚀 주요 특징 (Key Features)

1.  **실시간 모바일 & PC 카메라 스캔**:
    *   **PC 웹캠** 및 **모바일 후면 카메라(Environment Camera)**를 자동 탐지하여 최적의 초점을 잡습니다.
    *   기기에 다중 카메라가 탑재되어 있을 경우 **카메라 전환(Cycle)** 기능을 제공합니다.
    *   지원 기기에서 저항 색 판독률을 높이기 위한 **카메라 플래시(Torch)** 제어 기능을 제공합니다.
2.  **다중 저항 탐지 및 트래킹**:
    *   이미지 내에 여러 개의 저항(1개부터 수십 개까지)이 제각각 다른 각도로 흩어져 있어도 동시에 탐지하여 네온 테두리 상자(Bounding Box)를 그려줍니다.
    *   초당 5~7회(FPS) 스캔하여 저항의 위치를 매끄럽게 트래킹하며 지터(Jitter)를 방지하는 지능형 매칭 알고리즘을 탑재했습니다.
3.  **사진 업로드 감지**:
    *   촬영해 둔 사진을 드래그 앤 드롭 또는 파일 업로드하여 화면 내 모든 저항을 정적으로 식별할 수 있습니다.
4.  **인터랙티브 보정 (Interactive Fine-tuning)**:
    *   검출된 저항 상자를 클릭하면 상세 정보 카드가 열립니다.
    *   **읽는 방향 반전**: 저항이 뒤집혔을 경우 클릭 한 번으로 앞뒤 판독 방향을 바꿉니다.
    *   **색띠 수동 보정**: 조명 반사로 오인식된 특정 색띠를 직접 드롭다운으로 골라 수정할 수 있습니다.
    *   **감도 캘리브레이터**: 밝기(Brightness), 대비(Contrast), 포화도(Saturation) 슬라이더를 통해 현장 조명 조건에 맞춰 실시간 픽셀 값을 캘리브레이션할 수 있습니다.
5.  **저항 색띠 생성기 (Resistor Generator)**:
    *   `100`, `2.2k`, `4M7`, `0r22` 등의 저항값을 파싱하여 4색띠 및 5색띠 SVG 벡터 그래픽으로 실감 나게 그립니다.
    *   **비표준값 경고 및 제안**: 사용자가 비표준 저항값을 입력하면 E24/E96 표준 규격 계열 중 가장 가까운 표준값을 계산하여 추천 클릭 칩으로 제공합니다.
6.  **인터랙티브 색코드 조견표**:
    *   12가지 저항 색상의 숫자, 승수, 오차 테이블을 동적으로 표기하여 수동 계산을 돕습니다.

---

## 🛠️ 기술 스택 (Technology Stack)

*   **Core**: HTML5, Vanilla JavaScript (ES6+ Modules)
*   **Styling**: Vanilla CSS (CSS Variables, Glassmorphism, Neon Glow Theme, Flex/Grid Responsive Layout)
*   **Computer Vision**: OpenCV.js (WebAssembly 빌드, CDN 비동기 컴파일)
*   **Vector Graphic**: Dynamic SVG Generation (저항 입체 셰이딩 및 그림자 필터 내장)
*   **Deployment**: GitHub Pages (`gh-pages` Branch)

---

## 📁 폴더 구조 (Folder Structure)

```text
FindRegister/
├── Doc/
│   ├── algorithm_design.md   # 이미지 처리 및 HSV 색띠 검출 알고리즘 상세 명세
│   ├── user_guide.md         # 카메라 조작, 튜닝 및 저항 색상 코드 매뉴얼
│   └── implementation_plan.md# 초기 프로젝트 구현 설계서
├── scratch/
│   └── test_calc.js          # 저항값 파싱/디코딩 로직 단위 테스트 파일
├── app.js                    # 메인 어플리케이션 스크립트 (UI 바인딩 & OpenCV 루프)
├── calculator.js             # 저항 수학 공식, 파서, 규격 대조 모듈
├── index.html                # 메인 마크업 (OpenCV.js 로딩 트리거 포함)
├── style.css                 # 다크모드 글래스모피즘 CSS 스타일시트
├── package.json              # 모듈 실행 및 유닛테스트 구동용 설정 파일
├── deploy.sh                 # GitHub Pages 배포 자동화 스크립트
└── README.md                 # 본 프로젝트 종합 안내 문서
```

---

## 💻 로컬 개발 및 테스트 방법 (How to Run Locally)

본 앱은 빌드 도구(Webpack, Vite 등)가 불필요한 순수 웹 프로젝트이므로 로컬 웹 서버만 있으면 즉시 실행 가능합니다. (카메라 API인 `getUserMedia`는 보안 정책상 `localhost`나 `https` 환경에서만 동작합니다).

### Node.js 환경에서 구동
1.  프로젝트 루트 폴더로 이동합니다.
2.  간단히 `npx`를 사용해 웹 서버를 실행합니다:
    ```bash
    npx http-server ./
    ```
    또는 python을 이용합니다:
    ```bash
    python -m http.server 8080
    ```
3.  브라우저에서 `http://localhost:8080` (혹은 안내되는 주소)으로 접속합니다.

### 단위 테스트 구동
저항값 문자열 파싱 및 계산 코드가 정상 작동하는지 확인하려면 아래 명령을 실행합니다 (Node.js 설치 필요):
```bash
npm test
```

---

## 🌐 GitHub Pages 배포 방법 (Deployment)

본 프로젝트는 `git@github.com:tramper2/FindRegister.git`에 구성되어 있으며, `gh-pages` 브랜치를 사용해 즉시 배포할 수 있습니다.

### 배포 자동화 스크립트 실행
루트 폴더에 내장된 `deploy.sh` 스크립트를 실행하면 깃 초기화부터 커밋, `gh-pages` 브랜치 강제 푸시까지 일괄 완료됩니다.

```bash
# 스크립트 실행 권한 부여 (필요 시)
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

스크립트가 실행되면 프로젝트 파일이 원격 리포지토리의 `gh-pages` 브랜치에 업로드되며, 몇 분 내에 GitHub Pages 웹사이트로 활성화됩니다.
배포 후 웹주소 형식: `https://tramper2.github.io/FindRegister/`
