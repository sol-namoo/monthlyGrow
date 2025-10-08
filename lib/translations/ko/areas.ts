export const areas = {
  description: "관심 영역을 체계적으로 관리하세요",
  icons: {
    compass: "나침반",
    heart: "하트",
    brain: "뇌",
    briefcase: "브리프케이스",
    dollarSign: "달러",
    users: "사람들",
    gamepad2: "게임패드",
    dumbbell: "운동",
    bookOpen: "독서",
    home: "가정",
    settings: "설정",
    star: "별",
    target: "과녁",
    zap: "번개",
    shield: "방패",
    globe: "지구",
    camera: "카메라",
    music: "음악",
    palette: "팔레트",
    car: "교통",
    plane: "여행",
    utensils: "요리",
  },
  templates: {
    health: {
      title: "건강",
      description: "운동, 식단, 건강 관리",
    },
    career: {
      title: "커리어",
      description: "업무, 성장, 전문성 개발",
    },
    personal: {
      title: "개인 성장",
      description: "학습, 독서, 자기계발",
    },
    relationships: {
      title: "인간관계",
      description: "가족, 친구, 소셜 네트워크",
    },
    finance: {
      title: "재정",
      description: "저축, 투자, 재정 관리",
    },
    hobby: {
      title: "취미",
      description: "게임, 예술, 여가 활동",
    },
  },
  new: {
    title: "새 영역 만들기",
    description: "새로운 영역을 생성하여 체계적으로 관리해보세요",
  },
  form: {
    title: "영역 이름",
    titlePlaceholder: "예: 건강 관리, 커리어 개발",
    description: "영역 설명",
    descriptionPlaceholder: "이 영역에서 관리하고 싶은 내용을 설명해주세요",
    color: "색상",
    icon: "아이콘",
  },
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
} as const;
