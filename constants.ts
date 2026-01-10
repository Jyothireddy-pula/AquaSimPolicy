
import { Policy, PolicyType, SimulationState, Scenario } from './types';

export const MAX_BUDGET = 5000000;
export const DAMAGE_COST_MULTIPLIER = 18000;

export const INITIAL_STATE: SimulationState = {
  week: 0,
  pollutionLevel: 25,
  dissolvedOxygen: 8.2,
  ecosystemIntegrity: 90,
  sustainabilityScore: 85,
  budgetSpent: 0,
  environmentalDebt: 0,
  activePolicies: [],
  history: [],
  isCollapsed: false,
  isAiLoading: false,
  contextScale: 'LOCAL',
  season: 'DRY',
  industryCompliance: 75,
  agriCompliance: 75,
  policyLog: [],
  institutionalFatigue: 100,
  drinkingWaterSafety: 'SAFE',
  predictionConfidence: 99,
  publicHealthRisk: 5,
  agriYieldIndex: 95,
  notifications: []
};

export interface EnhancedScenario extends Scenario {
  quickNote: string;
}

export const SCENARIOS: EnhancedScenario[] = [
  {
    id: 'POLLUTED_CITY',
    name: '🏙️ Stop the Factory Leak',
    description: 'A local factory is dumping chemicals. If we don’t act now, the water will be too toxic for humans in 15 weeks.',
    quickNote: 'Goal: Move the "Factory Rules" slider to 100% and activate the "Factory Water Filters" policy immediately.',
    initialState: {
      pollutionLevel: 60,
      ecosystemIntegrity: 65,
      industryCompliance: 20,
      environmentalDebt: 500000,
      policyLog: [{ week: 0, event: "Emergency: Chemical Leak Detected", type: 'SHOCK', impact: "Toxicity is rising. Use Factory Filters now!" }]
    },
    goal: 'Reach 70% Safety'
  },
  {
    id: 'FARM_RUNOFF',
    name: '🚜 Save the Fish Life',
    description: 'Farm chemicals are making it hard for fish to breathe. If the oxygen stays low, the river will die.',
    quickNote: 'Goal: Increase "Farm Rules" to 100% and start "River-Side Plant Zones" to boost oxygen levels.',
    initialState: {
      pollutionLevel: 45,
      dissolvedOxygen: 4.8,
      agriCompliance: 20,
      ecosystemIntegrity: 70,
      policyLog: [{ week: 0, event: "Oxygen Alert", type: 'SHOCK', impact: "Fish breathability is dropping. Start Planting!" }]
    },
    goal: 'Fish Breathing > 8.0'
  },
  {
    id: 'STANDARD',
    name: '📊 Sandbox Trainer',
    description: 'Learn how to manage a healthy river. Test different rules and see how they affect the community over time.',
    quickNote: 'Goal: Balance both sliders. Try out different policies to see which ones keep the score highest.',
    initialState: INITIAL_STATE,
    goal: 'Stay Healthy > 80%'
  }
];

export const AVAILABLE_POLICIES: Policy[] = [
  {
    id: PolicyType.TREATMENT_PLANT,
    name: "Factory Water Filters",
    description: "Install large filters at factories to catch chemicals before they enter the river.",
    tradeOff: { pro: "Cleans water very fast", con: "Expensive to build" },
    cost: 850000,
    delayWeeks: 3,
    pollutionReduction: 0.75,
    doImprovement: 1.5,
    active: false
  },
  {
    id: PolicyType.BUFFER_ZONES,
    name: "River-Side Plant Zones",
    description: "Planting trees and grass along the river to soak up dirt and chemicals naturally.",
    tradeOff: { pro: "Helps fish breathe better", con: "Takes a long time to grow" },
    cost: 250000,
    delayWeeks: 8,
    pollutionReduction: 0.40,
    doImprovement: 2.2,
    active: false
  },
  {
    id: PolicyType.STRICT_REGULATION,
    name: "Safety Law Officers",
    description: "Send inspectors to make sure factories are following safety rules.",
    tradeOff: { pro: "Forces factories to be clean", con: "Factories might complain" },
    cost: 120000,
    delayWeeks: 2,
    pollutionReduction: 0.55,
    doImprovement: 0.8,
    active: false
  },
  {
    id: PolicyType.ORGANIC_FARMING,
    name: "Clean Farming Support",
    description: "Pay farmers to use natural fertilizers that don't hurt the river.",
    tradeOff: { pro: "Safest for the long term", con: "Very expensive for the city" },
    cost: 620000,
    delayWeeks: 12,
    pollutionReduction: 0.85,
    doImprovement: 3.0,
    active: false
  },
  {
    id: PolicyType.COMMUNITY_AWARENESS,
    name: "Youth River Guards",
    description: "Train local students to monitor the water and report problems.",
    tradeOff: { pro: "Involves the community", con: "Only works on small areas" },
    cost: 65000,
    delayWeeks: 4,
    pollutionReduction: 0.20,
    doImprovement: 1.2,
    active: false
  }
];
