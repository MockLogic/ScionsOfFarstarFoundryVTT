/**
 * Scions of FarStar - Foundry VTT System
 * A custom system for multigenerational sci-fi colony building using modified Fate mechanics
 */

// Import actor classes (to be created)
// import { FactionScionActor } from "./actors/faction-scion.mjs";
// import { ThreatActor } from "./actors/threat.mjs";
// import { ColonyActor } from "./actors/colony.mjs";

// Import sheet classes (to be created)
// import { FactionScionSheet } from "./sheets/faction-scion-sheet.mjs";
// import { ThreatSheet } from "./sheets/threat-sheet.mjs";
// import { ColonySheet } from "./sheets/colony-sheet.mjs";

// Import dice roller (to be created)
// import { FateDiceRoller } from "./dice/fate-dice.mjs";

/**
 * Initialize the Scions of FarStar system
 */
Hooks.once('init', async function() {
  console.log('Scions of FarStar | Initializing system');

  // Store system configuration
  game.scionsOfFarstar = {
    config: {}
  };

  // Register system settings
  registerSystemSettings();

  // Register custom Handlebars helpers
  registerHandlebarsHelpers();

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
  // Example setting for showing debug info
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
 */
export async function createFateRoll(label, modifier = 0, actor = null) {
  const dice = rollFateDice();
  const finalResult = dice.total + modifier;

  // Convert dice results to symbols
  const diceSymbols = dice.results.map(d => {
    if (d === 1) return '<span class="fate-die plus">+</span>';
    if (d === -1) return '<span class="fate-die minus">-</span>';
    return '<span class="fate-die blank">0</span>';
  }).join(' ');

  // Create chat message
  const chatData = {
    user: game.user.id,
    speaker: actor ? ChatMessage.getSpeaker({ actor: actor }) : ChatMessage.getSpeaker(),
    content: `
      <div class="fate-roll">
        <h3>${label}</h3>
        <div class="dice-results">
          ${diceSymbols}
        </div>
        <div class="roll-total">
          <strong>Total:</strong> ${dice.total} ${modifier !== 0 ? `+ ${modifier}` : ''} = <strong>${finalResult}</strong>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  };

  return ChatMessage.create(chatData);
}
