/**
 * Scions of FarStar - Foundry VTT System
 * A custom system for multigenerational sci-fi colony building using modified Fate mechanics
 */

// Import actor classes
import { FactionScionActor } from "./actors/faction-scion-actor.mjs";
import { ThreatActor } from "./actors/threat-actor.mjs";
import { ColonyActor } from "./actors/colony-actor.mjs";

// Import sheet classes
import { FactionScionSheet } from "./actors/faction-scion-sheet.mjs";
import { ThreatSheet } from "./actors/threat-sheet.mjs";
import { ColonySheet } from "./actors/colony-sheet.mjs";
import { RegistrarSheet } from "./actors/registrar-sheet.mjs";
import { SimpleAspectSheet } from "./actors/simple-aspect-sheet.mjs";

// Import item sheet classes
import { NamedNpcSheet } from "./items/named-npc-sheet.mjs";
import { ExtraSheet } from "./items/extra-sheet.mjs";
import { StuntBasicSheet, StuntSwapSheet, StuntConsequenceSheet, StuntStressSheet, StuntOtherSheet } from "./items/stunt-sheet.mjs";

/**
 * Initialize the Scions of FarStar system
 */
Hooks.once('init', async function() {
  console.log('Scions of FarStar | Initializing system');

  // Custom token status effects
  CONFIG.statusEffects = [
    {
      id: "dead",
      label: "SCIONS.StatusEffect.dead",
      icon: "systems/scions-of-farstar/assets/icons/x_red.svg",
      overlay: true
    },
    {
      id: "scale1",
      label: "SCIONS.StatusEffect.scale1",
      icon: "systems/scions-of-farstar/assets/icons/scale1.svg"
    },
    {
      id: "scale2",
      label: "SCIONS.StatusEffect.scale2",
      icon: "systems/scions-of-farstar/assets/icons/scale2.svg"
    },
    {
      id: "scale3",
      label: "SCIONS.StatusEffect.scale3",
      icon: "systems/scions-of-farstar/assets/icons/scale3.svg"
    },
    {
      id: "scale4",
      label: "SCIONS.StatusEffect.scale4",
      icon: "systems/scions-of-farstar/assets/icons/scale4.svg"
    },
    {
      id: "scale5",
      label: "SCIONS.StatusEffect.scale5",
      icon: "systems/scions-of-farstar/assets/icons/scale5.svg"
    },
    {
      id: "scale6",
      label: "SCIONS.StatusEffect.scale6",
      icon: "systems/scions-of-farstar/assets/icons/scale6.svg"
    },
    {
      id: "scale7",
      label: "SCIONS.StatusEffect.scale7",
      icon: "systems/scions-of-farstar/assets/icons/scale7.svg"
    },
    {
      id: "scale8",
      label: "SCIONS.StatusEffect.scale8",
      icon: "systems/scions-of-farstar/assets/icons/scale8.svg"
    },
    {
      id: "uparrow",
      label: "SCIONS.StatusEffect.uparrow",
      icon: "icons/svg/upgrade.svg"
    },
    {
      id: "downarrow",
      label: "SCIONS.StatusEffect.downarrow",
      icon: "icons/svg/downgrade.svg"
    },
    {
      id: "caution",
      label: "SCIONS.StatusEffect.caution",
      icon: "icons/svg/hazard.svg"
    },
    {
      id: "biohazard",
      label: "SCIONS.StatusEffect.biohazard",
      icon: "icons/svg/biohazard.svg"
    },
    {
      id: "flames",
      label: "SCIONS.StatusEffect.flames",
      icon: "icons/svg/fire.svg"
    }
    // Add more as needed
  ];

  CONFIG.specialStatusEffects.DEFEATED = "dead";

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

  // Create a unified Actor class with all methods from both actor types
  class ScionsActor extends Actor {
    prepareData() {
      super.prepareData();
      // Call type-specific prepareData if it exists
      if (this.type === "faction-scion" && FactionScionActor.prototype.prepareData !== Actor.prototype.prepareData) {
        FactionScionActor.prototype.prepareData.call(this);
      } else if (this.type === "threat" && ThreatActor.prototype.prepareData !== Actor.prototype.prepareData) {
        ThreatActor.prototype.prepareData.call(this);
      } else if (this.type === "colony" && ColonyActor.prototype.prepareData !== Actor.prototype.prepareData) {
        ColonyActor.prototype.prepareData.call(this);
      }
    }

    prepareDerivedData() {
      super.prepareDerivedData();

      // Call type-specific prepareDerivedData
      if (this.type === "faction-scion") {
        this._prepareScionData(this.system);
        this._prepareFactionData(this.system);
      } else if (this.type === "threat") {
        this._prepareSkillColumns(this.system);
        this._prepareStressTracks(this.system);
        this._prepareLadders(this.system);
        if (this.system.modularSections.ageTrack.visible) {
          this.system.currentAgeStage = this._determineCurrentAge(this.system.modularSections.ageTrack.stages);
        }
        this._calculateThreatTrauma(this.system);
      } else if (this.type === "colony") {
        this._preparePopulationTrack(this.system);
        this._validateAttributeColumn(this.system);
      }
    }

    // FactionScionActor methods
    _prepareScionData(systemData) {
      return FactionScionActor.prototype._prepareScionData.call(this, systemData);
    }

    _prepareFactionData(systemData) {
      return FactionScionActor.prototype._prepareFactionData.call(this, systemData);
    }

    validateSkillPyramid() {
      return FactionScionActor.prototype.validateSkillPyramid.call(this);
    }

    validateCapabilityPyramid() {
      return FactionScionActor.prototype.validateCapabilityPyramid.call(this);
    }

    _validatePyramid(items, maxRating, type) {
      return FactionScionActor.prototype._validatePyramid.call(this, items, maxRating, type);
    }

    async modifyTokenAttribute(attribute, value, isDelta, isBar) {
      if (this.type === "faction-scion") {
        return FactionScionActor.prototype.modifyTokenAttribute.call(this, attribute, value, isDelta, isBar);
      } else if (this.type === "threat") {
        return ThreatActor.prototype.modifyTokenAttribute.call(this, attribute, value, isDelta, isBar);
      } else if (this.type === "colony") {
        return ColonyActor.prototype.modifyTokenAttribute.call(this, attribute, value, isDelta, isBar);
      }
      return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }

    async _preCreate(data, options, user) {
      await super._preCreate(data, options, user);
      if (this.type === "faction-scion") {
        return FactionScionActor.prototype._preCreate.call(this, data, options, user);
      } else if (this.type === "threat") {
        return ThreatActor.prototype._preCreate.call(this, data, options, user);
      } else if (this.type === "colony") {
        return ColonyActor.prototype._preCreate.call(this, data, options, user);
      } else if (this.type === "simple-aspect") {
        // Set default token configuration for simple-aspect
        const prototypeToken = {
          displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,  // Always show name
          displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,  // Always show bars
          bar1: { attribute: "freeInvokes" },              // Primary bar: Free Invokes
          disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL   // Aspects are neutral
        };
        this.updateSource({ prototypeToken });
      }
    }

    // ThreatActor methods
    _prepareSkillColumns(systemData) {
      return ThreatActor.prototype._prepareSkillColumns.call(this, systemData);
    }

    _prepareStressTracks(systemData) {
      return ThreatActor.prototype._prepareStressTracks.call(this, systemData);
    }

    _prepareLadders(systemData) {
      return ThreatActor.prototype._prepareLadders.call(this, systemData);
    }

    _determineCurrentAge(ageTrack) {
      return ThreatActor.prototype._determineCurrentAge.call(this, ageTrack);
    }

    _calculateThreatTrauma(systemData) {
      return ThreatActor.prototype._calculateThreatTrauma.call(this, systemData);
    }

    // ColonyActor methods
    _preparePopulationTrack(systemData) {
      return ColonyActor.prototype._preparePopulationTrack.call(this, systemData);
    }

    _validateAttributeColumn(systemData) {
      return ColonyActor.prototype._validateAttributeColumn.call(this, systemData);
    }

    // Shared rollFateDice method
    async rollFateDice(skillOrCap, modifier, label, speakerName) {
      if (this.type === "faction-scion") {
        return FactionScionActor.prototype.rollFateDice.call(this, skillOrCap, modifier, label, speakerName);
      } else if (this.type === "threat") {
        return ThreatActor.prototype.rollFateDice.call(this, skillOrCap, modifier, label);
      } else if (this.type === "colony") {
        return ColonyActor.prototype.rollFateDice.call(this, skillOrCap, modifier, label, speakerName);
      }
    }
  }

  // Register the unified Actor class
  CONFIG.Actor.documentClass = ScionsActor;

  // Set default actor icons
  CONFIG.Actor.typeIcons = {
    "faction-scion": "icons/svg/mystery-man.svg",  // Keep default for faction-scion
    "colony": "icons/svg/village.svg",  // Place/settlement icon for colony
    "registrar": "icons/svg/book.svg",  // Book icon for registrar
    "threat": "icons/svg/skull.svg",  // Make threat look more menacing with skull icon
    "simple-aspect": "systems/scions-of-farstar/assets/icons/aspect-note.svg"  // Aspect note icon for scene aspects
  };

  // Set default item icons
  CONFIG.Item.typeIcons = {
    "named-npc": "icons/svg/walk.svg",  // Generic person/walk icon for named-npc
    "extra-aspect": "icons/svg/regen.svg",  // Regen icon for all Extra types
    "extra-ladder": "icons/svg/regen.svg",
    "extra-skill": "icons/svg/regen.svg",
    "extra-track": "icons/svg/regen.svg",
    "extra-growing-track": "icons/svg/regen.svg"
  };

  // Register sheet application classes
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Actor, "core", ActorSheet);

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "scions-of-farstar", FactionScionSheet, {
    types: ["faction-scion"],
    makeDefault: true,
    label: "SCIONS.ActorTypes.faction-scion"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "scions-of-farstar", ThreatSheet, {
    types: ["threat"],
    makeDefault: true,
    label: "SCIONS.ActorTypes.threat"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "scions-of-farstar", ColonySheet, {
    types: ["colony"],
    makeDefault: true,
    label: "SCIONS.ActorTypes.colony"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "scions-of-farstar", RegistrarSheet, {
    types: ["registrar"],
    makeDefault: true,
    label: "SCIONS.ActorTypes.registrar"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "scions-of-farstar", SimpleAspectSheet, {
    types: ["simple-aspect"],
    makeDefault: true,
    label: "SCIONS.ActorTypes.simple-aspect"
  });

  // Register item sheets
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Item, "core", ItemSheet);

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", NamedNpcSheet, {
    types: ["named-npc"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.named-npc"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", ExtraSheet, {
    types: ["extra-aspect", "extra-ladder", "extra-skill", "extra-track", "extra-growing-track"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.extra"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", StuntBasicSheet, {
    types: ["stunt-basic"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.stunt-basic"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", StuntSwapSheet, {
    types: ["stunt-swap"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.stunt-swap"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", StuntConsequenceSheet, {
    types: ["stunt-consequence"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.stunt-consequence"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", StuntStressSheet, {
    types: ["stunt-stress"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.stunt-stress"
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "scions-of-farstar", StuntOtherSheet, {
    types: ["stunt-other"],
    makeDefault: true,
    label: "SCIONS.ItemTypes.stunt-other"
  });

  console.log('Scions of FarStar | System initialized');
});

/**
 * Set default birth generation for new named NPCs
 */
Hooks.on('preCreateItem', async function(item, data, options, userId) {
  if (item.type === 'named-npc') {
    // Only set if birthGeneration is null (the template default)
    // This way, any NPC with an actual birthGeneration value (including -2) will be preserved
    if (data.system?.birthGeneration === null || data.system?.birthGeneration === undefined) {
      const currentGeneration = game.scionsOfFarstar.getGenerationNumber();
      const updates = {
        'system.birthGeneration': currentGeneration - 2
      };
      item.updateSource(updates);
    }
  }
});

/**
 * System ready hook
 */
Hooks.once('ready', async function() {
  console.log('Scions of FarStar | System ready');
  console.log('Scions of FarStar | Named NPC creation restricted to GM and Assistant roles');
});

/**
 * Handle dropping skills/capabilities onto the hotbar to create macros
 */
Hooks.on('hotbarDrop', async (bar, data, slot) => {
  console.log("Scions of FarStar | hotbarDrop triggered with data:", data);

  // Handle stunt item drops from our custom drag data
  if (data.type === "StuntItem") {
    const actor = game.actors.get(data.actorId);
    const item = actor?.items.get(data.itemId);

    if (!item) {
      ui.notifications.error("Stunt not found for macro creation");
      return false;
    }

    // Check if stunt can create a macro (only basic and swap with complete config)
    if (item.type === "stunt-basic") {
      if (!item.system.skillOrCapability || !item.system.actionType) {
        ui.notifications.warn(`${item.name} cannot create a macro - skill/capability and action type must be configured.`);
        return false;
      }

      // Extract plain text description (strip HTML tags)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.system.description || '';
      const description = tempDiv.textContent || tempDiv.innerText || '';

      const macroName = item.name;
      const macroCommand = `/fate ${item.system.skillOrCapability} ${item.system.actionType.charAt(0).toUpperCase() + item.system.actionType.slice(1)} Stunt+2 [${item.name}] <${description}>`;
      const macroImg = item.img;

      let macro = game.macros.find(m =>
        m.name === macroName &&
        m.command === macroCommand &&
        m.author.id === game.user.id
      );

      if (!macro) {
        macro = await Macro.create({
          name: macroName,
          type: "chat",
          command: macroCommand,
          img: macroImg
        });
      }

      await game.user.assignHotbarMacro(macro, slot);
      return false;

    } else if (item.type === "stunt-swap") {
      if (!item.system.targetSkillOrCapability || !item.system.replacementSkillOrCapability || !item.system.actionType) {
        ui.notifications.warn(`${item.name} cannot create a macro - all skills/capabilities and action type must be configured.`);
        return false;
      }

      // Extract plain text description (strip HTML tags)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.system.description || '';
      const description = tempDiv.textContent || tempDiv.innerText || '';

      // Determine if this is a Stunt-Swap or Stunt-Swap+2 based on whether skill values differ
      // For now, default to Stunt-Swap (no bonus) - user can manually add +2 to macro if needed
      const macroName = item.name;
      const macroCommand = `/fate ${item.system.targetSkillOrCapability} ${item.system.actionType.charAt(0).toUpperCase() + item.system.actionType.slice(1)} Stunt-Swap ${item.system.replacementSkillOrCapability} [${item.name}] <${description}>`;
      const macroImg = item.img;

      let macro = game.macros.find(m =>
        m.name === macroName &&
        m.command === macroCommand &&
        m.author.id === game.user.id
      );

      if (!macro) {
        macro = await Macro.create({
          name: macroName,
          type: "chat",
          command: macroCommand,
          img: macroImg
        });
      }

      await game.user.assignHotbarMacro(macro, slot);
      return false;

    } else {
      // Consequence, Stress, or Other stunts cannot create macros
      ui.notifications.info(`${item.name} does not have a roll button and cannot create a macro.`);
      return false;
    }
  }

  // Only handle our custom drag types
  if (data.type !== "FactionScionSkill" && data.type !== "FactionScionCapability" && data.type !== "StuntItem") {
    console.log("Scions of FarStar | Not our drag type, allowing default handling");
    return true; // Allow other drops to be handled normally
  }

  console.log("Scions of FarStar | Processing custom drag type:", data.type);

  // Get the actor
  const actor = game.actors.get(data.actorId);
  if (!actor) {
    console.error("Scions of FarStar | Actor not found:", data.actorId);
    ui.notifications.error("Actor not found for macro creation");
    return false;
  }

  // Determine the skill/capability details
  let macroName, macroCommand, macroImg;

  if (data.type === "FactionScionSkill") {
    // Skill macro
    const skillKey = data.skillKey;
    const skillLabel = data.skillLabel;
    const scionName = actor.system.scion.name || actor.name;

    macroName = `${scionName}: ${skillLabel}`;
    macroCommand = `/fate ${skillLabel}`;

    // Map skill keys to custom icons
    const skillIcons = {
      academics: "systems/scions-of-farstar/assets/s_academics.svg",
      combat: "systems/scions-of-farstar/assets/s_combat.svg",
      deception: "systems/scions-of-farstar/assets/s_deception.svg",
      engineering: "systems/scions-of-farstar/assets/s_engineering.svg",
      exploration: "systems/scions-of-farstar/assets/s_exploration.svg",
      influence: "systems/scions-of-farstar/assets/s_influence.svg"
    };
    macroImg = skillIcons[skillKey] || "icons/svg/dice-target.svg";
  } else if (data.type === "FactionScionCapability") {
    // Capability macro
    const capabilityKey = data.capabilityKey;
    const capabilityLabel = data.capabilityLabel;
    const factionName = actor.name;

    macroName = `${factionName}: ${capabilityLabel}`;
    macroCommand = `/fate ${capabilityLabel}`;

    // Map capability keys to custom icons
    const capabilityIcons = {
      culture: "systems/scions-of-farstar/assets/f_culture.svg",
      industrial: "systems/scions-of-farstar/assets/f_industrial.svg",
      military: "systems/scions-of-farstar/assets/f_military.svg",
      mobility: "systems/scions-of-farstar/assets/f_mobility.svg",
      people: "systems/scions-of-farstar/assets/f_people.svg",
      technology: "systems/scions-of-farstar/assets/f_technology.svg"
    };
    macroImg = capabilityIcons[capabilityKey] || "icons/svg/dice-target.svg";
  }

  // Create the macro
  let macro = game.macros.find(m =>
    m.name === macroName &&
    m.command === macroCommand &&
    m.author.id === game.user.id
  );

  if (!macro) {
    macro = await Macro.create({
      name: macroName,
      type: "chat",
      command: macroCommand,
      img: macroImg,
      flags: {
        "scions-of-farstar": {
          actorId: actor.id,
          skillKey: data.skillKey || null,
          capabilityKey: data.capabilityKey || null
        }
      }
    });
  }

  // Assign the macro to the hotbar slot
  await game.user.assignHotbarMacro(macro, slot);

  return false; // Prevent default handling
});

/**
 * Set default icons for actors based on type
 */
Hooks.on('preCreateActor', (document, data, options, userId) => {
  // Only set icon if one isn't already specified
  if (!data.img || data.img === "icons/svg/mystery-man.svg") {
    const defaultIcon = CONFIG.Actor.typeIcons?.[document.type];
    if (defaultIcon) {
      document.updateSource({ img: defaultIcon });
    }
  }
});

/**
 * Set default icons for items based on type
 * Also restrict named-npc item creation to GM and Assistant roles only
 * Players can still modify NPCs embedded in actors they own
 */
Hooks.on('preCreateItem', (document, data, options, userId) => {
  // Set default icon for items if not specified
  if (!data.img || data.img === "icons/svg/item-bag.svg") {
    const defaultIcon = CONFIG.Item.typeIcons?.[document.type];
    if (defaultIcon) {
      document.updateSource({ img: defaultIcon });
    }
  }

  // Restrict named-npc and extra item creation to GM and Trusted roles
  // Only check for items being created in the Items directory (not embedded in actors)
  const isExtraType = ['extra-aspect', 'extra-ladder', 'extra-skill', 'extra-track', 'extra-growing-track'].includes(document.type);
  const isRestrictedType = document.type === 'named-npc' || isExtraType;

  if (isRestrictedType && !document.parent) {
    const user = game.users.get(userId);

    // Check if user is a player (role 1)
    // GAMEMASTER = 4, ASSISTANT = 3 or 2, TRUSTED = 2, PLAYER = 1
    if (user && user.role < CONST.USER_ROLES.TRUSTED) {
      const itemTypeName = isExtraType ? 'Extra' : 'Named NPC';
      ui.notifications.warn(`Only the GM can create ${itemTypeName} items. ${itemTypeName}s must be created by the GM and then shared with players.`);
      return false; // Prevent creation
    }
  }
  return true; // Allow creation
});

/**
 * Chat command handler for Fate dice rolls
 * Supports /fate and /4df commands with various syntaxes:
 * - /fate                                    (basic roll)
 * - /fate +2                                 (roll with modifier)
 * - /fate +2 custom note                     (roll with modifier and note)
 * - /fate Combat                             (skill roll)
 * - /fate Combat Attack                      (skill roll with action type)
 * - /fate Combat Attack Stunt+2 Name         (skill roll with stunt bonus)
 * - /fate Combat Attack Stunt-Swap Technology Name  (skill swap)
 * - /fate Combat Attack Stunt-Swap+2 Technology Name (skill swap + bonus)
 */
Hooks.on('chatMessage', (log, message, chatData) => {
  // Check if this is a /fate or /4df command
  if (!/^\/(fate|4df)\b/i.test(message)) {
    return true; // Not a fate command, continue normal processing
  }

  // Get the speaker's actor if they have a character assigned
  const speaker = ChatMessage.getSpeaker();
  const actor = game.actors.get(speaker.actor);

  // Parse the command
  const rollData = parseFateCommand(message, actor);

  if (!rollData) {
    ui.notifications.error('Invalid /fate command syntax');
    return false;
  }

  // Check if player is not GM and doesn't have an assigned actor
  if (!actor && !game.user.isGM) {
    ui.notifications.warn('You must have an assigned character to use skill-based /fate commands. Use /fate +N for simple rolls.');
    // Allow simple rolls without skills
    if (rollData.skillName) {
      return false;
    }
  }

  // Create the fate roll
  createFateRoll(rollData, 0, actor, null);

  // Return false to prevent the message from being processed as a normal chat message
  return false;
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

  // Helper to capitalize first letter
  Handlebars.registerHelper('capitalize', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Helper for logical AND
  Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });

  // Helper to get population value for People capability rating
  Handlebars.registerHelper('peoplePopulation', function(rating) {
    const populations = {
      1: '12',
      2: '50',
      3: '200',
      4: '1k',
      5: '5k',
      6: '20k',
      7: '50k',
      8: '200k',
      9: '~1m',
      10: '1m+'
    };
    return populations[rating] || '';
  });

  // Helper to create an array from arguments
  Handlebars.registerHelper('array', function() {
    return Array.prototype.slice.call(arguments, 0, -1);
  });

  // Helper to reverse an array
  Handlebars.registerHelper('reverse', function(array) {
    if (!Array.isArray(array)) return array;
    return array.slice().reverse();
  });

  // Helper to add two numbers
  Handlebars.registerHelper('add', function(a, b) {
    return a + b;
  });

  // Helper to subtract two numbers
  Handlebars.registerHelper('subtract', function(a, b) {
    return a - b;
  });

  // Helper for modulo operation
  Handlebars.registerHelper('mod', function(a, b) {
    return a % b;
  });

  // Helper for checkbox checked attribute
  Handlebars.registerHelper('checked', function(value) {
    return value ? 'checked' : '';
  });

  // Helper to get visible ladder rungs (only up to rungCount)
  Handlebars.registerHelper('getLadderRungs', function(ladder) {
    if (!ladder || !Array.isArray(ladder.rungs)) return [];
    return ladder.rungs.slice(0, ladder.rungCount);
  });

  // Helper to find topmost unchecked rung index for highlighting
  Handlebars.registerHelper('getHighestUncheckedRung', function(ladder) {
    if (!ladder || !Array.isArray(ladder.rungs)) return -1;
    const rungs = ladder.rungs.slice(0, ladder.rungCount);
    for (let i = 0; i < rungs.length; i++) {
      if (!rungs[i].checked) {
        return i;
      }
    }
    return -1; // All checked
  });
}

/**
 * Parse stunt name in brackets and description in angle brackets
 * Format: [Stunt Name] <Description text>
 * @param {string} text - The text to parse
 * @returns {Object} Object with stuntName and description properties
 */
function parseStuntNameAndDescription(text) {
  const result = { stuntName: null, description: null };

  // Match [Stunt Name] and <Description>
  const nameMatch = text.match(/\[([^\]]+)\]/);
  const descMatch = text.match(/<(.+)>/);

  if (nameMatch) {
    result.stuntName = nameMatch[1].trim();
  }

  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  return result;
}

/**
 * Parse a /fate command into its components
 * Supports various syntaxes from simple rolls to complex skill+action+stunt combinations
 *
 * @param {string} message - The chat message (e.g., "/fate Combat Attack Stunt+2 Superior Training")
 * @param {Actor} actor - The actor making the roll (to look up skills/capabilities)
 * @returns {Object|null} Parsed command data or null if not a valid /fate command
 */
export function parseFateCommand(message, actor) {
  // Match /fate or /4df command at start
  if (!/^\/(fate|4df)\b/i.test(message)) {
    return null;
  }

  // Remove the command prefix
  let rest = message.replace(/^\/(fate|4df)\s*/i, '').trim();

  // Initialize result object
  const result = {
    modifier: 0,
    skillName: null,
    skillValue: 0,
    skillSource: null, // 'scion' or 'faction'
    actionType: null, // 'attack', 'defend', 'overcome', 'create'
    stuntBonus: 0,
    stuntSwap: null, // { from: 'Combat', to: 'Technology', value: 3 }
    stuntName: null,
    note: null
  };

  // If empty after command, just a basic roll
  if (!rest) {
    return result;
  }

  // Check for simple numeric modifier: /fate +2 or /fate -1
  const simpleNumMatch = rest.match(/^([+-]?\d+)$/);
  if (simpleNumMatch) {
    result.modifier = parseInt(simpleNumMatch[1]);
    return result;
  }

  // Check for simple numeric with note: /fate +2 some note
  const simpleNumNoteMatch = rest.match(/^([+-]?\d+)\s+(.+)$/);
  if (simpleNumNoteMatch) {
    result.modifier = parseInt(simpleNumNoteMatch[1]);
    result.note = simpleNumNoteMatch[2];
    return result;
  }

  // Complex parsing: skill/capability, action, stunt modifiers

  // Extract first token as potential skill/capability name
  const tokens = rest.split(/\s+/);
  if (tokens.length === 0) return result;

  // Try to find skill or capability
  const potentialSkill = tokens[0].toLowerCase();
  let skillFound = false;
  let tokenIndex = 1;

  if (actor && actor.type === 'faction-scion') {
    // Check scion skills
    const scionSkills = {
      'academics': 'Academics',
      'combat': 'Combat',
      'deception': 'Deception',
      'engineering': 'Engineering',
      'exploration': 'Exploration',
      'influence': 'Influence'
    };

    // Check faction capabilities
    const factionCapabilities = {
      'culture': 'Culture',
      'industrial': 'Industrial',
      'military': 'Military',
      'mobility': 'Mobility',
      'technology': 'Technology',
      'people': 'People'
    };

    if (scionSkills[potentialSkill]) {
      result.skillName = scionSkills[potentialSkill];
      result.skillValue = actor.system.scion.skills[potentialSkill].value;
      result.skillSource = 'scion';
      result.modifier = result.skillValue;
      skillFound = true;
    } else if (factionCapabilities[potentialSkill]) {
      result.skillName = factionCapabilities[potentialSkill];
      result.skillValue = actor.system.faction.capabilities[potentialSkill].value;
      result.skillSource = 'faction';
      result.modifier = result.skillValue;
      skillFound = true;
    }
  }

  if (!skillFound) {
    // Not a valid skill/capability, treat whole thing as a note
    result.note = rest;
    return result;
  }

  // Parse remaining tokens for action type, stunt info
  if (tokenIndex >= tokens.length) {
    return result; // Just skill, no action
  }

  // Check for action type
  const actionToken = tokens[tokenIndex].toLowerCase();
  const actionTypes = {
    'attack': 'attack',
    'defend': 'defend',
    'overcome': 'overcome',
    'create': 'create'
  };

  if (actionTypes[actionToken]) {
    result.actionType = actionTypes[actionToken];
    tokenIndex++;
  }

  // Parse stunt modifiers
  if (tokenIndex < tokens.length) {
    const stuntToken = tokens[tokenIndex].toLowerCase();
    const remainingText = tokens.slice(tokenIndex).join(' ');

    // Check for Stunt+2
    if (stuntToken === 'stunt+2') {
      result.stuntBonus = 2;
      result.modifier += 2;
      tokenIndex++;

      // Parse [Stunt Name] and <Description> from remaining text
      const restText = tokens.slice(tokenIndex).join(' ');
      const parsed = parseStuntNameAndDescription(restText);

      if (!parsed.stuntName || !parsed.description) {
        // Missing required parts, treat as regular roll without stunt
        result.stuntBonus = 0;
        result.modifier -= 2;
        result.note = tokens.slice(tokenIndex - 1).join(' ');
      } else {
        result.stuntName = parsed.stuntName;
        result.note = parsed.description;
      }
    }
    // Check for Stunt-Swap or Stunt-Swap+2
    else if (stuntToken === 'stunt-swap' || stuntToken === 'stunt-swap+2') {
      const needsBonus = stuntToken === 'stunt-swap+2';
      tokenIndex++;

      // Next token should be the replacement skill/capability
      if (tokenIndex < tokens.length) {
        const swapSkill = tokens[tokenIndex].toLowerCase();

        // Try to find the swap skill value
        let swapFound = false;

        if (actor && actor.type === 'faction-scion') {
          const allSkills = {
            'academics': { name: 'Academics', source: 'scion' },
            'combat': { name: 'Combat', source: 'scion' },
            'deception': { name: 'Deception', source: 'scion' },
            'engineering': { name: 'Engineering', source: 'scion' },
            'exploration': { name: 'Exploration', source: 'scion' },
            'influence': { name: 'Influence', source: 'scion' },
            'culture': { name: 'Culture', source: 'faction' },
            'industrial': { name: 'Industrial', source: 'faction' },
            'military': { name: 'Military', source: 'faction' },
            'mobility': { name: 'Mobility', source: 'faction' },
            'technology': { name: 'Technology', source: 'faction' },
            'people': { name: 'People', source: 'faction' }
          };

          if (allSkills[swapSkill]) {
            const swapData = allSkills[swapSkill];
            const swapValue = swapData.source === 'scion'
              ? actor.system.scion.skills[swapSkill].value
              : actor.system.faction.capabilities[swapSkill].value;

            result.stuntSwap = {
              from: result.skillName,
              fromValue: result.skillValue,
              to: swapData.name,
              toValue: swapValue,
              source: swapData.source
            };

            // Update the modifier to use the swapped skill value
            result.modifier = result.modifier - result.skillValue + swapValue;

            if (needsBonus) {
              result.stuntBonus = 2;
              result.modifier += 2;
            }

            swapFound = true;
            tokenIndex++;

            // Parse [Stunt Name] and <Description> from remaining text
            const restText = tokens.slice(tokenIndex).join(' ');
            const parsed = parseStuntNameAndDescription(restText);

            if (!parsed.stuntName || !parsed.description) {
              // Missing required parts, revert stunt effects
              result.stuntSwap = null;
              result.stuntBonus = 0;
              result.modifier = result.skillValue; // Reset to original skill
              result.note = tokens.slice(tokenIndex - 2).join(' ');
            } else {
              result.stuntName = parsed.stuntName;
              result.note = parsed.description;
            }
          }
        }

        if (!swapFound) {
          // Couldn't find swap skill, treat remaining as note
          result.note = tokens.slice(tokenIndex - 1).join(' ');
        }
      }
    }
    else {
      // Not a recognized stunt pattern, treat remaining as note
      result.note = tokens.slice(tokenIndex).join(' ');
    }
  }

  return result;
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
 * @param {string|Object} labelOrData - The label for the roll OR parsed command data object
 * @param {number} modifier - The modifier to add to the roll (legacy parameter)
 * @param {Actor} actor - The actor making the roll (legacy parameter)
 * @param {string} speakerName - Optional custom speaker name (legacy parameter)
 */
export async function createFateRoll(labelOrData, modifier = 0, actor = null, speakerName = null) {
  // Support both legacy string label and new parsed data object
  let rollData;

  if (typeof labelOrData === 'string') {
    // Legacy mode: simple label and modifier
    rollData = {
      modifier: modifier,
      skillName: null,
      skillValue: 0,
      skillSource: null,
      actionType: null,
      stuntBonus: 0,
      stuntSwap: null,
      stuntName: null,
      note: null,
      label: labelOrData
    };
  } else {
    // New mode: parsed command data
    rollData = labelOrData;
  }

  // Create the roll formula with modifier
  const formula = rollData.modifier !== 0 ? `4dF + ${rollData.modifier}` : '4dF';
  const roll = new Roll(formula);

  // Evaluate the roll
  await roll.evaluate();

  // Extract individual dice results from the roll
  const diceResults = roll.dice[0].results.map(r => r.result);
  const diceTotal = diceResults.reduce((sum, val) => sum + val, 0);
  const finalResult = roll.total;

  // Convert dice results to symbols
  const diceSymbols = diceResults.map(d => {
    if (d === 1) return '<span class="fate-die plus">+</span>';
    if (d === -1) return '<span class="fate-die minus">-</span>';
    return '<span class="fate-die blank">0</span>';
  }).join(' ');

  // Determine color based on final result compared to modifier
  let colorClass = 'result-blue'; // Default (within ±1 of modifier)

  if (finalResult < 1) {
    colorClass = 'result-red';
  } else {
    const distance = finalResult - rollData.modifier;
    if (distance > 1) {
      colorClass = 'result-green';
    } else if (distance < -1) {
      colorClass = 'result-orange';
    }
  }

  // Build the roll title with action icon if present
  let rollTitle = '';
  if (rollData.actionType) {
    rollTitle = `<span class="fate-action-icon ${rollData.actionType}"></span>`;
    const actionName = rollData.actionType.charAt(0).toUpperCase() + rollData.actionType.slice(1);
    if (rollData.skillName) {
      rollTitle += `${actionName} with ${rollData.skillName}`;
    } else {
      rollTitle += actionName;
    }
  } else if (rollData.skillName) {
    rollTitle = rollData.skillName;
  } else if (rollData.label) {
    rollTitle = rollData.label;
  } else {
    rollTitle = rollData.modifier !== 0
      ? `${game.i18n.localize("SCIONS.Roll.RollFate")} ${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier}`
      : game.i18n.localize("SCIONS.Roll.RollFate");
  }

  // Build roll description (explains the roll components)
  let rollDescription = '';

  if (rollData.skillName || rollData.stuntSwap || rollData.note) {
    rollDescription = '<div class="roll-description">';

    if (rollData.stuntSwap) {
      // Skill swap case
      const swapText = `${game.i18n.localize("SCIONS.Roll.Using")} <span class="skill-name">${rollData.stuntSwap.from} (${rollData.stuntSwap.fromValue >= 0 ? '+' : ''}${rollData.stuntSwap.fromValue})</span> ${rollData.stuntName ? `<strong>${rollData.stuntName}</strong>` : ''} ${game.i18n.localize("SCIONS.Roll.ToRoll")} <span class="skill-name">${rollData.stuntSwap.to} (${rollData.stuntSwap.toValue >= 0 ? '+' : ''}${rollData.stuntSwap.toValue})</span> ${game.i18n.localize("SCIONS.Roll.Instead")}`;
      rollDescription += swapText;

      if (rollData.stuntBonus > 0) {
        rollDescription += ` ${game.i18n.localize("SCIONS.Roll.With")} ${rollData.stuntBonus >= 0 ? '+' : ''}${rollData.stuntBonus} ${game.i18n.localize("SCIONS.Roll.StuntBonus")}`;
      }
      rollDescription += '.';
    } else if (rollData.skillName) {
      // Simple skill roll
      const sourceLabel = rollData.skillSource === 'scion' ? game.i18n.localize("SCIONS.Roll.Scion") : game.i18n.localize("SCIONS.Roll.Faction");
      rollDescription += `${sourceLabel} <span class="skill-name">${rollData.skillName} (${rollData.skillValue >= 0 ? '+' : ''}${rollData.skillValue})</span>`;

      if (rollData.stuntBonus > 0) {
        rollDescription += ` ${game.i18n.localize("SCIONS.Roll.With")} ${rollData.stuntBonus >= 0 ? '+' : ''}${rollData.stuntBonus} ${game.i18n.localize("SCIONS.Roll.StuntBonus")}`;
        if (rollData.stuntName) {
          rollDescription += ` <strong>${rollData.stuntName}</strong>`;
        }
      }
      rollDescription += '.';
    }

    if (rollData.note) {
      rollDescription += `<div class="stunt-description">${rollData.note}</div>`;
    }

    rollDescription += '</div>';
  }

  // Create speaker data
  let speaker;
  if (actor) {
    speaker = ChatMessage.getSpeaker({ actor: actor });
    // Override alias if custom speaker name provided (for Scion name)
    if (speakerName) {
      speaker.alias = speakerName;
    } else if (rollData.skillSource === 'scion' && actor.system?.scion?.name) {
      // Use Scion name for Scion skill rolls
      speaker.alias = actor.system.scion.name;
    }
  } else {
    speaker = ChatMessage.getSpeaker();
  }

  // Build calculation display
  let calculationDisplay = `<strong>${game.i18n.localize("SCIONS.Roll.Total")}:</strong> ${diceTotal}`;

  if (rollData.modifier !== 0) {
    calculationDisplay += ` ${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier}`;
  }

  calculationDisplay += ` = <strong class="${colorClass}">${finalResult}</strong>`;

  // Create chat message with roll data for Dice So Nice compatibility
  const chatData = {
    user: game.user.id,
    speaker: speaker,
    roll: roll,
    content: `
      <div class="fate-roll">
        <h3>${rollTitle}</h3>
        ${rollDescription}
        <div class="dice-results">
          ${diceSymbols}
        </div>
        <div class="roll-total">
          ${calculationDisplay}
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    sound: CONFIG.sounds.dice
  };

  // Show dice animation if Dice So Nice is active
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll, game.user, true);
  }

  return ChatMessage.create(chatData);
}
