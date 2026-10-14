export const VOLUNTEER_ROLES = {
  camera: "Camera",
  audio: "Audio",
  ushers: "Ushers",
  safety: "Safety team",
  shuttle_driver: "Shuttle driver",
  hospitality: "Hospitality",
  editing: "Editing",
  social: "Social media",
} as const;
export type VolunteerRole = keyof typeof VOLUNTEER_ROLES;

export const shiftHours = (s: { starts_at: string; ends_at: string }) =>
  Math.max(0, (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 36e5);

/** Open slots per shift = slots - active claims (never negative). Short-staffed when any open. */
export function openSlots(slots: number, claimed: number) {
  return Math.max(0, slots - claimed);
}
