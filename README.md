# 🌙 월간 먼슬리 기반 자기계발 앱 – MonthlyGrow

> 육성 게임에서 차용한 먼슬리형 구조로, '나'를 키우듯 목표를 실행하는 자기계발 게임 앱

---

## 🎯 개요

**MonthlyGrow**는 사용자가 한 달 단위 먼슬리를 설정하고,  
PARA 시스템을 활용해 목표를 실행하며 성장해 나가는 **게임형 자기관리 도구**입니다.

기획, 실행, 회고를 반복하며 스스로의 프로젝트를 관리하고,  
목표를 달성했을 때의 보상을 스스로 설계하는 방식으로 동기를 강화합니다.

---

## 🧩 주요 기능

- **월간 먼슬리 생성 및 회고**
  - 월초 목표 설정, 월말 자동 리포트
- **PARA 기반 목표 구조화**
  - Projects / Areas / Resources / Archives
- **먼슬리 내 Task 실행 관리**
  - 실행 시간 기록, 진행률 시각화
- **프로젝트-먼슬리 목표치 분리 시스템** 🆕
  - 프로젝트 전체 목표와 먼슬리별 개별 목표 분리
  - 3개월 프로젝트도 이번 달에는 8개만 완료하면 달성으로 인정
  - 먼슬리별 진행률과 프로젝트 전체 진행률 동시 관리
- **통합 아카이브 시스템** 🆕
  - 모든 회고와 노트를 `unified_archives` 컬렉션에서 통합 관리
  - 별점과 북마크 기능으로 중요도 표시
  - 먼슬리/프로젝트별 필터링 및 정렬 지원
- **통합된 폼 컴포넌트** 🆕
  - 회고 작성 폼을 먼슬리/프로젝트 공통으로 사용
  - 노트 작성 폼을 먼슬리/프로젝트 공통으로 사용
  - 일관된 UI/UX 제공
- **실패 패턴 분석 시스템** 🆕
  - Key Results 실패 이유 데이터 수집 및 저장
  - 홈 대시보드 실패 패턴 분석 위젯
  - 월별/연도별 실패율 트렌드 분석
  - 개선 제안 자동 생성
- **보상 시스템**
  - 먼슬리 성공 시 사용자 정의 보상 제공
- **다국어 지원**
  - 한국어 / 영어 전환 가능
- **구글 로그인 지원**
  - OAuth로 간편 로그인

---

## 💻 기술 스택

| 영역                 | 기술                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | [Next.js 15 (App Router)](https://nextjs.org/blog/next-15), [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org/)                                                                    |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (Radix UI 기반)                                                                                                                   |
| **State Management** | [Jotai](https://jotai.org/) (클라이언트 상태), [TanStack React Query](https://tanstack.com/query) (서버 상태), [React Hook Form](https://react-hook-form.com/) (폼 상태)                                      |
| **Firebase**         | [Firestore](https://firebase.google.com/docs/firestore) (데이터베이스), [Auth](https://firebase.google.com/docs/auth) (Google OAuth), [Functions](https://firebase.google.com/docs/functions) (서버리스 함수) |
| **I18n**             | react-i18next                                                                                                                                                                                                 |
| **AI 연동 예정**     | GPT API + Model Context Protocol (MCP)                                                                                                                                                                        |

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
  /monthly          # 먼슬리 생성 / 회고 / 상세
  /project       # 프로젝트 및 태스크 관리
  /para          # 전체 PARA 구조 정리
  /settings      # 언어 전환, 보상 설정
  /login         # 로그인 화면 (구글 OAuth 전용)
```

---

## 🔄 데이터 구조 (v2.0)

### 프로젝트-먼슬리 목표치 분리 시스템

**기존 구조**: 프로젝트 전체 목표치만 관리

```
Project: target: 40, completedTasks: 15
Monthly: doneCount: 15, targetCount: 40
```

**새로운 구조**: 프로젝트 전체 + 먼슬리별 개별 목표치 관리

```
Project: target: 40, completedTasks: 15 (전체)
Monthly:
  connectedProjects: [
    { projectId: "proj1", monthlyTargetCount: 8, monthlyDoneCount: 6 },
    { projectId: "proj2", monthlyTargetCount: 5, monthlyDoneCount: 3 }
  ]
```

### 주요 변경사항

1. **Monthly 구조 개선**

   - `projectIds[]` → `connectedProjects[]` (목표치 포함)
   - 각 프로젝트마다 먼슬리별 목표치와 진행률 관리

2. **진행률 계산 방식**

   - 먼슬리 달성률 = Σ(monthlyDoneCount) / Σ(monthlyTargetCount)
   - 프로젝트별 먼슬리 진행률 = monthlyDoneCount / monthlyTargetCount

3. **태스크 완료 이벤트**

   - 프로젝트 전체 진행률 업데이트
   - 활성 먼슬리의 해당 프로젝트 monthlyDoneCount 업데이트

4. **마이그레이션 지원**
   - 기존 데이터를 새로운 구조로 자동 변환
   - 하위 호환성 유지

### 실패 패턴 분석 시스템

**데이터 수집**: 먼슬리 회고 작성 시 실패한 Key Results의 이유 선택

- 목표 과다, 시간 관리, 우선순위, 외부 요인, 동기 부족, 기타

**스냅샷 저장**: 월말 스냅샷에 실패 분석 데이터 포함

- 전체 실패율, 실패 이유별 분포, 상세 실패 내역

**분석 제공**: 홈 대시보드에서 실패 패턴 분석 위젯

- 연간/월간 실패율 트렌드
- 주요 실패 이유 순위
- 개선 제안 자동 생성

---

## 🛠️ 향후 기능 예정 (v1+)

- 🔮 AI 기반 먼슬리 목표 자동 추천 (MCP 활용)
- 📈 사용자별 성장 히스토리 뷰
- 🧠 먼슬리 회고 자동 요약 / GPT 피드백
- 🧍 캐릭터 커스터마이징 (선택 기능)

---

## 📜 라이선스

MIT License © 2025-present [Sol Lee]
