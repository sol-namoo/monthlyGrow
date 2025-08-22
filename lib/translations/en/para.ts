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
    targetCount: {
      label: "Target Count",
      placeholder: "Please enter target count",
      repetitive: "Target Count",
      taskBased: "Target Task Count",
      repetitivePlaceholder: "Target count (e.g., 30)",
      taskBasedPlaceholder: "Target task count (e.g., 10)",
      description: {
        repetitive:
          "Repetitive projects automatically generate tasks based on target count",
      },
      hint: {
        repetitive: "Enter target count to automatically generate tasks",
        setup: "Please set target count and project duration",
      },
      monthly: {
        label: "Monthly Target Count",
        recommended: "Recommended: {count}",
        current: "{current} / Total Tasks {total}",
        setToTotal: "Set to Total",
        setToRecommended: "Set to Recommended",
      },
    },
    filter: {
      all: "All",
      allWithCount: "All ({count})",
      planned: "Planned",
      plannedWithCount: "Planned ({count})",
      inProgress: "In Progress",
      inProgressWithCount: "In Progress ({count})",
      overdue: "Overdue",
      overdueWithCount: "Overdue ({count})",
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
      undefined: "No Status",
    },
    uncategorized: "Uncategorized",
    category: {
      repetitive: "Repetitive",
      taskBased: "Task-based",
    },
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
        deleteFailed: "Delete failed",
        deleteError: "Failed to delete area",
      },
      success: {
        deleteComplete: "Area deleted",
        deleteWithItems: "Area and all connected items have been deleted",
        deleteWithoutItems:
          "Area has been deleted. Connected projects and resources are maintained",
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
      descriptionLabel: "Area Description",
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
    other: "Other",
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
      noContent: "No link or content available",
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
      descriptionLabel: "Resource Description",
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
    // Resource add page
    add: {
      title: "Add Resource",
      description: "Add a new resource",
      explanation:
        "Resources are reference information, links, etc. for areas.",
      titleLabel: "Resource Title",
      titlePlaceholder: "e.g., Effective Time Management",
      areaLabel: "Area",
      areaPlaceholder: "Select an area",
      descriptionLabel: "Description (Optional)",
      descriptionPlaceholder:
        "Enter a brief description of the resource (displayed as preview in the list)",
      linkLabel: "Link (Optional)",
      linkPlaceholder: "https://example.com",
      contentLabel: "Content (Optional)",
      contentPlaceholder:
        "Enter detailed content of the resource (long text, notes, summary, etc.)",
      submit: "Create Resource",
      cancel: "Cancel",
      loading: "Creating resource...",
      success: {
        title: "Resource Created",
        description: "{title} resource has been created.",
      },
      error: {
        title: "Resource Creation Failed",
        description: "An error occurred while creating the resource.",
      },
      validation: {
        titleRequired: "Please enter resource title",
        urlInvalid: "Please enter a valid URL",
        areaRequired: "Please select an area",
      },
    },
    // Resource edit page
    edit: {
      title: "Edit Resource",
      description: "Edit the resource",
      explanation:
        "You can change the content or connected area of the resource to keep it up to date.",
      titleLabel: "Resource Title",
      titlePlaceholder: "e.g., Effective Time Management",
      areaLabel: "Area",
      areaPlaceholder: "Select an area",
      descriptionLabel: "Description (Optional)",
      descriptionPlaceholder:
        "Enter a brief description of the resource (displayed as preview in the list)",
      linkLabel: "Link (Optional)",
      linkPlaceholder: "https://example.com",
      contentLabel: "Content (Optional)",
      contentPlaceholder:
        "Enter detailed content of the resource (long text, notes, summary, etc.)",
      submit: "Edit Resource",
      submitting: "Editing...",
      cancel: "Cancel",
      success: {
        title: "Resource Updated",
        description: "Resource has been successfully updated.",
      },
      error: {
        title: "Resource Update Failed",
        description: "An error occurred while updating the resource.",
      },
      validation: {
        titleRequired: "Please enter resource title",
        urlInvalid: "Please enter a valid URL",
        areaRequired: "Please select an area",
      },
    },
  },
  archives: {
    description: "Store completed items",
    count: "Total {count} archives",
    filter: {
      all: "All",
      monthly: "Monthly",
      project: "Project",
      note: "Note",
    },
    sort: {
      latest: "Latest",
      oldest: "Oldest",
      name: "Name",
      rating: "Rating",
    },
    noArchives: {
      title: "No archives",
      description: "Completed items will be displayed here",
    },
    noTitle: "No title",
    noSummary: "No summary",
    loading: "Loading archives...",
    loadMore: "Load more",
    monthlyRetrospective: "Monthly Retrospective",
    projectRetrospective: "Project Retrospective",
    types: {
      monthlyRetrospective: "Monthly Retrospective",
      projectRetrospective: "Project Retrospective",
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
      monthly: "Connected Monthly",
      project: "Connected Project",
      monthlyDescription:
        "This is the monthly where this retrospective was written",
      projectDescription:
        "This is the project where this retrospective was written",
      viewMonthly: "View Monthly",
      viewProject: "View Project",
    },
    retrospective: {
      bestMoment: "Best Moment",
      routineAdherence: "Routine Adherence",
      unexpectedObstacles: "Unexpected Obstacles",
      nextMonthlyApplication: "Next Monthly Application",
      note: "Note",
    },
    notes: {
      noContent: "No note content",
    },
    // Project retrospective related fields
    projectRetrospective: {
      goalAchieved: "Goal Achievement",
      memorableTask: "Most Memorable Task",
      stuckPoints: "Stuck Points",
      newLearnings: "New Learnings",
      nextProjectImprovements: "Next Project Improvements",
    },
    // Common fields
    common: {
      createdAt: "Created",
      rating: "Rating",
      loading: "Loading...",
      error: "An error occurred",
    },
  },
} as const;
