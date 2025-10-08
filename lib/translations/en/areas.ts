export const areas = {
  description: "Manage areas of interest systematically",
  icons: {
    compass: "Compass",
    heart: "Heart",
    brain: "Brain",
    briefcase: "Briefcase",
    dollarSign: "Dollar",
    users: "Users",
    gamepad2: "Gamepad",
    dumbbell: "Dumbbell",
    bookOpen: "Book",
    home: "Home",
    settings: "Settings",
    star: "Star",
    target: "Target",
    zap: "Lightning",
    shield: "Shield",
    globe: "Globe",
    camera: "Camera",
    music: "Music",
    palette: "Palette",
    car: "Transport",
    plane: "Travel",
    utensils: "Cooking",
  },
  templates: {
    health: {
      title: "Health",
      description: "Exercise, diet, health management",
    },
    career: {
      title: "Career",
      description: "Work, growth, professional development",
    },
    personal: {
      title: "Personal Growth",
      description: "Learning, reading, self-improvement",
    },
    relationships: {
      title: "Relationships",
      description: "Family, friends, social network",
    },
    finance: {
      title: "Finance",
      description: "Savings, investment, financial management",
    },
    hobby: {
      title: "Hobby",
      description: "Games, art, leisure activities",
    },
  },
  new: {
    title: "Create New Area",
    description: "Create a new area to manage systematically",
  },
  form: {
    title: "Area Name",
    titlePlaceholder: "e.g., Health Management, Career Development",
    description: "Area Description",
    descriptionPlaceholder: "Describe what you want to manage in this area",
    color: "Color",
    icon: "Icon",
  },
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
} as const;
