export const retrospective = {
  form: {
    title: "Write Retrospective",
    bestMoment: "Best Moment",
    bestMomentPlaceholder: "Record the best moment from this chapter",
    routineAdherence: "Routine Adherence",
    routineAdherencePlaceholder:
      "Record how well you followed your planned routine",
    unexpectedObstacles: "Unexpected Obstacles",
    unexpectedObstaclesPlaceholder:
      "Record unexpected difficulties you encountered",
    nextChapterApplication: "Next Chapter Application",
    nextChapterApplicationPlaceholder:
      "Record how you'll apply this experience to the next chapter",
    freeformContent: "Freeform Retrospective (Optional)",
    freeformContentPlaceholder:
      "Write any additional content you'd like to record freely",
    rating: "Rating",
    bookmarked: "Add to Bookmarks",
    save: "Save",
    cancel: "Cancel",
    validation: {
      bestMomentRequired: "Please enter your best moment",
      routineAdherenceRequired: "Please enter your routine adherence",
      unexpectedObstaclesRequired: "Please enter unexpected obstacles",
      nextChapterApplicationRequired: "Please enter next chapter application",
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
