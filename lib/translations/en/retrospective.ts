export const retrospective = {
  form: {
    title: "Write Retrospective",
    bestMoment: "Most Rewarding Moment",
    bestMomentPlaceholder: "Record the most rewarding moment from this monthly",
    unexpectedObstacles: "Unexpected Obstacles",
    unexpectedObstaclesPlaceholder:
      "Record unexpected difficulties you encountered",
    keyResultsReview: "Key Results Evaluation",
    keyResultsReviewPlaceholder:
      "Evaluate the achievement status of each Key Results",
    nextMonthlyApplication: "Next Monthly Application",
    nextMonthlyApplicationPlaceholder:
      "Record how you'll apply this experience to the next monthly",
    freeformContent: "Freeform Retrospective (Optional)",
    freeformContentPlaceholder:
      "Write any additional content you'd like to record freely",
    completedKeyResults: "Completed Key Results",
    failedKeyResults: "Failed Key Results",
    failedReason: "Failure Reason",
    failedReasonOptions: {
      unrealisticGoal: "Goal was set too high",
      timeManagement: "Time management failure",
      priorityMismatch: "Priority setting problem",
      externalFactors: "External factors (work, personal matters, etc.)",
      motivation: "Lack of motivation",
      other: "Other",
    },
    rating: "Rating",
    bookmarked: "Add to Bookmarks",
    save: "Save",
    cancel: "Cancel",
    validation: {
      bestMomentRequired: "Please enter your most rewarding moment",
      unexpectedObstaclesRequired: "Please enter unexpected obstacles",
      keyResultsReviewRequired: "Please enter key results evaluation",
      nextMonthlyApplicationRequired: "Please enter next monthly application",
    },
  },
  project: {
    form: {
      title: "Write Project Retrospective",
      bestMoment: "Best Moment",
      bestMomentPlaceholder: "Record the best moment from this project",
      challenges: "Challenges",
      challengesPlaceholder: "Record the challenges you faced in this project",
      learnings: "Learnings",
      learningsPlaceholder: "Record what you learned from this project",
      nextSteps: "Next Steps",
      nextStepsPlaceholder: "Record what you'll do next based on this project",
      rating: "Rating",
      ratingPlaceholder: "Rate your satisfaction with this project",
      save: "Save Retrospective",
      cancel: "Cancel",
      validation: {
        bestMomentRequired: "Please enter your best moment",
        challengesRequired: "Please enter challenges",
        learningsRequired: "Please enter learnings",
        nextStepsRequired: "Please enter next steps",
      },
    },
  },
} as const;
