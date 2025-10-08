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
  loading: "Loading...",
  loadingData: "Loading data...",
  loadingChart: "Preparing chart...",
  loginRequired: "Login required.",
  authError: "An error occurred while checking authentication status.",
  refresh: "Refresh",
  goToLogin: "Go to Login",
  errors: {
    loginRequired: "Login required.",
    unexpectedResponse: "Unexpected response from server.",
    serviceError: "Service error occurred.",
    // Firebase related error messages
    firebaseAuthPersistenceFailed: "Firebase Auth persistence configuration failed",
    // Data loading error messages
    resourceLoadFailed: "An error occurred while loading resource information.",
    activeResourceLoadFailed: "An error occurred while loading active resource information.",
    archivedResourceLoadFailed: "An error occurred while loading archived resource information.",
    uncategorizedResourceLoadFailed: "An error occurred while loading uncategorized resource information.",
    areaLoadFailed: "An error occurred while loading area information.",
    activeAreaLoadFailed: "An error occurred while loading active area information.",
    archivedAreaLoadFailed: "An error occurred while loading archived area information.",
    // Data creation/update/delete error messages
    resourceCreateFailed: "Failed to create resource.",
    resourceUpdateFailed: "Failed to update resource.",
    resourceDeleteFailed: "Failed to delete resource.",
    areaCreateFailed: "Failed to create area.",
    areaUpdateFailed: "Failed to update area.",
    areaDeleteFailed: "Failed to delete area.",
    uncategorizedAreaLoadFailed: "Failed to load/create uncategorized area",
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
  loading: "Loading...",
  loadMore: "Load More",
} as const;

export const charts = {
  areaActivity: "Area Activity",
  completionRate: "Completion Rate",
  focusTime: "Focus Time",
  focusTimeUnit: " hours",
  monthlyComparison: "Monthly Comparison",
  monthlyProgress: "Monthly Progress",
  yearlyStats: "Yearly Statistics",
  projectStatus: "Project Status",
  taskProgress: "Task Progress",
} as const;
