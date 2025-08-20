export const para = {
  title: "PARA 시스템",
  tabs: {
    projects: "프로젝트",
    areas: "영역",
    resources: "자원",
    archives: "아카이브",
  },
  projects: {
    description: "목표 달성을 위한 프로젝트들을 관리하세요",
    newProject: "새 프로젝트",
    targetCount: {
      label: "목표 개수",
      placeholder: "목표 개수를 입력해주세요",
      repetitive: "목표 횟수",
      taskBased: "목표 할 일 수",
      repetitivePlaceholder: "목표 횟수 (예: 30)",
      taskBasedPlaceholder: "목표 할 일 수 (예: 10)",
      description: {
        repetitive:
          "반복형 프로젝트는 목표 횟수에 따라 할 일이 자동으로 생성됩니다",
        taskBased:
          "작업형 프로젝트는 목표 할 일 수에 따라 빈 할 일이 생성됩니다",
      },
      hint: {
        repetitive: "목표 횟수를 입력하면 할 일이 자동으로 생성됩니다",
        taskBased: "목표 할 일 수를 입력하면 빈 할 일이 생성됩니다",
        setup: "목표 횟수와 프로젝트 기간을 설정해주세요",
      },
      monthly: {
        label: "먼슬리 목표 개수",
        recommended: "권장: {count}개",
        current: "{current}개 / 총 할 일 {total}개",
        setToTotal: "전체 할 일로 설정",
        setToRecommended: "권장값으로 설정",
      },
    },
    filter: {
      all: "전체",
      allWithCount: "전체 ({count}개)",
      planned: "예정",
      plannedWithCount: "예정 ({count}개)",
      inProgress: "진행 중",
      inProgressWithCount: "진행 중 ({count}개)",
      overdue: "기한 지남",
      overdueWithCount: "기한 지남 ({count}개)",
      completed: "완료",
      completedWithCount: "완료 ({count}개)",
    },
    sort: {
      latest: "최신순",
      oldest: "오래된순",
      name: "이름순",
    },
    status: {
      planned: "예정",
      inProgress: "진행 중",
      completed: "완료",
      overdue: "기한 지남",
      undefined: "상태 없음",
    },
    uncategorized: "미분류",
    category: {
      repetitive: "반복형",
      taskBased: "작업형",
    },
    noProjects: {
      title: "프로젝트가 없습니다",
      description: "새로운 프로젝트를 생성하여 목표를 달성해보세요",
      button: "프로젝트 생성하기",
    },
    loading: "프로젝트를 불러오는 중...",
    loadMore: "더 보기",
  },
  areas: {
    description: "관심 영역을 체계적으로 관리하세요",
    count: "총 {count}개 영역",
    newArea: "새 영역",
    projectCount: "{count}개 프로젝트",
    resourceCount: "{count}개 자원",
    noAreas: {
      title: "영역이 없습니다",
      description: "새로운 영역을 생성하여 체계적으로 관리해보세요",
      button: "영역 생성하기",
    },
    // Area 상세페이지
    detail: {
      title: "영역 상세",
      connectedProjects: "연결된 프로젝트",
      connectedResources: "연결된 자료",
      noConnectedProjects: "연결된 프로젝트가 없습니다",
      noConnectedResources: "연결된 자료가 없습니다",
      delete: {
        title: "영역 삭제",
        description: "이 영역을 삭제하시겠습니까?",
        withItems: "연결된 프로젝트와 자료도 함께 삭제",
        warning:
          "연결된 모든 프로젝트와 자료가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다",
      },
      error: {
        loadError: "영역을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요",
        notFound: "해당 영역을 찾을 수 없습니다",
        deleteFailed: "삭제 실패",
        deleteError: "영역 삭제에 실패했습니다",
      },
      success: {
        deleteComplete: "영역 삭제 완료",
        deleteWithItems: "영역과 연결된 모든 항목이 삭제되었습니다",
        deleteWithoutItems:
          "영역이 삭제되었습니다. 연결된 프로젝트와 자료는 유지됩니다",
      },
    },
    // Area 생성/수정 페이지
    form: {
      title: "영역 만들기",
      description: "새로운 영역을 만들어보세요",
      explanation:
        "영역은 프로젝트와 자료를 체계적으로 분류하고 관리하는 기준입니다. 자신만의 영역을 만들어보세요",
      name: "영역 이름",
      namePlaceholder: "영역 이름을 입력해주세요",
      areaDescription: "영역 설명",
      descriptionPlaceholder: "이 영역에서 관리하고 싶은 내용을 설명해주세요",
      color: "색상",
      icon: "아이콘",
      template: {
        title: "영역 이름",
        message: "자주 사용되는 영역 템플릿을 선택하여 빠르게 설정할 수 있어요",
      },
      submit: "영역 생성",
      submitting: "생성 중...",
      success: {
        title: "Area 생성 완료",
        description: "{name} 영역이 생성되었습니다",
      },
      error: {
        title: "Area 생성 실패",
        description: "Area 생성 중 오류가 발생했습니다",
      },
      validation: {
        nameRequired: "영역 이름을 입력해주세요",
        descriptionRequired: "영역 설명을 입력해주세요",
      },
    },
  },
  resources: {
    description: "유용한 정보와 자료를 저장하세요",
    count: "총 {count}개 자원",
    newResource: "새 자원",
    other: "기타",
    sort: {
      latest: "최신순",
      oldest: "오래된순",
      name: "이름순",
    },
    noResources: {
      title: "자원이 없습니다",
      description: "새로운 자원을 추가하여 정보를 체계적으로 관리해보세요",
      button: "자원 추가하기",
    },
    // Resource 상세페이지
    detail: {
      title: "자원 상세",
      link: "링크",
      content: "내용",
      noContent: "링크나 내용이 없습니다",
      delete: {
        title: "자료 삭제",
        description: "이 자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다",
      },
      error: {
        loadError: "자료를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요",
        notFound: "해당 자료를 찾을 수 없습니다",
        deleteError: "자료 삭제에 실패했습니다",
      },
    },
    // Resource 생성/수정 페이지
    form: {
      title: "자원 만들기",
      description: "새로운 자원을 만들어보세요",
      explanation:
        "자원은 유용한 정보와 자료를 저장하는 곳입니다. 자신만의 자원을 만들어보세요",
      name: "자원 이름",
      namePlaceholder: "자원 이름을 입력해주세요",
      resourceDescription: "자원 설명",
      descriptionPlaceholder: "이 자원에 대한 설명을 입력해주세요",
      link: "링크",
      linkPlaceholder: "https://example.com",
      text: "내용",
      textPlaceholder: "자원의 내용을 입력해주세요",
      area: "영역",
      areaPlaceholder: "영역을 선택해주세요",
      submit: "자원 생성",
      submitting: "생성 중...",
      success: {
        title: "자원 생성 완료",
        description: "{name} 자원이 생성되었습니다",
      },
      error: {
        title: "자원 생성 실패",
        description: "자원 생성 중 오류가 발생했습니다",
      },
      validation: {
        nameRequired: "자원 이름을 입력해주세요",
        descriptionRequired: "자원 설명을 입력해주세요",
      },
    },
    // Resource 추가 페이지
    add: {
      title: "자료 추가하기",
      description: "새로운 자료를 추가해보세요",
      explanation: "자료는 영역에 대한 참고 정보, 링크 등입니다.",
      titleLabel: "자료 제목",
      titlePlaceholder: "예: 효과적인 시간 관리법",
      areaLabel: "소속 영역",
      areaPlaceholder: "영역을 선택해주세요",
      descriptionLabel: "설명 (선택 사항)",
      descriptionPlaceholder:
        "자료에 대한 간단한 설명을 입력하세요 (리스트에서 미리보기로 표시됩니다)",
      linkLabel: "링크 (선택 사항)",
      linkPlaceholder: "https://example.com",
      contentLabel: "내용 (선택 사항)",
      contentPlaceholder:
        "자료의 상세한 내용을 입력하세요 (긴 텍스트, 메모, 요약 등)",
      submit: "자료 생성",
      cancel: "취소",
      loading: "자료 생성 중...",
      success: {
        title: "자료 생성 완료",
        description: "{title} 자료가 생성되었습니다.",
      },
      error: {
        title: "자료 생성 실패",
        description: "자료 생성 중 오류가 발생했습니다.",
      },
      validation: {
        titleRequired: "자료 제목을 입력해주세요",
        urlInvalid: "올바른 URL을 입력해주세요",
        areaRequired: "영역을 선택해주세요",
      },
    },
    // Resource 수정 페이지
    edit: {
      title: "자료 수정",
      description: "자료를 수정해보세요",
      explanation:
        "자료의 내용이나 연결된 영역을 변경하여 최신 상태로 유지할 수 있습니다.",
      titleLabel: "자료 제목",
      titlePlaceholder: "예: 효과적인 시간 관리법",
      areaLabel: "소속 영역",
      areaPlaceholder: "영역을 선택해주세요",
      descriptionLabel: "설명 (선택 사항)",
      descriptionPlaceholder:
        "자료에 대한 간단한 설명을 입력하세요 (리스트에서 미리보기로 표시됩니다)",
      linkLabel: "링크 (선택 사항)",
      linkPlaceholder: "https://example.com",
      contentLabel: "내용 (선택 사항)",
      contentPlaceholder:
        "자료의 상세한 내용을 입력하세요 (긴 텍스트, 메모, 요약 등)",
      submit: "자료 수정",
      submitting: "수정 중...",
      cancel: "취소",
      success: {
        title: "자료 수정 완료",
        description: "자료가 성공적으로 수정되었습니다.",
      },
      error: {
        title: "자료 수정 실패",
        description: "자료 수정 중 오류가 발생했습니다.",
      },
      validation: {
        titleRequired: "자료 제목을 입력해주세요",
        urlInvalid: "올바른 URL을 입력해주세요",
        areaRequired: "영역을 선택해주세요",
      },
    },
  },
  archives: {
    description: "완료된 항목들을 보관하세요",
    count: "총 {count}개 아카이브",
    filter: {
      all: "전체",
      monthly: "먼슬리",
      project: "프로젝트",
      note: "노트",
    },
    sort: {
      latest: "최신순",
      oldest: "오래된순",
      name: "이름순",
      rating: "평점순",
    },
    noArchives: {
      title: "아카이브가 없습니다",
      description: "완료된 항목들이 여기에 표시됩니다",
    },
    noTitle: "제목 없음",
    noSummary: "요약 없음",
    loading: "아카이브를 불러오는 중...",
    loadMore: "더 보기",
    monthlyRetrospective: "먼슬리 회고",
    projectRetrospective: "프로젝트 회고",
    types: {
      monthlyRetrospective: "먼슬리 회고",
      projectRetrospective: "프로젝트 회고",
    },
    // Archive 상세페이지
    detail: {
      title: "아카이브 상세",
      tabs: {
        official: "공식 회고",
        freeform: "자유 회고",
      },
      error: {
        loadError: "회고를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요",
        notFound: "해당 회고를 찾을 수 없습니다",
      },
    },
  },
  // Archive 상세페이지 관련 번역 키들
  paraArchiveDetail: {
    tabs: {
      retrospective: "회고",
      note: "노트",
    },
    relatedItem: {
      monthly: "연결된 먼슬리",
      project: "연결된 프로젝트",
      monthlyDescription: "이 회고가 작성된 먼슬리입니다",
      projectDescription: "이 회고가 작성된 프로젝트입니다",
      viewMonthly: "먼슬리 보기",
      viewProject: "프로젝트 보기",
    },
    retrospective: {
      bestMoment: "가장 좋았던 순간",
      routineAdherence: "루틴 준수율",
      unexpectedObstacles: "예상치 못한 장애물",
      nextMonthlyApplication: "다음 먼슬리 적용 방안",
      note: "노트",
    },
    notes: {
      noContent: "노트 내용이 없습니다",
    },
    // 프로젝트 회고 관련 필드들
    projectRetrospective: {
      goalAchieved: "목표 달성 여부",
      memorableTask: "가장 기억에 남는 작업",
      stuckPoints: "막힌 지점",
      newLearnings: "새로운 학습",
      nextProjectImprovements: "다음 프로젝트 개선사항",
    },
    // 공통 필드들
    common: {
      createdAt: "작성일",
      rating: "평점",
      loading: "불러오는 중...",
      error: "오류가 발생했습니다",
    },
  },
} as const;
