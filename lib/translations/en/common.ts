export const common = {
  type: "Type",
  status: "Status",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",
  confirm: "Confirm",
  noSearchResults: "No search results found.",
  progress: "Progress",
  area: "Area",
  category: "Category",
  target: "Target",
  uncategorized: "Uncategorized",
  monthlyGoal: "This Monthly Goal",
  projectProgress: "Overall Progress",
  errors: {
    loginRequired: "Login required.",
    unexpectedResponse: "Unexpected response from server.",
    serviceError: "Service error occurred.",
  },
} as const;

export const bottomNav = {
  home: "Home",
  monthly: "Monthly",
  para: "PARA",
  settings: "Settings",
} as const;

export const theme = {
  light: "Light",
  dark: "Dark",
  system: "System",
  mobileNotice:
    "May not apply depending on device settings such as power saving mode",
} as const;

export const language = {
  korean: "한국어",
  english: "English",
} as const;

export const pageLoading = {
  navigating: "Navigating...",
  loading: "Please wait...",
  processing: "Processing...",
  saving: "Saving...",
  updating: "Updating...",
  deleting: "Deleting...",
  creating: "Creating...",
  analyzing: "Analyzing...",
  connecting: "Connecting...",
} as const;

export const noteForm = {
  title: "Write Note",
  content: "Note Content",
  placeholder: "Write what you want to record",
  contentRequired: "Please enter note content",
  save: "Save",
  cancel: "Cancel",
} as const;

export const charts = {
  areaActivity: "Area Activity",
  completionRate: "Completion Rate",
  focusTime: "Focus Time",
  monthlyComparison: "Monthly Comparison",
  monthlyProgress: "Monthly Progress",
  yearlyStats: "Yearly Statistics",
  projectStatus: "Project Status",
  taskProgress: "Task Progress",
} as const;
