/** Set to true to use the LLM agent (generateDraft Cloud Function). Default: false (fake/local draft). */
export const USE_AGENT_MODE = import.meta.env.VITE_USE_LLM_DRAFT === "true";
