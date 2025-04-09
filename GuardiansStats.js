//GuardiansStats.js

const GuardiansStats = {
    "AerialScout": {
      health: 80,
      attack: 45,
      defense: 30,
      speed: 90,           // High mobility
      healing: 20,         // Minor self-repair
      cost: 1500,          // In-game currency
      specialAbility: "Recon", // Increased visibility range
    },
    "CombatSentinel": {
      health: 120,
      attack: 70,
      defense: 60,
      speed: 40,
      healing: 0,
      cost: 2500,          // In-game currency
      specialAbility: "ShieldBoost", // Temporary defense increase
    },
    "FlareBomber": {
      health: 60,
      attack: 85,          // Area damage
      defense: 20,
      speed: 50,
      healing: 0,
      cost: 2000,          // In-game currency
      specialAbility: "IncendiaryAttack", // Damage over time
    },
  };
  
  module.exports = GuardiansStats;