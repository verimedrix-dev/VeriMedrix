// Tutorial category labels and helpers

export const TUTORIAL_CATEGORY_LABELS: Record<string, string> = {
  GETTING_STARTED: "Getting Started",
  DOCUMENTS: "Documents",
  EMPLOYEES: "Employees",
  COMPLIANCE: "Compliance",
  INVENTORY: "Inventory",
  PAYROLL: "Payroll",
  TASKS: "Tasks",
  SETTINGS: "Settings",
  OTHER: "Other",
};

export const TUTORIAL_CATEGORIES = Object.keys(TUTORIAL_CATEGORY_LABELS);

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}
