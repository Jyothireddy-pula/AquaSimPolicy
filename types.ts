
export enum PolicyType {
  TREATMENT_PLANT = 'TREATMENT_PLANT',
  BUFFER_ZONES = 'BUFFER_ZONES',
  STRICT_REGULATION = 'STRICT_REGULATION',
  ORGANIC_FARMING = 'ORGANIC_FARMING',
  COMMUNITY_AWARENESS = 'COMMUNITY_AWARENESS'
}

export interface Policy {
  id: PolicyType;
  name: string;
  description: string;
  tradeOff: { pro: string; con: string };
  cost: number;
  delayWeeks: number;
  pollutionReduction: number;
  doImprovement: number;
  active: boolean;
  activationWeek?: number;
  age?: number;
}

export interface SimulationStateSnap {
  week: number;
  pollution: number;
  pollutionLow: number;
  pollutionHigh: number;
  do: number;
  integrity: number;
  integrityLow: number;
  integrityHigh: number;
  score: number;
}

export interface AIRecommendation {
  assessment: string;
  risks: string[];
  suggestedPolicies: string[];
  outlook: string;
  justification: string;
}

export interface PolicyLogEntry {
  week: number;
  event: string;
  type: 'POLICY' | 'SHOCK' | 'SYSTEM' | 'ERROR' | 'IMPACT';
  impact: string;
}

export type ContextScale = 'LOCAL' | 'REGIONAL' | 'NATIONAL';
export type Season = 'DRY' | 'RAINY' | 'MONSOON';

export interface AccountabilityTrace {
  primaryCause: string;
  description: string;
}

export interface SimulationNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  timestamp: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  initialState: Partial<SimulationState>;
  goal: string;
}

export interface SimulationState {
  week: number;
  pollutionLevel: number;
  dissolvedOxygen: number;
  ecosystemIntegrity: number;
  sustainabilityScore: number;
  budgetSpent: number;
  environmentalDebt: number;
  activePolicies: Policy[];
  history: SimulationStateSnap[];
  isCollapsed: boolean;
  aiAdvice?: AIRecommendation;
  isAiLoading: boolean;
  contextScale: ContextScale;
  season: Season;
  industryCompliance: number;
  agriCompliance: number;
  policyLog: PolicyLogEntry[];
  activeShock?: { type: string; value: string; severity: 'LOW' | 'HIGH' };
  institutionalFatigue: number;
  publicHealthRisk: number;
  agriYieldIndex: number;
  drinkingWaterSafety: 'SAFE' | 'TREATED' | 'UNSAFE';
  predictionConfidence: number;
  accountability?: AccountabilityTrace;
  notifications: SimulationNotification[];
  activeScenario?: string;
}

export enum EcosystemStatus {
  HEALTHY = 'Healthy',
  STRESSED = 'Stressed',
  CRITICAL = 'Critical',
  COLLAPSED = 'Collapsed'
}
