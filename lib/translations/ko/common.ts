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
  monthlyGoal: "이번 먼슬리 목표",
  projectProgress: "전체 진행률",
  errors: {
    loginRequired: "로그인이 필요합니다.",
    unexpectedResponse: "서버에서 예상치 못한 응답을 받았습니다.",
    serviceError: "서비스 오류가 발생했습니다.",
    // Firebase 관련 에러 메시지
    firebaseAuthPersistenceFailed: "Firebase 인증 설정 실패",
    // 데이터 조회 에러 메시지
    resourceLoadFailed: "리소스 정보를 불러오는 중 오류가 발생했습니다.",
    activeResourceLoadFailed: "활성 리소스 정보를 불러오는 중 오류가 발생했습니다.",
    archivedResourceLoadFailed: "아카이브된 리소스 정보를 불러오는 중 오류가 발생했습니다.",
    uncategorizedResourceLoadFailed: "미분류 리소스 정보를 불러오는 중 오류가 발생했습니다.",
    areaLoadFailed: "영역 정보를 불러오는 중 오류가 발생했습니다.",
    activeAreaLoadFailed: "활성 영역 정보를 불러오는 중 오류가 발생했습니다.",
    archivedAreaLoadFailed: "아카이브된 영역 정보를 불러오는 중 오류가 발생했습니다.",
    // 데이터 생성/수정/삭제 에러 메시지
    resourceCreateFailed: "리소스 생성에 실패했습니다.",
    resourceUpdateFailed: "리소스 업데이트에 실패했습니다.",
    resourceDeleteFailed: "리소스 삭제에 실패했습니다.",
    areaCreateFailed: "영역 생성에 실패했습니다.",
    areaUpdateFailed: "영역 업데이트에 실패했습니다.",
    areaDeleteFailed: "영역 삭제에 실패했습니다.",
    uncategorizedAreaLoadFailed: "미분류 영역 조회/생성 실패",
  },
} as const;

export const bottomNav = {
  home: "홈",
  monthly: "먼슬리",
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
  loading: "잠시만 기다려 주세요...",
  processing: "처리 중...",
  saving: "저장 중...",
  updating: "업데이트 중...",
  deleting: "삭제 중...",
  creating: "생성 중...",
  analyzing: "분석 중...",
  connecting: "연결 중...",
} as const;

export const noteForm = {
  title: "노트 작성",
  content: "노트 내용",
  placeholder: "기록하고 싶은 내용을 작성해주세요",
  contentRequired: "노트 내용을 입력해주세요",
  save: "저장",
  cancel: "취소",
  loading: "로딩 중...",
  loadMore: "더보기",
} as const;

export const charts = {
  areaActivity: "영역별 활동",
  completionRate: "완료율",
  focusTime: "집중 시간",
  focusTimeUnit: "시간",
  monthlyComparison: "먼슬리 비교",
  monthlyProgress: "먼슬리 진행률",
  yearlyStats: "연간 통계",
  projectStatus: "프로젝트 상태",
  taskProgress: "할 일 진행률",
} as const;
