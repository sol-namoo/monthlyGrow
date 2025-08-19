export const areas = {
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
} as const;
