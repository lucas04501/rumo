// A regra vive em `server/plan.ts`, que não importa nada: o app e a API usam o mesmo arquivo.
export {
  effectiveTier,
  FREE_MAX_HABITS,
  limitsOf,
  needsPro,
  PRO_PATHS,
  resolvePlan,
  TRIAL_DAYS,
} from '../../server/plan'
export type { Limits, PlanInfo, Subscription, Tier } from '../../server/plan'
