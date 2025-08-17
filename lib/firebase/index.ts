// Firebase 설정 및 초기화
export { db, auth, googleAuthProvider, storage } from "./config";

// 유틸리티 함수들
export {
  createTimestamp,
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";

// Area 관련 함수들
export {
  fetchAllAreasByUserId,
  fetchActiveAreasByUserId,
  fetchArchivedAreasByUserId,
  fetchAreaById,
  createArea,
  getOrCreateUncategorizedArea,
  updateArea,
  deleteAreaById,
} from "./areas";

// Resource 관련 함수들
export {
  fetchAllResourcesByUserId,
  fetchActiveResourcesByUserId,
  fetchArchivedResourcesByUserId,
  fetchResourceById,
  fetchResourceWithAreaById,
  fetchUncategorizedResourcesByUserId,
  createResource,
  updateResource,
  deleteResourceById,
} from "./resources";

// Project 관련 함수들
export {
  fetchAllProjectsByUserId,
  fetchActiveProjectsByUserId,
  fetchArchivedProjectsByUserId,
  fetchProjectById,
  fetchProjectsByAreaId,
  createProject,
  updateProject,
  deleteProjectById,
  updateProjectConnectedMonthlies,
} from "./projects";

// Task 관련 함수들
export {
  fetchAllTasksByUserId,
  fetchAllTasksByProjectId,
  getTaskCountsByProjectId,
  getTaskCountsForMultipleProjects,
  getTaskTimeStatsByProjectId,
  fetchTaskById,
  createTask,
  updateTask,
  addTaskToProject,
  updateTaskInProject,
  deleteTaskFromProject,
  toggleTaskCompletion,
  toggleTaskCompletionInSubcollection,
  getTodayTasks,
  getCompletedTasksByMonthlyPeriod,
} from "./tasks";

// Monthly 관련 함수들
export {
  fetchAllMonthliesByUserId,
  fetchRecentMonthliesByUserId,
  fetchMonthlyById,
  findMonthlyByMonth,
  findIncompleteProjectsInMonthly,
  moveProjectToMonthly,
  createMonthly,
  updateMonthly,
  checkMonthlyExists,
  deleteMonthlyById,
  fetchProjectsByMonthlyId,
  fetchCurrentMonthlyProjects,
  fetchMonthliesByIds,
} from "./monthlies";

// User 관련 함수들
export {
  fetchUserById,
  createUser,
  updateUserProfile,
  updateUserSettings,
  updateUserPreferences,
  updateUserDisplayName,
  uploadProfilePicture,
  deleteProfilePicture,
  updateUserProfilePicture,
} from "./users";

// Analytics 관련 함수들
export {
  fetchActiveProjects,
  fetchCompletedProjects,
  getTodayDeadlineProjects,
  fetchYearlyActivityStats,
  fetchProjectsByUserIdWithPaging,
  fetchResourcesByUserIdWithPaging,
  fetchResourcesWithAreasByUserIdWithPaging,
  fetchAreaCountsByUserId,
  fetchArchivesByUserIdWithPaging,
  fetchProjectCountByUserId,
  fetchResourceCountByUserId,
  fetchArchiveCountByUserId,
} from "./analytics";

// Retrospective 관련 함수들
export {
  fetchAllRetrospectivesByUserId,
  fetchRetrospectiveById,
  fetchRetrospectivesByMonthlyId,
  fetchRetrospectivesByProjectId,
  createRetrospective,
  updateRetrospective,
} from "./retrospectives";

// Note 관련 함수들
export { createNote, updateNote } from "./notes";
