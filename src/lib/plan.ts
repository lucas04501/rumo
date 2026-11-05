// A regra vive em `server/plan.ts`, que não importa nada: o app e a API usam o mesmo arquivo.
export {
  effectiveTier,
  FREE_MAX_HABITS,
  limitsOf,
  resolvePlan,
  TRIAL_DAYS,
  trialEndsAt,
} from '../../server/plan'
export type { Limits, PlanInfo, Subscription, Tier } from '../../server/plan'
