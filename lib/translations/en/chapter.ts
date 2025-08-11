export const chapter = {
  title: "Chapters",
  tabs: {
    current: "Current",
    future: "Future",
    past: "Completed",
  },
  currentChapter: {
    title: "Current Chapter Summary",
    status: {
      inProgress: "In Progress",
      completed: "Completed",
    },
    reward: "Reward",
    noReward: "No Reward",
    progress: "Progress",
    progressSuffix: "%",
    daysLeft: "D-",
    completionRate: "Completion Rate",
    focusAreas: "Focus Areas",
    projects: "Projects",
    projectsConnected: "{count} projects connected",
    noProjects: "No projects connected",
    noChapter: {
      title: "No Current Chapter",
      description: "Create a new chapter to set and achieve your goals",
      button: "Create Chapter",
    },
    addedMidway: "Added Midway",
    viewDetails: "View Details",
    projectList: "Project List",
    projectCount: "Projects ({count})",
    noProjectsTitle: "No Projects",
    noProjectsDescription: "Add projects to this chapter",
    aiPlanGenerator: "Generate Plan with AI",
    manualAddProject: "Add Project Manually",
    areaSuffix: "Area",
  },
  futureChapters: {
    reward: "Reward",
    target: "Target",
    targetCount: "Target: {count}",
    connectedProjects: "{count} connected",
    noProjects: "No projects connected",
    totalCount: "Total {count} future chapters",
    button: "Create Chapter",
    noChapters: {
      title: "No Future Chapters",
      description: "Plan new chapters for your future goals",
      button: "Create Chapter",
    },
  },
  pastChapters: {
    achievement: "Achievement: {rate}%",
    totalCount: "Total {count} completed chapters",
    completionRate: "Completion Rate",
    connectedProjects: "{count} connected",
    noChapters: {
      title: "No Completed Chapters",
      description: "Completed chapters will appear here",
    },
  },
} as const;

export const chapterDetail = {
  title: "Chapter Detail",
  reward: "Reward",
  noReward: "No Reward",
  completionRate: "Completion Rate",
  noProjectsForCompletionRate:
    "Cannot measure completion rate without connected projects",
  focusAreas: "Focus Areas",
  connectedArea: "Connected Area",
  createdAt: "Created At",
  updatedAt: "Updated At",
  taskList: "Task List",
  add: "Add",
  project: {
    status: {
      undefined: "Undefined",
      planned: "Planned",
      inProgress: "In Progress",
      completed: "Completed",
      overdue: "Overdue",
    },
    duration: {
      undefined: "Duration Undefined",
    },
  },
  error: {
    loading: "An error occurred while loading the chapter. Please try again.",
    notFound: "Chapter not found.",
  },
  noConnectedProjects: "No projects connected to this chapter",
  noProjectsForCompletionRateDescription:
    "Cannot measure completion rate without connected projects",
  connectProjectsHint: 'Use the "Edit" button at the top to connect projects',
  noFocusAreas: "No focus areas have been set.",
  connectedProjects: "Connected Projects",
  tabs: {
    retrospective: "Retrospective",
    note: "Notes",
  },
  note: {
    title: "Chapter Notes",
    edit: "Edit Note",
    add: "Add Note",
    noNote: "No notes written yet",
    description: "Record your thoughts and learnings from this chapter",
    addButton: "Write Note",
    placeholder: "Write today's note...",
    save: "Save",
    editTitle: "Edit Chapter Note",
    addTitle: "Write Chapter Note",
    descriptionText:
      "Freely record your thoughts and learnings during the chapter.",
    saveSuccess: "Note saved successfully",
    saveSuccessDescription: "Note has been saved successfully.",
    saveError: "Failed to save note",
    saveErrorDescription: "An error occurred while saving the note.",
    contentRequired: "Failed to save note",
    contentRequiredDescription: "Please enter note content.",
  },
  addProject: {
    title: "Add Project to Chapter",
    description:
      "Projects added mid-chapter are marked separately and aggregated as 'follow-up items' in monthly reports.",
    newProject: "Create New Project",
    existingProject: "Connect Existing Project",
    cancel: "Cancel",
  },
  retrospective: {
    title: "Write Monthly Retrospective",
    description: "Reflect on this chapter and plan for the next one.",
    noContent: "No retrospective written yet",
    inProgressDescription:
      "Cannot write retrospective while chapter is in progress",
    writeTitle: "Write Retrospective",
    bestMoment: {
      label: "What was the best moment of this chapter?",
      placeholder: "e.g., The moment I felt good after exercising",
    },
    routineAdherence: {
      label: "How well did you stick to your planned routine?",
      placeholder: "e.g., 80% on weekdays, 60% on weekends",
    },
    unexpectedObstacles: {
      label: "Were there any unexpected obstacles?",
      placeholder: "e.g., Sleeping in on weekends",
    },
    nextChapterApplication: {
      label: "What will you apply to the next chapter?",
      placeholder: "e.g., Include weekend routines in the next chapter plan",
    },
    helpful: {
      label: "Was this retrospective helpful to you?",
    },
    bookmark: {
      label: "Mark as a retrospective to read again",
      description:
        "Important retrospectives can be bookmarked for easy access later",
    },
    save: "Save Retrospective",
  },
  projectMigration: {
    title: "Incomplete Projects Found",
    description:
      "There are incomplete projects in this chapter. Would you like to move them to another chapter?",
    incompleteProjects: "Incomplete Projects ({count})",
    selectTarget: "Select Target Chapter",
    selectPlaceholder: "Select a chapter",
    inProgress: "In Progress",
    planned: "Planned",
    noAvailableChapters:
      "💡 No available chapters to move to. Please create a new chapter first.",
    later: "Handle Later",
    migrate: "Move Projects",
    success: {
      title: "Project Migration Complete",
      description: "{count} projects have been successfully moved.",
    },
    error: {
      title: "Project Migration Failed",
      description: "An error occurred while moving projects.",
    },
  },
  delete: {
    title: "Chapter Deletion",
    description:
      "Are you sure you want to delete this chapter? This action cannot be undone.",
    completedDescription:
      "Are you sure you want to delete this chapter? Deleted data will still be reflected in annual statistics.",
    activeDescription:
      "Are you sure you want to delete this chapter? Connected projects and tasks will also be deleted.",
    success: {
      title: "Chapter Deletion Complete",
      description: "Chapter has been successfully deleted.",
    },
    error: {
      title: "Chapter Deletion Failed",
      description: "An error occurred while deleting the chapter.",
    },
  },
} as const;

export const chapterEdit = {
  title: "Edit",
  validation: {
    title: "Validation Error",
    titleRequired: "Please enter a chapter title",
  },
  error: {
    loading: "An error occurred while loading chapter information",
    notFound: "Chapter not found",
    completed: "Completed chapters cannot be edited",
  },
  success: {
    title: "Chapter Edit Complete",
    description: "Chapter has been successfully updated",
  },
  basicInfo: {
    title: "Basic Information",
    chapterTitle: "Chapter Title",
    chapterTitlePlaceholder: "e.g., January Health Chapter",
    reward: "Achievement Reward",
    rewardPlaceholder: "e.g., Buy new sneakers",
    rewardHint: "💡 Set a reward for yourself when you complete the chapter",
    startDate: "Start Date",
    endDate: "End Date",
    dateHint: "Chapter period cannot be modified",
    endDateHint: "Until the last day of the month",
    recommendation:
      "Chapter title, reward, and focus areas can be modified at any time",
  },
  focusAreas: {
    title: "Focus Areas",
    description: "Select areas to focus on in this chapter",
    noAreas: "No areas created yet",
    createArea: "Create Area",
    areaHint: "Creating areas helps you manage more systematically",
  },
  projects: {
    title: "Connect Projects",
    description:
      "Select projects to connect to this chapter or create new projects. Projects can be added later",
    selectExisting: "Select Existing Project",
    createNew: "Create New Project",
    connectedProjects: "Connected Projects",
    noConnectedProjects: "No projects connected yet",
    recommendation:
      "Recommendation: Focusing on 2-3 projects can increase chapter effectiveness",
    warning: "Selecting too many projects can reduce focus",
    modal: {
      title: "Add/Remove Projects",
      description:
        "Select projects to connect to this chapter. You can connect up to 5 projects",
      search: "Search Projects",
      searchPlaceholder: "Search by project title...",
      connected: "Connected",
      noDescription: "No description",
    },
    newProject: {
      title: "Create New Project",
      description:
        "Go to the project creation page to create a new project, then return to this chapter edit page to connect it",
      note: "Note",
      noteDescription:
        "Current chapter information is saved, so you can safely navigate away",
    },
  },
  save: "Save Changes",
  saving: "Saving...",
} as const;

export const chapterNew = {
  title: "Create Chapter",
  validation: {
    titleRequired: "Please enter a chapter title",
    rewardRequired: "Please enter a reward",
    monthRequired: "Please select a month",
    startDateRequired: "Please enter a start date",
    endDateRequired: "Please enter an end date",
    areasRequired: "Please select focus areas",
  },
  loginRequired: {
    title: "Login Required",
    description: "You need to log in to create a chapter",
  },
  basicInfo: {
    title: "Basic Information",
    monthSelection: "Select Chapter Month",
    monthPlaceholder: "Select the month for your chapter",
    chapterTitle: "Chapter Title",
    chapterTitlePlaceholder: "e.g., January Health Chapter",
    reward: "Achievement Reward",
    rewardPlaceholder: "e.g., Buy new sneakers",
    rewardHint:
      "💡 Default reward settings are disabled. Enable them in settings to automatically fill rewards when creating new chapters",
    startDate: "Start Date",
    endDate: "End Date",
    dateHint: "Chapters are set on a monthly basis",
    endDateHint: "Until the last day of the month",
  },
  focusAreas: {
    title: "Focus Areas",
    description: "Select areas to focus on in this chapter",
    noAreas: "No areas created yet",
    createArea: "Create Area",
    areaHint: "Creating areas helps you manage more systematically",
    maxAreas: "You can select as many as you want",
    recommendation:
      "Recommendation: Focusing on 2 areas can increase chapter effectiveness",
    warning: "Selecting too many areas can reduce focus",
  },
  projects: {
    title: "Connect Projects",
    description:
      "Select projects to connect to this chapter or create new projects. Projects can be added later",
    selectExisting: "Select Existing Project",
    createNew: "Create New Project",
    connectedProjects: "Connected Projects",
    noConnectedProjects: "No projects connected yet",
    recommendation:
      "Recommendation: Focusing on 2-3 projects can increase chapter effectiveness",
    warning: "Selecting too many projects can reduce focus",
    modal: {
      title: "Create New Project",
      description:
        "Would you like to create a new project and connect it to the chapter?",
      createNew: "Create New Project",
      createDescription:
        "Go to the project creation page to create a new project, then return to this chapter page to connect it",
      note: "Note",
      noteDescription:
        "Current chapter information is saved, so you can safely navigate away",
      cancel: "Cancel",
      viewProjects: "View Existing Projects",
    },
    newProjectDialog: {
      title: "Create New Project",
      description:
        "Would you like to create a new project and connect it to the chapter?",
      createNew: "Create New Project",
      createDescription:
        "Go to the project creation page to create a new project, then return to this chapter page to connect it",
      note: "Note",
      noteDescription:
        "Current chapter information is saved, so you can safely navigate away",
      cancel: "Cancel",
      viewProjects: "View Existing Projects",
    },
  },
  duplicateChapter: {
    title: "Existing Chapter Found",
    description:
      "A chapter already exists for the selected month. Would you like to replace the existing chapter with a new one?",
    existingChapterInfo: "Existing Chapter Information",
    titleLabel: "Title",
    periodLabel: "Period",
    connectedProjectsLabel: "Connected Projects",
    projectsCount: "0 projects",
    tip: "Connected projects will not be deleted, only the chapter connection will be removed",
    warning:
      "The existing chapter will be deleted when you click 'Create Chapter'",
    cancel: "Cancel",
    replace: "Replace Existing Chapter and Continue",
  },
  monthLimit: "Chapters can only be created up to 6 months in the future",
  monthSelection: {
    current: "Current",
    next: "Next",
    hint: "💡 Chapters can be created up to 6 months in the future",
    limitTitle: "Month Selection Restricted",
    limitDescription:
      "This month cannot be selected due to an existing chapter. Please select a different month",
  },
  finalConfirm: {
    title: "Chapter Creation Confirmation",
    description:
      "There is an existing chapter for the selected month or you previously cancelled this month. Are you sure you want to create the chapter?",
    warning:
      "⚠️ If there is an existing chapter, it will be deleted and a new chapter will be created",
    cancel: "Cancel",
    confirm: "Confirm, Create Chapter",
  },
  noAreas: {
    title: "No Activity Areas Registered",
    description:
      "To create a chapter, you need to register activity areas (Areas) first. Create areas for health, career, self-development, or other areas of interest",
    createArea: "Create Area",
    viewPara: "View PARA System",
  },
  success: {
    title: "Chapter Creation Complete",
    description: "Chapter has been created",
    projectCreated: "Project Creation Complete",
    projectCreatedDescription:
      "The newly created project has been added to the list. Check it in the project selection",
    existingChapterDeleted: {
      title: "Existing Chapter Replacement Ready",
      description:
        "Click 'Create Chapter' to delete the existing chapter and create a new one",
    },
    existingChapterDeletedDescription: "{title} has been deleted",
  },
  error: {
    title: "Chapter Creation Failed",
    description: "An error occurred while creating the chapter",
  },
  createChapter: "Create Chapter",
} as const;
