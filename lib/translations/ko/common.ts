export const common = {
  type: "유형",
  status: "상태",
  cancel: "취소",
  save: "저장",
  delete: "삭제",
  confirm: "확인",
  noSearchResults: "검색 결과가 없습니다.",
  progress: "진행률",
  area: "영역",
  category: "카테고리",
  target: "목표",
  uncategorized: "미분류",
  chapterGoal: "이번 챕터 목표",
  projectProgress: "전체 진행률",
  errors: {
    loginRequired: "로그인이 필요합니다.",
    unexpectedResponse: "서버에서 예상치 못한 응답을 받았습니다.",
    serviceError: "서비스 오류가 발생했습니다.",
  },
} as const;

export const bottomNav = {
  home: "홈",
  chapter: "챕터",
  para: "PARA",
  settings: "설정",
} as const;

export const theme = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
  mobileNotice: "절전모드 등의 기기 설정에 따라 적용되지 않을 수 있습니다",
} as const;

export const language = {
  korean: "한국어",
  english: "English",
} as const;

export const pageLoading = {
  navigating: "페이지 이동 중...",
} as const;

export const noteForm = {
  title: "노트 작성",
  content: "노트 내용",
  placeholder: "기록하고 싶은 내용을 작성해주세요",
  contentRequired: "노트 내용을 입력해주세요",
  save: "저장",
  cancel: "취소",
} as const;

export const charts = {
  areaActivity: "영역별 활동",
  completionRate: "완료율",
  focusTime: "집중 시간",
  chapterComparison: "챕터 비교",
  monthlyProgress: "월간 진행률",
  yearlyStats: "연간 통계",
  projectStatus: "프로젝트 상태",
  taskProgress: "태스크 진행률",
} as const;
