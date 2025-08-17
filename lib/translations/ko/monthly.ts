export const monthly = {
  title: "먼슬리",
  uncategorized: "미분류",
  viewProjects: "프로젝트 보러 가기",
  completedTasksCount: "{count}개 완료",
  tabs: {
    current: "현재",
    future: "예정",
    past: "과거",
  },
  currentMonthly: {
    title: "현재 먼슬리 요약",
    status: {
      inProgress: "진행 중",
      completed: "완료됨",
    },
    reward: "보상",
    noReward: "보상 없음",
    progress: "진행률",
    progressSuffix: "%",
    daysLeft: "D-",
    completionRate: "달성률",
    focusAreas: "중점 영역",
    projects: "프로젝트",
    projectsConnected: "{count}개 프로젝트가 연결되어 있습니다",
    noProjects: "연결된 프로젝트가 없습니다",
    noMonthly: {
      title: "현재 먼슬리가 없습니다",
      description: "새로운 먼슬리를 생성하여 목표를 설정하고 달성해보세요",
      button: "먼슬리 생성하기",
    },
    addedMidway: "중간 추가",
    viewDetails: "상세보기",
    projectList: "프로젝트 목록",
    projectCount: "프로젝트 ({count}개)",
    noProjectsTitle: "프로젝트가 없습니다",
    noProjectsDescription: "이 먼슬리에 프로젝트를 추가해보세요",
    aiPlanGenerator: "AI로 계획 생성하기",
    manualAddProject: "수동으로 프로젝트 추가",
    areaSuffix: "영역",
    keyResultsTitle: "핵심 지표",
    keyResultsCount: "핵심 지표 ({completed}/{total})",
    noKeyResults: "핵심 지표가 설정되지 않았습니다",
    keyResultCompleted: "완료",
    keyResultInProgress: "진행중",
    objective: "목표",
  },
  futureMonthlies: {
    reward: "보상",
    target: "목표",
    targetCount: "목표: {count}개",
    connectedProjects: "{count}개 연결됨",
    noProjects: "연결된 프로젝트가 없습니다",
    totalCount: "총 {count}개의 예정된 먼슬리",
    button: "먼슬리 생성하기",
    keyResults: "핵심 지표",
    keyResultsCount: "{count}개",
    noMonthlies: {
      title: "예정된 먼슬리가 없습니다",
      description: "미래의 목표를 위해 새로운 먼슬리를 계획해보세요",
      button: "먼슬리 생성하기",
    },
  },
  pastMonthlies: {
    achievement: "달성률: {rate}%",
    totalCount: "총 {count}개의 완료된 먼슬리",
    completionRate: "달성률",
    connectedProjects: "{count}개 연결됨",
    keyResults: "핵심 지표",
    keyResultsCount: "{completed}/{total}",
    status: {
      completed: "완료",
      planned: "예정",
      allCompleted: "완성",
      partiallyCompleted: "부분 완성",
    },
    noMonthlies: {
      title: "완료된 먼슬리가 없습니다",
      description: "완료된 먼슬리가 여기에 표시됩니다",
    },
  },
} as const;

export const monthlyDetail = {
  title: "먼슬리 상세",
  uncategorized: "미분류",
  viewProjects: "프로젝트 보러 가기",
  keyResult: "핵심 지표",
  completedTasksCount: "{count}개 완료",
  completedTasks: {
    noTasks: {
      title: "완료된 할 일이 없어요",
      description: "이번 달에 완료한 태스크가 아직 없습니다.",
      plannedDescription: "아직 시작하지 않은 먼슬리입니다.",
      hint: "프로젝트에서 할 일을 확인해보세요!",
    },
  },
  reward: "보상",
  noReward: "보상 없음",
  completionRate: "달성률",
  noProjectsForCompletionRate:
    "연결된 프로젝트가 없으면 달성률을 측정할 수 없어요",
  focusAreas: "중점 영역",
  connectedArea: "연결된 영역",
  createdAt: "생성일",
  updatedAt: "수정일",
  taskList: "할 일 목록",
  add: "추가",
  project: {
    status: {
      undefined: "미정",
      planned: "예정",
      inProgress: "진행 중",
      completed: "완료",
      overdue: "기한 지남",
    },
    duration: {
      undefined: "기간 미정",
    },
  },
  error: {
    loading: "먼슬리를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.",
    notFound: "먼슬리를 찾을 수 없습니다.",
  },
  noConnectedProjects: "먼슬리에 연결된 프로젝트가 없어요",
  keyResults: {
    noKeyResults: "Key Results가 없어요",
    noKeyResultsDescription: "이번 먼슬리의 핵심 목표를 설정해보세요",
    addKeyResult: "Key Result 추가",
    status: {
      completed: "완료",
      planned: "예정",
      inProgress: "진행중",
    },
  },

  noProjectsForCompletionRateDescription:
    "연결된 프로젝트가 없으면 달성률을 측정할 수 없어요",
  connectProjectsHint:
    '프로젝트를 연결하려면 상단의 "먼슬리 수정" 버튼을 사용하세요',
  noFocusAreas: "중점 영역이 설정되지 않았습니다.",
  connectedProjects: "연결된 프로젝트",
  tabs: {
    keyResults: "핵심 지표",
    completedTasks: "완료된 할 일",
    retrospective: "회고",
    note: "노트",
    keyResultsFull: "핵심 지표",
    completedTasksFull: "완료된 할 일",
    retrospectiveFull: "회고",
    noteFull: "노트",
  },
  note: {
    title: "먼슬리 노트",
    edit: "노트 수정",
    add: "노트 작성",
    noNote: "작성된 노트가 없어요",
    description: "이번 먼슬리에서 느낀 점을 기록해 보세요",
    addButton: "노트 작성하기",
    placeholder: "오늘의 노트를 작성해보세요...",
    save: "저장하기",
    editTitle: "먼슬리 노트 수정",
    addTitle: "먼슬리 노트 작성",
    descriptionText:
      "먼슬리 진행 중 느낀 점이나 배운 점을 자유롭게 기록하세요.",
    saveSuccess: "노트 저장 완료",
    saveSuccessDescription: "노트가 성공적으로 저장되었습니다.",
    saveError: "노트 저장 실패",
    saveErrorDescription: "노트 저장 중 오류가 발생했습니다.",
    contentRequired: "노트 저장 실패",
    contentRequiredDescription: "노트 내용을 입력해주세요.",
  },
  addProject: {
    title: "먼슬리에 프로젝트 추가",
    description:
      "먼슬리 중간에 추가된 프로젝트는 별도로 표시되며, 월말 리포트에서 '후속 투입 항목'으로 집계됩니다.",
    newProject: "새 프로젝트 생성",
    existingProject: "기존 프로젝트 연결",
    cancel: "취소",
  },
  retrospective: {
    title: "먼슬리 회고 작성",
    description: "이번 먼슬리를 돌아보고 다음 먼슬리를 계획하세요.",
    noContent: "작성된 회고가 없어요",
    inProgressDescription: "먼슬리가 진행 중일 때는 회고를 작성할 수 없어요",
    writeTitle: "회고 작성하기",
    notStarted: {
      title: "아직 시작하지 않은 먼슬리예요",
      description: "먼슬리가 진행되면 회고를 작성할 수 있어요.",
    },
    bestMoment: {
      label: "이번 먼슬리에서 가장 좋았던 순간은?",
      placeholder: "예: 운동 후 기분이 좋아지는 것을 느낀 순간",
    },
    routineAdherence: {
      label: "계획한 루틴을 얼마나 지켰나요?",
      placeholder: "예: 평일 80%, 주말 60% 정도로 유지",
    },
    unexpectedObstacles: {
      label: "예기치 못한 방해 요소는 있었나요?",
      placeholder: "예: 주말에 늦잠을 자는 습관",
    },
    nextMonthlyApplication: {
      label: "다음 먼슬리에 적용할 점은?",
      placeholder: "예: 다음 먼슬리에서는 주말 루틴도 포함해서 계획",
    },
    helpful: {
      label: "이 회고는 스스로에게 도움이 되었나요?",
    },
    bookmark: {
      label: "다시 읽고 싶은 회고로 표시",
      description: "중요한 회고는 북마크하여 나중에 쉽게 찾을 수 있습니다",
    },
    save: "회고 저장",
  },
  delete: {
    title: "먼슬리 삭제",
    description: "이 먼슬리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    completedDescription:
      "이 먼슬리를 삭제하시겠습니까? 삭제해도 해당 월의 정보는 연간 통계에 여전히 반영됩니다.",
    activeDescription:
      "이 먼슬리를 삭제하시겠습니까? 연결된 프로젝트와 할 일도 함께 삭제됩니다.",
    confirm: "삭제",
    cancel: "취소",
    success: {
      title: "먼슬리 삭제 완료",
      description: "먼슬리가 성공적으로 삭제되었습니다.",
    },
    error: {
      title: "먼슬리 삭제 실패",
      description: "먼슬리 삭제 중 오류가 발생했습니다.",
    },
  },
  projectMigration: {
    title: "미완료 프로젝트 발견",
    description:
      "이 먼슬리에 완료되지 않은 프로젝트가 있습니다. 다른 먼슬리로 이동하시겠습니까?",
    incompleteProjects: "미완료 프로젝트 ({count}개)",
    selectTarget: "이동할 먼슬리 선택",
    selectPlaceholder: "먼슬리를 선택하세요",
    inProgress: "진행 중",
    planned: "예정",
    noAvailableMonthlies:
      "💡 현재 이동 가능한 먼슬리가 없습니다. 새로운 먼슬리를 먼저 생성해주세요.",
    later: "나중에 처리",
    migrate: "프로젝트 이동",
    success: {
      title: "프로젝트 이동 완료",
      description: "{count}개의 프로젝트가 성공적으로 이동되었습니다.",
    },
    error: {
      title: "프로젝트 이동 실패",
      description: "프로젝트 이동 중 오류가 발생했습니다.",
    },
  },
} as const;

export const monthlyEdit = {
  title: "먼슬리 수정",
  validation: {
    title: "입력 오류",
    titleRequired: "먼슬리 제목을 입력해주세요",
    objectiveRequired: "Objective를 입력해주세요.",
    minKeyResults: "최소 1개의 Key Result를 추가해주세요.",
    keyResultRequired: "모든 Key Result의 제목을 입력해주세요.",
  },
  error: {
    loading: "먼슬리 정보를 불러오는 중 오류가 발생했습니다",
    notFound: "먼슬리를 찾을 수 없습니다",
    notFoundDescription: "요청하신 먼슬리가 존재하지 않거나 삭제되었습니다.",
    backToList: "먼슬리 목록으로 돌아가기",
    completed:
      "완료된 먼슬리는 편집할 수 없습니다. 새로운 먼슬리를 생성해주세요.",
  },
  success: {
    title: "먼슬리 수정 완료",
    description: "먼슬리가 성공적으로 수정되었습니다",
  },
  basicInfo: {
    title: "기본 정보",
    monthlyTitle: "먼슬리 제목",
    monthlyTitlePlaceholder: "예: 1월 건강 먼슬리",
    reward: "달성 보상",
    rewardPlaceholder: "예: 새로운 운동화 구매",
    rewardHint: "💡 먼슬리를 완료했을 때 자신에게 줄 보상을 설정하세요",
    startDate: "시작일",
    endDate: "종료일",
    dateHint: "먼슬리 기간은 수정할 수 없습니다",
    endDateHint: "해당 월의 마지막 날까지",
    recommendation:
      "먼슬리 제목, 보상, 중점 영역은 언제든지 수정할 수 있습니다",
  },
  focusAreas: {
    title: "중점 Areas",
    description: "이번 먼슬리에서 집중할 영역을 선택하세요",
    noAreas: "생성된 영역이 없습니다",
    createArea: "영역 생성하기",
    areaHint: "영역을 생성하면 더 체계적으로 관리할 수 있어요",
  },
  projects: {
    title: "프로젝트 연결",
    description:
      "이 먼슬리와 연결할 프로젝트를 선택하거나 새 프로젝트를 만들어보세요. 프로젝트는 나중에 추가할 수도 있습니다",
    selectExisting: "기존 프로젝트 선택",
    createNew: "새 프로젝트 만들기",
    connectedProjects: "연결된 프로젝트",
    noConnectedProjects: "아직 연결된 프로젝트가 없습니다",
    recommendation:
      "권장: 2~3개 프로젝트에 집중하면 먼슬리의 효과를 높일 수 있어요",
    warning: "많은 프로젝트를 선택하면 집중도가 떨어질 수 있습니다",
    modal: {
      title: "프로젝트 추가/제거",
      description:
        "이 먼슬리에 연결할 프로젝트를 선택하세요. 최대 5개까지 연결할 수 있습니다",
      search: "프로젝트 검색",
      searchPlaceholder: "프로젝트 제목으로 검색...",
      connected: "연결됨",
      noDescription: "설명 없음",
    },
    newProject: {
      title: "새 프로젝트 생성",
      description:
        "프로젝트 생성 페이지로 이동하여 새 프로젝트를 만들고, 완료 후 이 먼슬리 수정 페이지로 돌아와서 연결할 수 있습니다",
      note: "참고 사항",
      noteDescription:
        "현재 수정 중인 먼슬리 정보는 저장되므로 안심하고 이동하세요",
    },
    newProjectDialog: {
      title: "새 프로젝트 만들기",
      description: "새 프로젝트를 만들어 먼슬리에 연결하시겠습니까?",
      createNew: "새 프로젝트 생성",
      createDescription:
        "프로젝트 생성 페이지로 이동하여 새 프로젝트를 만들고, 완료 후 이 먼슬리 페이지로 돌아와서 연결할 수 있습니다",
      note: "참고 사항",
      noteDescription:
        "현재 작성 중인 먼슬리 정보는 저장되므로 안심하고 이동하세요",
      cancel: "취소",
      viewProjects: "기존 프로젝트 목록 보기",
    },
  },
  save: "변경사항 저장",
  saving: "저장 중...",
} as const;

export const monthlyNew = {
  title: "먼슬리 생성",
  validation: {
    titleRequired: "먼슬리 제목을 입력해주세요",
    rewardRequired: "보상을 입력해주세요",
    monthRequired: "월을 선택해주세요",
    startDateRequired: "시작일을 입력해주세요",
    endDateRequired: "종료일을 입력해주세요",
    areasRequired: "중점 영역을 선택해주세요",
  },
  loginRequired: {
    title: "로그인이 필요합니다",
    description: "먼슬리를 생성하려면 로그인이 필요합니다",
  },
  basicInfo: {
    title: "기본 정보",
    monthSelection: "먼슬리 월 선택",
    monthPlaceholder: "먼슬리를 진행할 월을 선택하세요",
    monthlyTitle: "먼슬리 제목",
    monthlyTitlePlaceholder: "예: 1월 건강 먼슬리",
    reward: "달성 보상",
    rewardPlaceholder: "예: 새로운 운동화 구매",
    rewardHint:
      "💡 기본 보상 설정이 비활성화되어 있습니다. 설정에서 활성화하면 새 먼슬리 생성 시 자동으로 보상이 채워집니다",
    startDate: "시작일",
    endDate: "종료일",
    dateHint: "먼슬리는 월 단위로 설정됩니다",
    endDateHint: "해당 월의 마지막 날까지",
  },
  focusAreas: {
    title: "중점 영역",
    description: "이번 먼슬리에서 집중할 영역을 선택하세요",
    noAreas: "생성된 영역이 없습니다",
    createArea: "Area 만들기",
    areaHint: "영역을 생성하면 더 체계적으로 관리할 수 있어요",
    maxAreas: "원하는 만큼 선택 가능합니다",
    recommendation: "권장: 2개 영역에 집중하면 먼슬리의 효과를 높일 수 있어요",
    warning: "많은 영역을 선택하면 집중도가 떨어질 수 있습니다",
  },
  projects: {
    title: "프로젝트 연결",
    description:
      "이 먼슬리와 연결할 프로젝트를 선택하거나 새 프로젝트를 만들어보세요. 프로젝트는 나중에 추가할 수도 있습니다",
    selectExisting: "기존 프로젝트 선택",
    createNew: "새 프로젝트 만들기",
    connectedProjects: "연결된 프로젝트",
    noConnectedProjects: "아직 연결된 프로젝트가 없습니다",
    recommendation:
      "권장: 2~3개 프로젝트에 집중하면 먼슬리의 효과를 높일 수 있어요",
    warning: "많은 프로젝트를 선택하면 집중도가 떨어질 수 있습니다",
    modal: {
      title: "새 프로젝트 만들기",
      description: "새 프로젝트를 만들어 먼슬리에 연결하시겠습니까?",
      createNew: "새 프로젝트 생성",
      createDescription:
        "프로젝트 생성 페이지로 이동하여 새 프로젝트를 만들고, 완료 후 이 먼슬리 페이지로 돌아와서 연결할 수 있습니다",
      note: "참고 사항",
      noteDescription:
        "현재 작성 중인 먼슬리 정보는 저장되므로 안심하고 이동하세요",
      cancel: "취소",
      viewProjects: "기존 프로젝트 목록 보기",
    },
  },
  duplicateMonthly: {
    title: "기존 먼슬리가 있습니다",
    description:
      "선택한 월에 이미 먼슬리가 존재합니다. 기존 먼슬리를 대체하고 새로운 먼슬리를 생성하시겠습니까?",
    existingMonthlyInfo: "기존 먼슬리 정보",
    titleLabel: "제목",
    periodLabel: "기간",
    connectedProjectsLabel: "연결된 프로젝트",
    projectsCount: "0개",
    tip: "연결된 프로젝트는 삭제되지 않고 먼슬리 연결만 해제됩니다",
    warning: "기존 먼슬리는 '먼슬리 생성하기' 버튼을 누를 때 삭제됩니다",
    cancel: "취소",
    replace: "기존 먼슬리 대체하고 계속",
  },
  finalConfirm: {
    title: "먼슬리 생성 확인",
    description:
      "선택한 월에 기존 먼슬리가 있거나 이전에 취소한 월입니다. 정말로 먼슬리를 생성하시겠습니까?",
    warning: "⚠️ 기존 먼슬리가 있는 경우 삭제되고 새로운 먼슬리가 생성됩니다",
    cancel: "취소",
    confirm: "확인, 먼슬리 생성",
  },
  monthLimit: "먼슬리는 최대 6개월 후까지만 생성할 수 있습니다",
  monthSelection: {
    current: "현재",
    next: "다음",
    hint: "💡 먼슬리는 최대 6개월 후까지 생성할 수 있습니다",
    limitTitle: "월 선택 제한",
    limitDescription:
      "이 월은 기존 먼슬리가 있어 선택할 수 없습니다. 다른 월을 선택해주세요",
  },
  noAreas: {
    title: "등록된 활동 영역이 없어요",
    description:
      "먼슬리를 만들기 위해서는 먼저 활동 영역(Area)을 등록해야 합니다. 건강, 커리어, 자기계발 등 관심 있는 영역을 만들어보세요",
    createArea: "Area 만들기",
    viewPara: "PARA 시스템 보기",
  },
  success: {
    title: "먼슬리 생성 완료",
    description: "먼슬리가 생성되었습니다",
    projectCreated: "프로젝트 생성 완료",
    projectCreatedDescription:
      "새로 생성된 프로젝트가 목록에 추가되었습니다. 프로젝트 선택에서 확인하세요",
    existingMonthlyDeleted: {
      title: "기존 먼슬리 대체 준비 완료",
      description:
        "먼슬리 생성하기 버튼을 누르면 기존 먼슬리가 삭제되고 새 먼슬리가 생성됩니다",
    },
    existingMonthlyDeletedDescription: "{title}가 삭제되었습니다",
  },
  error: {
    title: "먼슬리 생성 실패",
    description: "먼슬리 생성 중 오류가 발생했습니다",
  },
  createMonthly: "먼슬리 생성하기",
  // 먼슬리 생성 페이지
  new: {
    title: "새 먼슬리 만들기",
    description: "새로운 먼슬리를 생성하여 목표를 설정하고 달성해보세요",
    basicInfo: {
      title: "기본 정보",
      monthSelection: "월 선택",
      monthPlaceholder: "월을 선택하세요",
    },
    form: {
      title: "제목",
      titlePlaceholder: "예: 2024년 8월",
      objective: "목표",
      objectivePlaceholder: "예: 고객 만족도를 크게 향상시킨다",
      startDate: "시작일",
      endDate: "종료일",
      reward: "보상 (선택사항)",
      rewardPlaceholder: "목표 달성 시 받을 보상",
      keyResults: "핵심 지표",
      keyResultsDescription:
        "목표 달성을 측정할 수 있는 구체적이고 실현 가능한 지표를 설정하세요",
      keyResultTitle: "핵심 지표 제목",
      keyResultTitlePlaceholder:
        "예: 매일 30분 운동하기, 주 3회 독서하기, 주 2회 블로그 포스팅",
      keyResultDescription: "상세 설명 (선택사항)",
      keyResultDescriptionPlaceholder: "목표에 대한 상세한 설명을 입력하세요",
      addKeyResult: "핵심 지표 추가",
      removeKeyResult: "핵심 지표 제거",
      keyResultsGuide:
        "💡 한 달에 3-5개의 핵심 지표를 설정하는 것이 적절합니다. 너무 많으면 집중도가 떨어질 수 있어요.",
    },
    validation: {
      titleRequired: "제목을 입력해주세요",
      objectiveRequired: "목표를 입력해주세요",
      startDateRequired: "시작일을 선택해주세요",
      endDateRequired: "종료일을 선택해주세요",
      keyResultRequired: "핵심 지표 제목을 입력해주세요",
      minKeyResults: "최소 1개의 핵심 지표를 추가해주세요",
    },
    existingMonthly: {
      title: "기존 먼슬리가 있습니다",
      description:
        "선택한 월에 이미 먼슬리가 존재합니다. 기존 먼슬리를 대체하시겠습니까?",
      replace: "기존 먼슬리 대체",
      cancel: "취소",
    },
    success: {
      title: "먼슬리 생성 완료",
      description: "새로운 먼슬리가 성공적으로 생성되었습니다",
    },
    error: {
      title: "먼슬리 생성 실패",
      description: "먼슬리 생성 중 오류가 발생했습니다",
    },
  },
  // 먼슬리 수정 페이지
  edit: {
    title: "먼슬리 수정",
    description: "먼슬리 정보를 수정하세요",
    basicInfo: {
      title: "기본 정보",
      monthSelection: "월 선택",
      monthPlaceholder: "월을 선택하세요",
    },
    form: {
      title: "제목",
      titlePlaceholder: "예: 2024년 8월",
      objective: "목표",
      objectivePlaceholder: "예: 고객 만족도를 크게 향상시킨다",
      startDate: "시작일",
      endDate: "종료일",
      reward: "보상 (선택사항)",
      rewardPlaceholder: "목표 달성 시 받을 보상",
      keyResults: "핵심 지표",
      keyResultsDescription:
        "목표 달성을 측정할 수 있는 구체적이고 실현 가능한 지표를 설정하세요",
      keyResultTitle: "핵심 지표 제목",
      keyResultTitlePlaceholder:
        "예: 매일 30분 운동하기, 주 3회 독서하기, 주 2회 블로그 포스팅",
      keyResultDescription: "상세 설명 (선택사항)",
      keyResultDescriptionPlaceholder: "목표에 대한 상세한 설명을 입력하세요",
      addKeyResult: "핵심 지표 추가",
      removeKeyResult: "핵심 지표 제거",
      keyResultsGuide:
        "💡 한 달에 3-5개의 핵심 지표를 설정하는 것이 적절합니다. 너무 많으면 집중도가 떨어질 수 있어요.",
    },
    validation: {
      titleRequired: "제목을 입력해주세요",
      objectiveRequired: "목표를 입력해주세요",
      startDateRequired: "시작일을 선택해주세요",
      endDateRequired: "종료일을 선택해주세요",
      keyResultRequired: "핵심 지표 제목을 입력해주세요",
    },
    success: {
      title: "먼슬리 수정 완료",
      description: "먼슬리가 성공적으로 수정되었습니다",
    },
    error: {
      title: "먼슬리 수정 실패",
      description: "먼슬리 수정 중 오류가 발생했습니다",
    },
  },
  // 먼슬리 상세 페이지
  detail: {
    notFound: {
      title: "먼슬리를 찾을 수 없습니다",
      description: "요청하신 먼슬리가 존재하지 않거나 삭제되었습니다",
      backToList: "먼슬리 목록으로 돌아가기",
    },
    loading: {
      title: "먼슬리 로딩 중",
      description: "먼슬리 정보를 불러오는 중입니다",
    },
    actions: {
      edit: "수정",
      delete: "삭제",
      back: "뒤로",
      editTooltip: "먼슬리 수정",
      deleteTooltip: "먼슬리 삭제",
    },
    delete: {
      title: "먼슬리 삭제",
      description: "이 먼슬리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다",
      confirm: "삭제",
      cancel: "취소",
      success: {
        title: "먼슬리 삭제 완료",
        description: "먼슬리가 성공적으로 삭제되었습니다",
      },
      error: {
        title: "먼슬리 삭제 실패",
        description: "먼슬리 삭제 중 오류가 발생했습니다",
      },
    },
    keyResult: {
      update: {
        success: {
          title: "핵심 지표 업데이트 완료",
          description: "핵심 지표가 성공적으로 업데이트되었습니다",
        },
        error: {
          title: "핵심 지표 업데이트 실패",
          description: "핵심 지표 업데이트 중 오류가 발생했습니다",
        },
      },
    },
  },
} as const;
