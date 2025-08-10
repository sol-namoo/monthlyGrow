export const para = {
  title: "PARA System",
  tabs: {
    projects: "Projects",
    areas: "Areas",
    resources: "Resources",
    archives: "Archives",
  },
  projects: {
    description: "Manage projects to achieve your goals",
    newProject: "New Project",
    filter: {
      all: "All",
      allWithCount: "All ({count})",
      planned: "Planned",
      plannedWithCount: "Planned ({count})",
      inProgress: "In Progress",
      inProgressWithCount: "In Progress ({count})",
      completed: "Completed",
      completedWithCount: "Completed ({count})",
    },
    sort: {
      latest: "Latest",
      oldest: "Oldest",
      name: "Name",
    },
    status: {
      planned: "Planned",
      inProgress: "In Progress",
      completed: "Completed",
      overdue: "Overdue",
    },
    uncategorized: "Uncategorized",
    noProjects: {
      title: "No projects",
      description: "Create a new project to achieve your goals",
      button: "Create Project",
    },
    loading: "Loading projects...",
    loadMore: "Load more",
  },
  areas: {
    description: "Manage areas of interest systematically",
    count: "Total {count} areas",
    newArea: "New Area",
    projectCount: "{count} projects",
    resourceCount: "{count} resources",
    noAreas: {
      title: "No areas",
      description: "Create a new area to manage systematically",
      button: "Create Area",
    },
    // Area detail page
    detail: {
      title: "Area Detail",
      connectedProjects: "Connected Projects",
      connectedResources: "Connected Resources",
      noConnectedProjects: "No connected projects",
      noConnectedResources: "No connected resources",
      delete: {
        title: "Delete Area",
        description: "Are you sure you want to delete this area?",
        withItems: "Delete connected projects and resources",
        warning:
          "All connected projects and resources will be deleted. This action cannot be undone",
      },
      error: {
        loadError: "An error occurred while loading the area. Please try again",
        notFound: "Area not found",
      },
      success: {
        deleteComplete: "Area deleted",
        deleteWithItems: "Area and all connected items have been deleted",
        deleteWithoutItems:
          "Area has been deleted. Connected projects and resources are maintained",
      },
      error: {
        deleteFailed: "Delete failed",
        deleteError: "Failed to delete area",
      },
    },
    // Area create/edit page
    form: {
      title: "Create Area",
      description: "Create a new area",
      explanation:
        "Areas are criteria for systematically categorizing and managing projects and resources. Create your own area",
      name: "Area Name",
      namePlaceholder: "Enter area name",
      description: "Area Description",
      descriptionPlaceholder: "Describe what you want to manage in this area",
      color: "Color",
      icon: "Icon",
      template: {
        title: "Area Name",
        message: "Select frequently used area templates to set up quickly",
      },
      submit: "Create Area",
      submitting: "Creating...",
      success: {
        title: "Area Created",
        description: "{name} area has been created",
      },
      error: {
        title: "Area Creation Failed",
        description: "An error occurred while creating the area",
      },
      validation: {
        nameRequired: "Please enter area name",
        descriptionRequired: "Please enter area description",
      },
    },
  },
  resources: {
    description: "Store useful information and resources",
    count: "Total {count} resources",
    newResource: "New Resource",
    sort: {
      latest: "Latest",
      oldest: "Oldest",
      name: "Name",
    },
    noResources: {
      title: "No resources",
      description: "Add new resources to manage information systematically",
      button: "Add Resource",
    },
    // Resource detail page
    detail: {
      title: "Resource Detail",
      link: "Link",
      content: "Content",
      delete: {
        title: "Delete Resource",
        description:
          "Are you sure you want to delete this resource? This action cannot be undone",
      },
      error: {
        loadError:
          "An error occurred while loading the resource. Please try again",
        notFound: "Resource not found",
        deleteError: "Failed to delete resource",
      },
    },
    // Resource create/edit page
    form: {
      title: "Create Resource",
      description: "Create a new resource",
      explanation:
        "Resources are places to store useful information and materials. Create your own resource",
      name: "Resource Name",
      namePlaceholder: "Enter resource name",
      description: "Resource Description",
      descriptionPlaceholder: "Enter description for this resource",
      link: "Link",
      linkPlaceholder: "https://example.com",
      text: "Content",
      textPlaceholder: "Enter resource content",
      area: "Area",
      areaPlaceholder: "Select an area",
      submit: "Create Resource",
      submitting: "Creating...",
      success: {
        title: "Resource Created",
        description: "{name} resource has been created",
      },
      error: {
        title: "Resource Creation Failed",
        description: "An error occurred while creating the resource",
      },
      validation: {
        nameRequired: "Please enter resource name",
        descriptionRequired: "Please enter resource description",
      },
    },
  },
  archives: {
    description: "Store completed items",
    count: "Total {count} archives",
    sort: {
      latest: "Latest",
      oldest: "Oldest",
      name: "Name",
    },
    noArchives: {
      title: "No archives",
      description: "Completed items will be displayed here",
    },
    // Archive detail page
    detail: {
      title: "Archive Detail",
      tabs: {
        official: "Official Retrospective",
        freeform: "Freeform Retrospective",
      },
      error: {
        loadError:
          "An error occurred while loading the retrospective. Please try again",
        notFound: "Retrospective not found",
      },
    },
  },
  // Archive detail page related translation keys
  paraArchiveDetail: {
    tabs: {
      retrospective: "Retrospective",
      note: "Note",
    },
    relatedItem: {
      chapter: "Connected Chapter",
      project: "Connected Project",
      chapterDescription:
        "This is the chapter where this retrospective was written",
      projectDescription:
        "This is the project where this retrospective was written",
      viewChapter: "View Chapter",
      viewProject: "View Project",
    },
    retrospective: {
      bestMoment: "Best Moment",
      routineAdherence: "Routine Adherence",
      unexpectedObstacles: "Unexpected Obstacles",
      nextChapterApplication: "Next Chapter Application",
      note: "Note",
    },
    notes: {
      noContent: "No note content",
    },
  },
} as const;
