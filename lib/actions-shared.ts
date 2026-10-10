// Client-safe copy of the stage list (lib/actions.ts imports server-only modules).
export const STAGES = [
  { id: "ideation", label: "Ideation stage", short: "Ideation" },
  { id: "procurement", label: "Procurement stage and procurement calls", short: "Procurement" },
  { id: "building", label: "Client building stage", short: "Building" },
  { id: "completion", label: "Completion", short: "Completion" },
] as const;
