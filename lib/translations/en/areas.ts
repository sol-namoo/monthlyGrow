export const areas = {
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
} as const;
