export const pickRandom = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const DRAFT_INTRO_MESSAGES = [
  "Here's what I've drafted based on your input:",
  "I put together a draft for you:",
  "Take a look at this draft:",
  "Here's a first version based on what you told me:",
  "I've got something drafted — have a look:",
  "Based on what you shared, here's a draft:",
  "Here's my take on it — let me know what you think:",
  "I've written something up for you:",
  "Here's a draft to get you started:",
  "This is what I came up with:",
] as const;

export const DRAFT_UPDATE_MESSAGES = [
  "I've updated the draft with your additions:",
  "Here's the revised version:",
  "Updated — here's the new draft:",
  "I've worked your additions into the draft:",
  "Draft updated with what you added:",
  "I've incorporated your changes:",
  "Here it is with your updates applied:",
  "Your additions are in — take a look:",
  "I've refined the draft based on what you added:",
  "Here's the updated version:",
] as const;

export const DRAFT_FOLLOWUP_MESSAGES = [
  "Would you like to add something? You can submit as-is or type more below.",
  "Happy with this? You can submit now or keep refining.",
  "Feel free to add more, or go ahead and submit.",
  "Looks good? Submit when ready, or tell me what to change.",
  "You can send this as-is, or add anything you'd like.",
  "Ready to submit, or is there something you'd like to tweak?",
  "Let me know if you want to adjust anything, or just hit submit.",
  "This is ready to go — or add more details if you'd like.",
  "Submit whenever you're ready, or keep building on this.",
  "Want to add anything else, or does this work for you?",
] as const;
