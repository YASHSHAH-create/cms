import { normalizeStatus } from "@/lib/normalize";

/** Comma-separated lists in env; fallback defaults handle common CRMs */
const leadEnv = process.env.LEAD_STATUS_LIST || "converted,won,closed_won,lead,successful,closedwon,closed-won,positive_interested";
const pendingEnv = process.env.PENDING_STATUS_LIST || "new,open,pending,assigned,in_progress,follow_up";

export const LEAD_SET = new Set(leadEnv.split(",").map(normalizeStatus));
export const PENDING_SET = new Set(pendingEnv.split(",").map(normalizeStatus));

/** Utility for runtime checks */
export function isLeadStatus(raw: any)     { return LEAD_SET.has(normalizeStatus(raw)); }
export function isPendingStatus(raw: any)  { return PENDING_SET.has(normalizeStatus(raw)); }
