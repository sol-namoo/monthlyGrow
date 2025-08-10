export const retrospective = {
  form: {
    title: "회고 작성",
    bestMoment: "가장 좋았던 순간",
    bestMomentPlaceholder: "이번 챕터에서 가장 좋았던 순간을 기록해주세요",
    routineAdherence: "루틴 준수율",
    routineAdherencePlaceholder:
      "계획한 루틴을 얼마나 잘 지켰는지 기록해주세요",
    unexpectedObstacles: "예상치 못한 장애물",
    unexpectedObstaclesPlaceholder: "예상하지 못했던 어려움을 기록해주세요",
    nextChapterApplication: "다음 챕터 적용 방안",
    nextChapterApplicationPlaceholder:
      "이번 경험을 다음 챕터에 어떻게 적용할지 기록해주세요",
    freeformContent: "자유 회고 (선택사항)",
    freeformContentPlaceholder:
      "추가로 기록하고 싶은 내용이 있다면 자유롭게 작성해주세요",
    rating: "평점",
    bookmarked: "북마크에 추가",
    save: "저장",
    cancel: "취소",
    validation: {
      bestMomentRequired: "가장 좋았던 순간을 입력해주세요",
      routineAdherenceRequired: "루틴 준수율을 입력해주세요",
      unexpectedObstaclesRequired: "예상치 못한 장애물을 입력해주세요",
      nextChapterApplicationRequired: "다음 챕터 적용 방안을 입력해주세요",
    },
  },
  project: {
    form: {
      title: "프로젝트 회고 작성",
      bestMoment: "가장 좋았던 순간",
      bestMomentPlaceholder: "이 프로젝트에서 가장 좋았던 순간을 기록하세요",
      challenges: "어려웠던 점",
      challengesPlaceholder: "이 프로젝트에서 어려웠던 점을 기록하세요",
      learnings: "배운 점",
      learningsPlaceholder: "이 프로젝트를 통해 배운 점을 기록하세요",
      nextSteps: "다음 단계",
      nextStepsPlaceholder: "이 프로젝트를 바탕으로 다음에 할 일을 기록하세요",
      rating: "평가",
      ratingPlaceholder: "이 프로젝트에 대한 만족도를 평가하세요",
      save: "회고 저장",
      cancel: "취소",
      validation: {
        bestMomentRequired: "가장 좋았던 순간을 입력해주세요",
        challengesRequired: "어려웠던 점을 입력해주세요",
        learningsRequired: "배운 점을 입력해주세요",
        nextStepsRequired: "다음 단계를 입력해주세요",
      },
    },
  },
} as const;
