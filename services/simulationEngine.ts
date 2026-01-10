
import { SimulationState, EcosystemStatus, PolicyType } from '../types';
import { DAMAGE_COST_MULTIPLIER } from '../constants';

export const getEcosystemStatus = (integrity: number): EcosystemStatus => {
  if (integrity <= 0) return EcosystemStatus.COLLAPSED;
  if (integrity < 40) return EcosystemStatus.CRITICAL;
  if (integrity < 70) return EcosystemStatus.STRESSED;
  return EcosystemStatus.HEALTHY;
};

export const advanceWeek = (currentState: SimulationState): SimulationState => {
  const newWeek = currentState.week + 1;
  let newPollution = currentState.pollutionLevel;
  let newDO = currentState.dissolvedOxygen;
  const currentLog = [...currentState.policyLog];

  const scaleFactor = currentState.contextScale === 'NATIONAL' ? 3.0 : (currentState.contextScale === 'REGIONAL' ? 1.5 : 1.0);
  
  // Natural pollution growth
  const growth = (currentState.season === 'DRY' ? 1.5 : 2.2) * scaleFactor;
  newPollution += growth;

  let totalReduction = 0;
  let totalDoGain = 0;
  
  const updatedPolicies = currentState.activePolicies.map(p => {
    const age = (p.age || 0) + 1;
    const isWorking = p.activationWeek !== undefined && newWeek >= p.activationWeek;
    
    if (isWorking) {
      if (newWeek === p.activationWeek) {
        currentLog.unshift({
          week: newWeek,
          event: `Success: ${p.name} Active`,
          type: 'IMPACT',
          impact: `Your project is now working! Toxicity reduced by ${(p.pollutionReduction * 100).toFixed(0)}%.`
        });
      }

      const compliance = (p.id === PolicyType.TREATMENT_PLANT || p.id === PolicyType.STRICT_REGULATION) 
        ? currentState.industryCompliance / 100 
        : currentState.agriCompliance / 100;
      
      const combinedMod = compliance * (currentState.institutionalFatigue / 100);
      totalReduction += (p.pollutionReduction * combinedMod);
      totalDoGain += (p.doImprovement * combinedMod);
    }
    return { ...p, age: age };
  });

  const purification = (0.8 + (totalReduction * 5.0)) * scaleFactor;
  newPollution = Math.max(2, Math.min(100, newPollution - purification));

  const doLoss = newPollution / 60; // Slower DO loss
  newDO = Math.max(0, Math.min(10, newDO - doLoss + 0.3 + (totalDoGain / 10)));

  // Softened Integrity Delta for longer simulations (User now has ~15-20 weeks to react)
  const integrityDelta = (newDO < 4.5 ? -3 : (newDO > 8 ? 1 : 0)) + (newPollution > 55 ? -2 : (newPollution < 25 ? 0.5 : 0));
  const newIntegrity = Math.max(0, Math.min(100, currentState.ecosystemIntegrity + integrityDelta));
  const isCollapsed = newIntegrity <= 0;

  const newState: SimulationState = {
    ...currentState,
    week: newWeek,
    pollutionLevel: parseFloat(newPollution.toFixed(1)),
    dissolvedOxygen: parseFloat(newDO.toFixed(2)),
    ecosystemIntegrity: Math.round(newIntegrity),
    sustainabilityScore: Math.round((newIntegrity * 0.7) + (newDO * 3)),
    environmentalDebt: currentState.environmentalDebt + ((100 - newIntegrity) * DAMAGE_COST_MULTIPLIER * 0.5),
    isCollapsed: isCollapsed,
    activePolicies: updatedPolicies,
    policyLog: currentLog.slice(0, 20),
    publicHealthRisk: Math.round((newPollution * 1.1) + (10 - newDO) * 1.5),
    agriYieldIndex: Math.round(Math.max(0, 100 - (newPollution * 0.4))),
    predictionConfidence: Math.max(60, 100 - (newWeek * 0.3)),
    drinkingWaterSafety: newPollution > 50 ? 'UNSAFE' : (newPollution > 25 ? 'TREATED' : 'SAFE'),
    accountability: isCollapsed ? {
      primaryCause: "Ecosystem Collapse",
      description: "The river became too toxic for too long. Despite your efforts, the biological life could not survive."
    } : undefined,
    history: [
      ...currentState.history,
      { 
        week: newWeek, 
        pollution: newPollution, 
        pollutionLow: Math.max(0, newPollution - 2), 
        pollutionHigh: Math.min(100, newPollution + 2), 
        do: newDO, 
        integrity: newIntegrity, 
        integrityLow: Math.max(0, newIntegrity - 2), 
        integrityHigh: Math.min(100, newIntegrity + 2), 
        score: Math.round((newIntegrity * 0.7) + (newDO * 3)) 
      }
    ]
  };

  return newState;
};
