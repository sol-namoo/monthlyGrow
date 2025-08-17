export const monthly = {
  title: "Monthlies",
  uncategorized: "Uncategorized",
  viewProjects: "View Projects",
  completedTasksCount: "{count} completed",
  tabs: {
    current: "Current",
    future: "Planned",
    past: "Past",
  },
  currentMonthly: {
    title: "Current Monthly Summary",
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
    noMonthly: {
      title: "No Current Monthly",
      description: "Create a new monthly to set and achieve your goals",
      button: "Create Monthly",
    },
    addedMidway: "Added Midway",
    viewDetails: "View Details",
    projectList: "Project List",
    projectCount: "Projects ({count})",
    noProjectsTitle: "No Projects",
    noProjectsDescription: "Add projects to this monthly",
    aiPlanGenerator: "Generate Plan with AI",
    manualAddProject: "Add Project Manually",
    areaSuffix: "Area",
    keyResultsTitle: "Key Metrics",
    keyResultsCount: "Key Metrics ({completed}/{total})",
    noKeyResults: "No Key Metrics Set",
    keyResultCompleted: "Completed",
    keyResultInProgress: "In Progress",
    objective: "Objective",
  },
  futureMonthlies: {
    reward: "Reward",
    target: "Target",
    targetCount: "Target: {count}",
    connectedProjects: "{count} connected",
    noProjects: "No projects connected",
    totalCount: "Total {count} future monthlies",
    button: "Create Monthly",
    keyResults: "Key Results",
    keyResultsCount: "{count}",
    noMonthlies: {
      title: "No Future Monthlies",
      description: "Plan new monthlies for your future goals",
      button: "Create Monthly",
    },
  },
  pastMonthlies: {
    achievement: "Achievement: {rate}%",
    totalCount: "Total {count} completed monthlies",
    completionRate: "Completion Rate",
    connectedProjects: "{count} connected",
    keyResults: "Key Results",
    keyResultsCount: "{completed}/{total}",
    status: {
      completed: "Completed",
      planned: "Planned",
      allCompleted: "Completed",
      partiallyCompleted: "Partial",
    },
    noMonthlies: {
      title: "No Completed Monthlies",
      description: "Completed monthlies will appear here",
    },
  },
} as const;

export const monthlyDetail = {
  title: "Monthly Detail",
  uncategorized: "Uncategorized",
  viewProjects: "View Projects",
  keyResult: "Key Result",
  completedTasksCount: "{count} completed",
  completedTasks: {
    noTasks: {
      title: "No Completed Tasks",
      description: "No tasks have been completed this month yet.",
      plannedDescription: "This monthly has not started yet.",
      hint: "Check your tasks in projects!",
    },
  },
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
    loading: "An error occurred while loading the monthly. Please try again.",
    notFound: "Monthly not found.",
  },
  noConnectedProjects: "No projects connected to this monthly",
  keyResults: {
    noKeyResults: "No Key Results",
    noKeyResultsDescription: "Set key objectives for this monthly",
    addKeyResult: "Add Key Result",
    status: {
      completed: "Completed",
      planned: "Planned",
      inProgress: "In Progress",
    },
  },

  noProjectsForCompletionRateDescription:
    "Cannot measure completion rate without connected projects",
  connectProjectsHint: 'Use the "Edit" button at the top to connect projects',
  noFocusAreas: "No focus areas have been set.",
  connectedProjects: "Connected Projects",
  tabs: {
    keyResults: "Results",
    completedTasks: "Tasks",
    retrospective: "Retro",
    note: "Notes",
    keyResultsFull: "Key Results",
    completedTasksFull: "Completed Tasks",
    retrospectiveFull: "Retrospective",
    noteFull: "Notes",
  },
  note: {
    title: "Monthly Notes",
    edit: "Edit Note",
    add: "Add Note",
    noNote: "No notes written yet",
    description: "Record your thoughts and learnings from this monthly",
    addButton: "Write Note",
    placeholder: "Write today's note...",
    save: "Save",
    editTitle: "Edit Monthly Note",
    addTitle: "Write Monthly Note",
    descriptionText:
      "Freely record your thoughts and learnings during the monthly.",
    saveSuccess: "Note saved successfully",
    saveSuccessDescription: "Note has been saved successfully.",
    saveError: "Failed to save note",
    saveErrorDescription: "An error occurred while saving the note.",
    contentRequired: "Failed to save note",
    contentRequiredDescription: "Please enter note content.",
  },
  addProject: {
    title: "Add Project to Monthly",
    description:
      "Projects added mid-monthly are marked separately and aggregated as 'follow-up items' in monthly reports.",
    newProject: "Create New Project",
    existingProject: "Connect Existing Project",
    cancel: "Cancel",
  },
  retrospective: {
    title: "Write Monthly Retrospective",
    description: "Reflect on this monthly and plan for the next one.",
    noContent: "No retrospective written yet",
    inProgressDescription:
      "Cannot write retrospective while monthly is in progress",
    writeTitle: "Write Retrospective",
    notStarted: {
      title: "Monthly Not Started Yet",
      description:
        "You can write a retrospective once the monthly is in progress.",
    },
    bestMoment: {
      label: "What was the best moment of this monthly?",
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
    nextMonthlyApplication: {
      label: "What will you apply to the next monthly?",
      placeholder: "e.g., Include weekend routines in the next monthly plan",
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
      "There are incomplete projects in this monthly. Would you like to move them to another monthly?",
    incompleteProjects: "Incomplete Projects ({count})",
    selectTarget: "Select Target Monthly",
    selectPlaceholder: "Select a monthly",
    inProgress: "In Progress",
    planned: "Planned",
    noAvailableMonthlies:
      "💡 No available monthlies to move to. Please create a new monthly first.",
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
    title: "Monthly Deletion",
    description:
      "Are you sure you want to delete this monthly? This action cannot be undone.",
    completedDescription:
      "Are you sure you want to delete this monthly? Deleted data will still be reflected in annual statistics.",
    activeDescription:
      "Are you sure you want to delete this monthly? Connected projects and tasks will also be deleted.",
    confirm: "Delete",
    cancel: "Cancel",
    success: {
      title: "Monthly Deletion Complete",
      description: "Monthly has been successfully deleted.",
    },
    error: {
      title: "Monthly Deletion Failed",
      description: "An error occurred while deleting the monthly.",
    },
  },
} as const;

export const monthlyEdit = {
  title: "Edit Monthly",
  validation: {
    title: "Validation Error",
    titleRequired: "Please enter a monthly title",
    objectiveRequired: "Please enter an objective.",
    minKeyResults: "Please add at least 1 Key Result.",
    keyResultRequired: "Please enter titles for all Key Results.",
  },
  error: {
    loading: "An error occurred while loading monthly information",
    notFound: "Monthly not found",
    notFoundDescription:
      "The requested monthly does not exist or has been deleted.",
    backToList: "Back to Monthly List",
    completed:
      "Completed monthlies cannot be edited. Please create a new monthly.",
  },
  success: {
    title: "Monthly Edit Complete",
    description: "Monthly has been successfully updated",
  },
  basicInfo: {
    title: "Basic Information",
    monthlyTitle: "Monthly Title",
    monthlyTitlePlaceholder: "e.g., January Health Monthly",
    reward: "Achievement Reward",
    rewardPlaceholder: "e.g., Buy new sneakers",
    rewardHint: "💡 Set a reward for yourself when you complete the monthly",
    startDate: "Start Date",
    endDate: "End Date",
    dateHint: "Monthly period cannot be modified",
    endDateHint: "Until the last day of the month",
    recommendation:
      "Monthly title, reward, and focus areas can be modified at any time",
  },
  focusAreas: {
    title: "Focus Areas",
    description: "Select areas to focus on in this monthly",
    noAreas: "No areas created yet",
    createArea: "Create Area",
    areaHint: "Creating areas helps you manage more systematically",
  },
  projects: {
    title: "Connect Projects",
    description:
      "Select projects to connect to this monthly or create new projects. Projects can be added later",
    selectExisting: "Select Existing Project",
    createNew: "Create New Project",
    connectedProjects: "Connected Projects",
    noConnectedProjects: "No projects connected yet",
    recommendation:
      "Recommendation: Focusing on 2-3 projects can increase monthly effectiveness",
    warning: "Selecting too many projects can reduce focus",
    modal: {
      title: "Add/Remove Projects",
      description:
        "Select projects to connect to this monthly. You can connect up to 5 projects",
      search: "Search Projects",
      searchPlaceholder: "Search by project title...",
      connected: "Connected",
      noDescription: "No description",
    },
    newProject: {
      title: "Create New Project",
      description:
        "Go to the project creation page to create a new project, then return to this monthly edit page to connect it",
      note: "Note",
      noteDescription:
        "Current monthly information is saved, so you can safely navigate away",
    },
  },
  save: "Save Changes",
  saving: "Saving...",
} as const;

export const monthlyNew = {
  title: "Create Monthly",
  validation: {
    titleRequired: "Please enter a monthly title",
    rewardRequired: "Please enter a reward",
    monthRequired: "Please select a month",
    startDateRequired: "Please enter a start date",
    endDateRequired: "Please enter an end date",
    areasRequired: "Please select focus areas",
  },
  loginRequired: {
    title: "Login Required",
    description: "You need to log in to create a monthly",
  },
  basicInfo: {
    title: "Basic Information",
    monthSelection: "Select Monthly Month",
    monthPlaceholder: "Select the month for your monthly",
    monthlyTitle: "Monthly Title",
    monthlyTitlePlaceholder: "e.g., January Health Monthly",
    reward: "Achievement Reward",
    rewardPlaceholder: "e.g., Buy new sneakers",
    rewardHint:
      "💡 Default reward settings are disabled. Enable them in settings to automatically fill rewards when creating new monthlies",
    startDate: "Start Date",
    endDate: "End Date",
    dateHint: "Monthlies are set on a monthly basis",
    endDateHint: "Until the last day of the month",
  },
  focusAreas: {
    title: "Focus Areas",
    description: "Select areas to focus on in this monthly",
    noAreas: "No areas created yet",
    createArea: "Create Area",
    areaHint: "Creating areas helps you manage more systematically",
    maxAreas: "You can select as many as you want",
    recommendation:
      "Recommendation: Focusing on 2 areas can increase monthly effectiveness",
    warning: "Selecting too many areas can reduce focus",
  },
  projects: {
    title: "Connect Projects",
    description:
      "Select projects to connect to this monthly or create new projects. Projects can be added later",
    selectExisting: "Select Existing Project",
    createNew: "Create New Project",
    connectedProjects: "Connected Projects",
    noConnectedProjects: "No projects connected yet",
    recommendation:
      "Recommendation: Focusing on 2-3 projects can increase monthly effectiveness",
    warning: "Selecting too many projects can reduce focus",
    modal: {
      title: "Create New Project",
      description:
        "Would you like to create a new project and connect it to the monthly?",
      createNew: "Create New Project",
      createDescription:
        "Go to the project creation page to create a new project, then return to this monthly page to connect it",
      note: "Note",
      noteDescription:
        "Current monthly information is saved, so you can safely navigate away",
      cancel: "Cancel",
      viewProjects: "View Existing Projects",
    },
    newProjectDialog: {
      title: "Create New Project",
      description:
        "Would you like to create a new project and connect it to the monthly?",
      createNew: "Create New Project",
      createDescription:
        "Go to the project creation page to create a new project, then return to this monthly page to connect it",
      note: "Note",
      noteDescription:
        "Current monthly information is saved, so you can safely navigate away",
      cancel: "Cancel",
      viewProjects: "View Existing Projects",
    },
  },
  duplicateMonthly: {
    title: "Existing Monthly Found",
    description:
      "A monthly already exists for the selected month. Would you like to replace the existing monthly with a new one?",
    existingMonthlyInfo: "Existing Monthly Information",
    titleLabel: "Title",
    periodLabel: "Period",
    connectedProjectsLabel: "Connected Projects",
    projectsCount: "0 projects",
    tip: "Connected projects will not be deleted, only the monthly connection will be removed",
    warning:
      "The existing monthly will be deleted when you click 'Create Monthly'",
    cancel: "Cancel",
    replace: "Replace Existing Monthly and Continue",
  },
  monthLimit: "Monthlies can only be created up to 6 months in the future",
  monthSelection: {
    current: "Current",
    next: "Next",
    hint: "💡 Monthlies can be created up to 6 months in the future",
    limitTitle: "Month Selection Restricted",
    limitDescription:
      "This month cannot be selected due to an existing monthly. Please select a different month",
  },
  finalConfirm: {
    title: "Monthly Creation Confirmation",
    description:
      "There is an existing monthly for the selected month or you previously cancelled this month. Are you sure you want to create the monthly?",
    warning:
      "⚠️ If there is an existing monthly, it will be deleted and a new monthly will be created",
    cancel: "Cancel",
    confirm: "Confirm, Create Monthly",
  },
  noAreas: {
    title: "No Activity Areas Registered",
    description:
      "To create a monthly, you need to register activity areas (Areas) first. Create areas for health, career, self-development, or other areas of interest",
    createArea: "Create Area",
    viewPara: "View PARA System",
  },
  success: {
    title: "Monthly Creation Complete",
    description: "Monthly has been created",
    projectCreated: "Project Creation Complete",
    projectCreatedDescription:
      "The newly created project has been added to the list. Check it in the project selection",
    existingMonthlyDeleted: {
      title: "Existing Monthly Replacement Ready",
      description:
        "Click 'Create Monthly' to delete the existing monthly and create a new one",
    },
    existingMonthlyDeletedDescription: "{title} has been deleted",
  },
  error: {
    title: "Monthly Creation Failed",
    description: "An error occurred while creating the monthly",
  },
  createMonthly: "Create Monthly",
  // Monthly creation page
  new: {
    title: "Create New Monthly",
    description: "Create a new monthly to set and achieve your goals",
    basicInfo: {
      title: "Basic Information",
      monthSelection: "Month Selection",
      monthPlaceholder: "Select a month",
    },
    form: {
      title: "Title",
      titlePlaceholder: "e.g., August 2024",
      objective: "Objective",
      objectivePlaceholder: "e.g., Significantly improve customer satisfaction",
      startDate: "Start Date",
      endDate: "End Date",
      reward: "Reward (Optional)",
      rewardPlaceholder: "Reward for achieving the goal",
      keyResults: "Key Results",
      keyResultsDescription:
        "Set specific and achievable metrics to measure goal achievement",
      keyResultTitle: "Key Result Title",
      keyResultTitlePlaceholder:
        "e.g., Exercise 30 minutes daily, Read 3 times a week, Blog posting twice a week",
      keyResultDescription: "Description (Optional)",
      keyResultDescriptionPlaceholder:
        "Enter detailed description of the objective",
      addKeyResult: "Add Key Result",
      removeKeyResult: "Remove Key Result",
      keyResultsGuide:
        "💡 It's recommended to set 3-5 key results per month. Too many can reduce focus.",
      keyResultsGuideEdit:
        "💡 It's recommended to set 3-5 key results per month. Too many can reduce focus.",
    },
    validation: {
      titleRequired: "Please enter a title",
      objectiveRequired: "Please enter an objective",
      startDateRequired: "Please select a start date",
      endDateRequired: "Please select an end date",
      keyResultRequired: "Please enter a key metric title",
      minKeyResults: "Please add at least 1 key metric",
    },
    existingMonthly: {
      title: "Existing Monthly Found",
      description:
        "A monthly already exists for the selected month. Would you like to replace it?",
      replace: "Replace Existing Monthly",
      cancel: "Cancel",
    },
    success: {
      title: "Monthly Created Successfully",
      description: "New monthly has been created successfully",
    },
    error: {
      title: "Monthly Creation Failed",
      description: "An error occurred while creating the monthly",
    },
  },
  // Monthly edit page
  edit: {
    title: "Edit Monthly",
    description: "Edit monthly information",
    basicInfo: {
      title: "Basic Information",
      monthSelection: "Month Selection",
      monthPlaceholder: "Select a month",
    },
    form: {
      title: "Title",
      titlePlaceholder: "e.g., August 2024",
      objective: "Objective",
      objectivePlaceholder: "e.g., Significantly improve customer satisfaction",
      startDate: "Start Date",
      endDate: "End Date",
      reward: "Reward (Optional)",
      rewardPlaceholder: "Reward for achieving the goal",
      keyResults: "Key Results",
      keyResultsDescription:
        "Set specific and achievable metrics to measure goal achievement",
      keyResultTitle: "Key Result Title",
      keyResultTitlePlaceholder:
        "e.g., Exercise 30 minutes daily, Read 3 times a week, Blog posting twice a week",
      keyResultDescription: "Description (Optional)",
      keyResultDescriptionPlaceholder:
        "Enter detailed description of the objective",
      addKeyResult: "Add Key Result",
      removeKeyResult: "Remove Key Result",
    },
    validation: {
      titleRequired: "Please enter a title",
      objectiveRequired: "Please enter an objective",
      startDateRequired: "Please select a start date",
      endDateRequired: "Please select an end date",
      keyResultRequired: "Please enter a key metric title",
    },
    success: {
      title: "Monthly Updated Successfully",
      description: "Monthly has been updated successfully",
    },
    error: {
      title: "Monthly Update Failed",
      description: "An error occurred while updating the monthly",
    },
  },
  // Monthly detail page
  detail: {
    notFound: {
      title: "Monthly Not Found",
      description: "The requested monthly does not exist or has been deleted",
      backToList: "Back to Monthly List",
    },
    loading: {
      title: "Loading Monthly",
      description: "Loading monthly information",
    },
    actions: {
      edit: "Edit",
      delete: "Delete",
      back: "Back",
      editTooltip: "Edit Monthly",
      deleteTooltip: "Delete Monthly",
    },
    delete: {
      title: "Delete Monthly",
      description:
        "Are you sure you want to delete this monthly? This action cannot be undone",
      confirm: "Delete",
      cancel: "Cancel",
      success: {
        title: "Monthly Deleted Successfully",
        description: "Monthly has been deleted successfully",
      },
      error: {
        title: "Monthly Deletion Failed",
        description: "An error occurred while deleting the monthly",
      },
    },
    keyResult: {
      update: {
        success: {
          title: "Key Metric Updated Successfully",
          description: "Key metric has been updated successfully",
        },
        error: {
          title: "Key Metric Update Failed",
          description: "An error occurred while updating the key metric",
        },
      },
    },
  },
} as const;
