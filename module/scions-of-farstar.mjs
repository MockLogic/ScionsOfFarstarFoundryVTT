/**
 * Scions of FarStar - Foundry VTT System
 * A custom system for multigenerational sci-fi colony building using modified Fate mechanics
 */

// Import actor classes
import { FactionScionActor } from "./actors/faction-scion-actor.mjs";
// import { ThreatActor } from "./actors/threat-actor.mjs";
// import { ColonyActor } from "./actors/colony-actor.mjs";

// Import sheet classes
import { FactionScionSheet } from "./actors/faction-scion-sheet.mjs";
// import { ThreatSheet } from "./actors/threat-sheet.mjs";
// import { ColonySheet } from "./actors/colony-sheet.mjs";

/**
 * Initialize the Scions of FarStar system
 */
Hooks.once('init', async function() {
  console.log('Scions of FarStar | Initializing system');

  // Store system configuration
  game.scionsOfFarstar = {
    config: {},

    /**
     * Get the current maximum capability rating based on base + major milestones
     * @returns {number} Current max capability
     */
    getMaxCapability: function() {
      const base = game.settings.get('scions-of-farstar', 'baseMaxCapability');
      const majorMilestones = game.settings.get('scions-of-farstar', 'majorMilestones');
      return base + majorMilestones;
    },

    /**
     * Get the current generation number
     * @returns {number} Current generation
     */
    getGenerationNumber: function() {
      return game.settings.get('scions-of-farstar', 'generationNumber');
    },

    /**
     * Get the number of significant milestones
     * @returns {number} Significant milestones count
     */
    getSignificantMilestones: function() {
      return game.settings.get('scions-of-farstar', 'significantMilestones');
    },

    /**
     * Get the number of major milestones
     * @returns {number} Major milestones count
     */
    getMajorMilestones: function() {
      return game.settings.get('scions-of-farstar', 'majorMilestones');
    },

    /**
     * Get the max skill rating
     * @returns {number} Max skill rating
     */
    getMaxSkill: function() {
      return game.settings.get('scions-of-farstar', 'maxSkill');
    },

    /**
     * Get the starting skill total for new Scions
     * @returns {number} Starting skill total
     */
    getStartingSkillTotal: function() {
      return game.settings.get('scions-of-farstar', 'startingSkillTotal');
    },

    /**
     * Get the starting capability total for new Factions
     * @returns {number} Starting capability total
     */
    getStartingCapabilityTotal: function() {
      return game.settings.get('scions-of-farstar', 'startingCapabilityTotal');
    },

    /**
     * Get the expected capability total (starting + significant milestones)
     * @returns {number} Expected capability total
     */
    getExpectedCapabilityTotal: function() {
      const starting = game.settings.get('scions-of-farstar', 'startingCapabilityTotal');
      const significantMilestones = game.settings.get('scions-of-farstar', 'significantMilestones');
      return starting + significantMilestones;
    }
  };

  // Register system settings
  registerSystemSettings();

  // Register custom Handlebars helpers
  registerHandlebarsHelpers();

  // Register custom Document classes
  CONFIG.Actor.documentClass = FactionScionActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("scions-of-farstar", FactionScionSheet, {
    types: ["faction-scion"],
    makeDefault: true,
    label: "SCIONS.ActorTypes.faction-scion"
  });

  console.log('Scions of FarStar | System initialized');
});

/**
 * System ready hook
 */
Hooks.once('ready', async function() {
  console.log('Scions of FarStar | System ready');
});

/**
 * Register system settings
 */
function registerSystemSettings() {
  // Campaign Progression Trackers
  game.settings.register('scions-of-farstar', 'generationNumber', {
    name: 'Generation Number',
    hint: 'Current generation of Scions (used for consequence recovery timing)',
    scope: 'world',
    config: true,
    type: Number,
    default: 1,
    range: {
      min: 1,
      max: 100,
      step: 1
    }
  });

  game.settings.register('scions-of-farstar', 'significantMilestones', {
    name: 'Significant Milestones',
    hint: 'Number of Significant Milestones achieved (each adds +1 capability point to the expected total)',
    scope: 'world',
    config: true,
    type: Number,
    default: 0,
    range: {
      min: 0,
      max: 100,
      step: 1
    }
  });

  game.settings.register('scions-of-farstar', 'majorMilestones', {
    name: 'Major Milestones',
    hint: 'Number of Major Milestones achieved (each increases max capability rating by +1)',
    scope: 'world',
    config: true,
    type: Number,
    default: 0,
    range: {
      min: 0,
      max: 100,
      step: 1
    }
  });

  // Validation Caps
  game.settings.register('scions-of-farstar', 'maxSkill', {
    name: 'Max Skill Rating',
    hint: 'Maximum rating for Scion Skills (default +4, Scions can exceed this via Age Track)',
    scope: 'world',
    config: true,
    type: Number,
    default: 4,
    range: {
      min: 1,
      max: 10,
      step: 1
    }
  });

  game.settings.register('scions-of-farstar', 'startingSkillTotal', {
    name: 'Starting Skill Total',
    hint: 'Total skill points for new Scions (default 6, for +3/+2/+1/+1/+0/-1 distribution)',
    scope: 'world',
    config: true,
    type: Number,
    default: 6,
    range: {
      min: -10,
      max: 50,
      step: 1
    }
  });

  game.settings.register('scions-of-farstar', 'baseMaxCapability', {
    name: 'Base Max Capability',
    hint: 'Base maximum rating for Faction Capabilities (default +3, increases with Major Milestones)',
    scope: 'world',
    config: true,
    type: Number,
    default: 3,
    range: {
      min: 1,
      max: 10,
      step: 1
    }
  });

  game.settings.register('scions-of-farstar', 'startingCapabilityTotal', {
    name: 'Starting Capability Total',
    hint: 'Total capability points for new Factions (default 5, for +2/+2/+1/+1/+0/-1 distribution)',
    scope: 'world',
    config: true,
    type: Number,
    default: 5,
    range: {
      min: -10,
      max: 50,
      step: 1
    }
  });

  // Debug setting
  game.settings.register('scions-of-farstar', 'debugMode', {
    name: 'Debug Mode',
    hint: 'Show additional debug information in console',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}

/**
 * Register Handlebars helpers for templates
 */
function registerHandlebarsHelpers() {
  // Helper to check if a value is positive
  Handlebars.registerHelper('isPositive', function(value) {
    return value > 0;
  });

  // Helper to display modifier with + or -
  Handlebars.registerHelper('signedNumber', function(value) {
    const num = parseInt(value) || 0;
    return num >= 0 ? `+${num}` : `${num}`;
  });

  // Helper to repeat stress boxes
  Handlebars.registerHelper('repeat', function(n, block) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += block.fn(i);
    }
    return result;
  });

  // Helper for times loop (for growing stress tracks)
  Handlebars.registerHelper('times', function(n, block) {
    let result = '';
    for (let i = 1; i <= n; i++) {
      result += block.fn(i);
    }
    return result;
  });

  // Helper to check array length
  Handlebars.registerHelper('hasItems', function(array) {
    return array && array.length > 0;
  });

  // Helper for conditional equals
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Helper for conditional not equals
  Handlebars.registerHelper('ne', function(a, b) {
    return a !== b;
  });

  // Helper for conditional greater than
  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

  // Helper for conditional less than
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  // Helper for logical OR
  Handlebars.registerHelper('or', function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });

  // Helper for logical AND
  Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });

  // Helper to get population value for People capability rating
  Handlebars.registerHelper('peoplePopulation', function(rating) {
    const populations = {
      1: '20',
      2: '100',
      3: '500',
      4: '2k',
      5: '8k',
      6: '30k',
      7: '100k',
      8: '500k',
      9: '1m',
      10: '1m+'
    };
    return populations[rating] || '';
  });
}

/**
 * Utility function to roll Fate dice (4dF)
 * Returns individual die results and total
 */
export function rollFateDice() {
  const results = [];
  let total = 0;

  for (let i = 0; i < 4; i++) {
    const roll = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    results.push(roll);
    total += roll;
  }

  return {
    results: results,
    total: total
  };
}

/**
 * Create a Fate dice roll message in chat
 * @param {string} label - The label for the roll (e.g., "Combat +2")
 * @param {number} modifier - The modifier to add to the roll
 * @param {Actor} actor - The actor making the roll
 * @param {string} speakerName - Optional custom speaker name (e.g., Scion name instead of Faction name)
 */
export async function createFateRoll(label, modifier = 0, actor = null, speakerName = null) {
  const dice = rollFateDice();
  const finalResult = dice.total + modifier;

  // Convert dice results to symbols
  const diceSymbols = dice.results.map(d => {
    if (d === 1) return '<span class="fate-die plus">+</span>';
    if (d === -1) return '<span class="fate-die minus">-</span>';
    return '<span class="fate-die blank">0</span>';
  }).join(' ');

  // Determine color based on final result compared to modifier
  // Priority: red for < 1, then orange/blue/green based on distance from modifier
  let colorClass = 'result-blue'; // Default (within ±1 of modifier)

  if (finalResult < 1) {
    // Red for any result under 1 (highest priority)
    colorClass = 'result-red';
  } else {
    // Calculate distance from modifier
    const distance = finalResult - modifier;

    if (distance > 1) {
      // Green for results more than 1 above modifier
      colorClass = 'result-green';
    } else if (distance < -1) {
      // Orange for results more than 1 below modifier
      colorClass = 'result-orange';
    }
    // else stays blue (within ±1 of modifier: distance is -1, 0, or 1)
  }

  // Create speaker data
  let speaker;
  if (actor) {
    speaker = ChatMessage.getSpeaker({ actor: actor });
    // Override alias if custom speaker name provided
    if (speakerName) {
      speaker.alias = speakerName;
    }
  } else {
    speaker = ChatMessage.getSpeaker();
  }

  // Create chat message
  const chatData = {
    user: game.user.id,
    speaker: speaker,
    content: `
      <div class="fate-roll">
        <h3>${label}</h3>
        <div class="dice-results">
          ${diceSymbols}
        </div>
        <div class="roll-total">
          <strong>Total:</strong> ${dice.total} ${modifier !== 0 ? `+ ${modifier}` : ''} = <strong class="${colorClass}">${finalResult}</strong>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  };

  return ChatMessage.create(chatData);
}
