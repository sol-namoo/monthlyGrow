export const aiPlanGenerator = {
  // 페이지 제목 및 헤더
  title: "AI 계획 생성기",
  subtitle: "AI를 활용해 프로젝트를 생성하고, 그에 어울리는 영역을 매칭합니다",
  description:
    "고급 AI 기술을 사용하여 프로젝트, 먼슬리, 목표에 대한 포괄적인 계획을 만드세요.",

  // 메인 섹션
  mainSection: {
    title: "계획 생성하기",
    description: "목표에 대해 알려주시면 AI가 개인화된 계획을 만들어드립니다.",
    generateButton: "계획 생성",
    generating: "생성 중...",
    regenerateButton: "재생성",
  },

  // 입력 폼
  form: {
    title: "계획 세부사항",
    inputTypeLabel: "입력 방식 선택",
    manualInput: "수동 입력",
    monthlyBased: "Monthly 기반",
    goalLabel: "주요 목표는 무엇인가요?",
    goalPlaceholder:
      "예: 현재 IELTS 점수가 6.0점대인데, 7.5점대로 높이고 싶습니다. 주로 스피킹 실력 향상에 집중하고 싶습니다.",
    timeframeLabel: "기간",
    timeframeOptions: {
      week: "1주",
      month: "1개월",
      quarter: "3개월",
      halfYear: "6개월",
      year: "1년",
    },
    categoryLabel: "카테고리",
    categoryOptions: {
      learning: "학습 및 교육",
      health: "건강 및 피트니스",
      career: "경력 및 사업",
      personal: "개인 발전",
      creative: "창작 프로젝트",
      other: "기타",
    },
    detailsLabel: "추가 세부사항 (선택사항)",
    detailsPlaceholder:
      "목표, 현재 상황, 특정 요구사항에 대한 더 많은 맥락을 제공해주세요...",
    submitButton: "계획 생성",
    submitting: "생성 중...",
  },

  // 결과 섹션
  result: {
    title: "생성된 계획",
    saveButton: "생성된 계획 저장",
    exportButton: "계획 내보내기",
    shareButton: "계획 공유",
    editButton: "계획 편집",
    regenerateButton: "계획 재생성",
    noResult: "아직 생성된 계획이 없습니다. 위의 양식을 작성하여 시작하세요.",
    summary: {
      title: "생성된 계획 요약",
      areas: "개 영역",
      projects: "개 프로젝트",
      description: "AI가 생성한 영역, 프로젝트, 작업들을 확인하고 저장하세요.",
    },
  },

  // 플랜 구조
  plan: {
    overview: "계획 개요",
    objectives: "목표",
    milestones: "주요 마일스톤",
    tasks: "작업 및 행동",
    timeline: "타임라인",
    resources: "리소스 및 도구",
    tips: "팁 및 권장사항",
  },

  // 상태 메시지
  status: {
    ready: "계획 생성을 준비했습니다",
    generating: "AI가 목표를 분석하고 개인화된 계획을 생성하고 있습니다...",
    success: "계획이 성공적으로 생성되었습니다!",
    error: "계획 생성에 실패했습니다. 다시 시도해주세요.",
    saving: "저장 중...",
    saved: "계획이 성공적으로 저장되었습니다!",
  },

  // 모달 및 다이얼로그
  modal: {
    saveTitle: "생성된 계획 저장",
    saveDescription: "이 계획을 PARA 시스템에 저장합니다:",
    saveButton: "계획 저장",
    cancelButton: "취소",
    noMonthlies: "사용 가능한 먼슬리가 없습니다. 먼저 먼슬리를 만드세요.",
    createMonthlyButton: "새 먼슬리 만들기",
  },

  // 에러 메시지
  errors: {
    goalRequired: "주요 목표를 입력해주세요",
    monthlyRequired: "Monthly를 선택해주세요",
    timeframeRequired: "기간을 선택해주세요",
    categoryRequired: "카테고리를 선택해주세요",
    generationFailed:
      "계획 생성에 실패했습니다. 입력 내용을 확인하고 다시 시도해주세요.",
    retryMessage: "생성을 다시 시도해 주세요.",
    saveFailed: "계획 저장에 실패했습니다. 다시 시도해주세요.",
    networkError: "네트워크 오류입니다. 연결을 확인하고 다시 시도해주세요.",
  },

  // 도움말 및 팁
  help: {
    goalTip:
      "달성하고 싶은 것을 구체적으로 설명하세요. 목표가 더 자세할수록 더 좋은 계획이 만들어집니다.",
    timeframeTip: "목표의 복잡성에 맞는 현실적인 기간을 선택하세요.",
    categoryTip:
      "올바른 카테고리를 선택하면 AI가 더 관련성 높은 제안을 제공할 수 있습니다.",
    detailsTip:
      "계획에 영향을 줄 수 있는 제약사항, 선호사항, 특정 요구사항을 포함하세요.",
  },

  // 성공 메시지
  success: {
    planGenerated: "개인화된 계획이 생성되었습니다!",
    planSaved: "계획이 먼슬리에 성공적으로 저장되었습니다!",
    planExported: "계획이 성공적으로 내보내졌습니다!",
  },

  // 기존 영역 정보
  existingAreas: {
    title: "기존 영역 정보",
    description:
      "AI가 기존 영역과 유사한 영역을 발견하면 재사용하고, 새로운 영역만 생성합니다.",
  },

  // 제약 조건 설정
  constraints: {
    timeSettings: {
      title: "시간 설정",
      projectDuration: "목표 달성 기간",
      daysPerWeek: "주당 가능한 일수",
      dailyTime: "일일 가용 시간",
    },
    preferences: {
      title: "선호도 설정",
      currentLevel: "현재 수준",
      intensity: "진행 강도",
      activityStyle: "활동 스타일",
    },
  },

  // 영역 매칭
  areaMatching: {
    title: "🔄 영역 선택",
    description:
      "AI가 제안한 영역들을 기존 영역과 매칭하거나 새로 생성할지 선택해주세요.",
    selectExisting: "기존 영역 중 선택:",
    createNew: "새 영역으로 생성:",
    selected: "✓ 선택됨",
  },

  // 프로젝트 타입
  projectTypes: {
    repetitive: "반복형",
    task: "작업형",
  },

  // 프로젝트 세부사항
  projectDetails: {
    target: "목표",
    targetCount: "목표 수량",
    times: "회",
    items: "개",
    dailyTime: "일일",
    duration: "기간",
    hours: "시간",
    minutes: "분",
    mainTasks: "주요 작업:",
    showMore: "더보기",
    showLess: "접기",
    moreTasks: "외 {count}개 작업",
  },

  // 편집 모드
  edit: {
    projectTitle: "프로젝트 제목",
    projectDescription: "프로젝트 설명",
    target: "목표",
    dailyTime: "일일 시간 (분)",
  },
} as const;
