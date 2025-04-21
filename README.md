# 🌙 월간 루프 기반 자기계발 앱 – MonthlyGrow

> 프린세스 메이커 같은 루프형 구조로, ‘나’를 키우듯 목표를 실행하는 자기계발 게임 앱

---

## 🎯 개요

**MonthlyGrow**는 사용자가 한 달 단위 루프를 설정하고,  
PARA 시스템을 활용해 목표를 실행하며 성장해 나가는 **게임형 자기관리 도구**입니다.

기획, 실행, 회고를 반복하며 스스로의 프로젝트를 관리하고,  
목표를 달성했을 때의 보상을 스스로 설계하는 방식으로 동기를 강화합니다.

---

## 🧩 주요 기능

- **월간 루프 생성 및 회고**
  - 월초 목표 설정, 월말 자동 리포트
- **PARA 기반 목표 구조화**
  - Projects / Areas / Resources / Archives
- **루프 내 Task 실행 관리**
  - 실행 시간 기록, 진행률 시각화
- **보상 시스템**
  - 루프 성공 시 사용자 정의 보상 제공
- **다국어 지원**
  - 한국어 / 영어 전환 가능
- **구글 로그인 지원**
  - OAuth로 간편 로그인

---

## 💻 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | [Next.js 15 (App Router)](https://nextjs.org/blog/next-15) |
| UI | [React 19](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| Auth | Firebase Auth (Google OAuth) |
| DB | Firebase Firestore |
| I18n | react-i18next |
| AI 연동 예정 | GPT API + Model Context Protocol (MCP) |

---

## 🚀 시작하기

```bash
# 1. 클론
git clone https://github.com/your-username/monthlygrow.git
cd monthlygrow

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
http://localhost:3000
```

🔐 `.env` 파일에 Firebase 및 Google OAuth 관련 설정을 넣어야 합니다.

---

## 📦 프로젝트 구조

```
/app
  /home          # 홈 및 요약 뷰
  /loop          # 루프 생성 / 회고 / 상세
  /project       # 프로젝트 및 태스크 관리
  /para          # 전체 PARA 구조 정리
  /settings      # 언어 전환, 보상 설정
  /login         # 로그인 화면 (구글 OAuth 전용)
```

---

## 🛠️ 향후 기능 예정 (v1+)

- 🔮 AI 기반 루프 목표 자동 추천 (MCP 활용)
- 📈 사용자별 성장 히스토리 뷰
- 🧠 루프 회고 자동 요약 / GPT 피드백
- 🧍 캐릭터 커스터마이징 (선택 기능)

---

## 🙌 기여 방법

1. 이슈를 확인하거나 새로 생성해주세요.
2. `dev` 브랜치에서 기능 개발 후 PR 주세요.
3. `commit` 메시지는 다음 포맷을 사용합니다:
   ```
   feat: 프로젝트 생성 기능 추가
   fix: 루프 시작일 계산 오류 수정
   ```

---

## 📜 라이선스

MIT License © 2025-present [Your Name or Team Name]

---

## ✨ 스크린샷 (예정)

<img src="docs/screenshot1.png" width="300" />
<img src="docs/screenshot2.png" width="300" />

---

> "계획은 단지 시작일 뿐, 실행이 진짜 변화다."