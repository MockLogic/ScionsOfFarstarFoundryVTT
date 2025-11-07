/**
 * Faction-Scion Actor Class
 * Represents a combined Faction and Scion character sheet
 */
export class FactionScionActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Prepare derived data for the actor
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.scionsOfFarstar || {};

    // Prepare Scion data
    this._prepareScionData(systemData);

    // Prepare Faction data
    this._prepareFactionData(systemData);
  }

  /**
   * Prepare Scion-specific derived data
   */
  _prepareScionData(systemData) {
    const scion = systemData.scion;

    // Count age stages passed for skill advancement tracking
    let agesPassed = 0;
    for (const [key, stage] of Object.entries(scion.ageTrack)) {
      if (stage.passed) agesPassed++;
    }
    scion.agesPassed = agesPassed;

    // Calculate total skill points (base pyramid + age advancements)
    const skills = Object.values(scion.skills);
    scion.totalSkillPoints = skills.reduce((sum, skill) => sum + skill.value, 0);

    // Validate skills
    const maxSkill = game.scionsOfFarstar.getMaxSkill();
    const startingSkillTotal = game.scionsOfFarstar.getStartingSkillTotal();
    const expectedTotal = startingSkillTotal + agesPassed;

    // Track individual skill validity
    scion.skillValidation = {
      valid: true,
      errors: [],
      invalidSkills: {}
    };

    // Check each skill
    for (const [key, skill] of Object.entries(scion.skills)) {
      const value = skill.value;
      const issues = [];

      // Check minimum (-1)
      if (value < -1) {
        issues.push('below_min');
        scion.skillValidation.valid = false;
        scion.skillValidation.errors.push(`${skill.label} cannot be less than -1`);
      }

      // Check maximum (maxSkill, typically +4)
      if (value > maxSkill) {
        issues.push('above_max');
        scion.skillValidation.valid = false;
        scion.skillValidation.errors.push(`${skill.label} exceeds maximum of +${maxSkill}`);
      }

      // Store validation state for this skill
      if (issues.length > 0) {
        scion.skillValidation.invalidSkills[key] = issues;
      }
    }

    // Check total skill points (starting + ages passed)
    if (scion.totalSkillPoints > expectedTotal) {
      scion.skillValidation.valid = false;
      scion.skillValidation.errors.push(`Total skill points (${scion.totalSkillPoints}) exceeds expected (${expectedTotal})`);
      scion.skillValidation.totalTooHigh = true;
    } else if (scion.totalSkillPoints < expectedTotal) {
      scion.skillValidation.valid = false;
      scion.skillValidation.errors.push(`Total skill points (${scion.totalSkillPoints}) is below expected (${expectedTotal})`);
      scion.skillValidation.totalTooLow = true;
    }

    // Store expected total for display
    scion.expectedSkillTotal = expectedTotal;

    // Initialize stress boxes if needed
    if (!Array.isArray(scion.stress.boxes) || scion.stress.boxes.length !== scion.stress.max) {
      scion.stress.boxes = [];
      for (let i = 0; i < scion.stress.max; i++) {
        scion.stress.boxes.push({ value: false });
      }
    }

    // Calculate trauma capacity and usage for token bar
    // Trauma capacity = stress boxes + available age track slots (not passed, not scarred)
    let availableAgeSlots = 0;
    for (const [key, stage] of Object.entries(scion.ageTrack)) {
      if (!stage.passed && !stage.scar) {
        availableAgeSlots++;
      }
    }

    // Count used trauma (checked stress boxes + wounds in age track)
    const usedStressBoxes = scion.stress.boxes.filter(box => box.value).length;
    let ageWounds = 0;
    for (const [key, stage] of Object.entries(scion.ageTrack)) {
      if (stage.wound) {
        ageWounds++;
      }
    }

    const traumaCapacity = scion.stress.max + availableAgeSlots;
    const traumaUsed = usedStressBoxes + ageWounds;

    // Store for token bar (value = remaining, max = capacity)
    scion.trauma = {
      value: traumaCapacity - traumaUsed,  // Remaining capacity
      max: traumaCapacity                   // Total capacity
    };
  }

  /**
   * Prepare Faction-specific derived data
   */
  _prepareFactionData(systemData) {
    const faction = systemData.faction;

    // Calculate total capability points
    const capabilities = Object.values(faction.capabilities);
    faction.totalCapabilityPoints = capabilities.reduce((sum, cap) => sum + cap.value, 0);

    // Validate capabilities
    const maxCapability = game.scionsOfFarstar.getMaxCapability();
    const expectedTotal = game.scionsOfFarstar.getExpectedCapabilityTotal();

    // Track individual capability validity
    faction.capabilityValidation = {
      valid: true,
      errors: [],
      invalidCapabilities: {}
    };

    // Check each capability
    for (const [key, capability] of Object.entries(faction.capabilities)) {
      const value = capability.value;
      const issues = [];

      // Special check for People capability (cannot be negative, min 0)
      if (key === 'people') {
        if (value < 0) {
          issues.push('below_min');
          faction.capabilityValidation.valid = false;
          faction.capabilityValidation.errors.push(`${capability.label} cannot be negative`);
        }
      } else {
        // Check minimum (-1) for other capabilities
        if (value < -1) {
          issues.push('below_min');
          faction.capabilityValidation.valid = false;
          faction.capabilityValidation.errors.push(`${capability.label} cannot be less than -1`);
        }
      }

      // Check maximum (baseMaxCapability + majorMilestones)
      if (value > maxCapability) {
        issues.push('above_max');
        faction.capabilityValidation.valid = false;
        faction.capabilityValidation.errors.push(`${capability.label} exceeds maximum of +${maxCapability}`);
      }

      // Store validation state for this capability
      if (issues.length > 0) {
        faction.capabilityValidation.invalidCapabilities[key] = issues;
      }
    }

    // Check total capability points
    if (faction.totalCapabilityPoints > expectedTotal) {
      faction.capabilityValidation.valid = false;
      faction.capabilityValidation.errors.push(`Total capability points (${faction.totalCapabilityPoints}) exceeds expected (${expectedTotal})`);
      faction.capabilityValidation.totalTooHigh = true;
    } else if (faction.totalCapabilityPoints < expectedTotal) {
      faction.capabilityValidation.valid = false;
      faction.capabilityValidation.errors.push(`Total capability points (${faction.totalCapabilityPoints}) is below expected (${expectedTotal})`);
      faction.capabilityValidation.totalTooLow = true;
    }

    // Generate People Track boxes based on People capability rating
    const peopleRating = faction.capabilities.people.value;
    const oldBoxes = faction.peopleTrack.boxes || [];
    faction.peopleTrack.boxes = [];
    for (let i = 1; i <= peopleRating; i++) {
      faction.peopleTrack.boxes.push({
        value: i,
        committed: oldBoxes[i - 1]?.committed || false,
        expended: oldBoxes[i - 1]?.expended || false
      });
    }

    // Count stunts (ensure stunts is an array)
    if (!Array.isArray(faction.stunts)) {
      faction.stunts = [];
    }
    faction.stuntCount = faction.stunts.filter(s => s.name || s.description).length;

    // Calculate Refresh
    // Formula: 3 + Major Milestones - Extra Stunts (beyond 3)
    // Allow negative values to show when too many stunts are taken
    const majorMilestones = game.scionsOfFarstar.getMajorMilestones();
    const extraStunts = Math.max(0, faction.stuntCount - 3);
    const calculatedRefresh = 3 + majorMilestones - extraStunts;

    // Auto-update refresh value (no minimum, can go negative)
    faction.refresh.value = calculatedRefresh;
    faction.refreshValid = calculatedRefresh >= 1; // Invalid if below 1
    faction.expectedRefresh = calculatedRefresh;

    // Sync Fate Points max with Refresh (for display reference, value can exceed max)
    faction.fatePoints.max = calculatedRefresh;

    // Calculate faction trauma capacity and usage for token bar
    // Trauma capacity = sum of available people track boxes + available consequences
    // People track boxes have dynamic values (1, 2, 3, etc.)
    // Consequences have fixed values: minor=2, minor2=2, moderate=4, severe=6

    // Calculate available people track capacity
    let peopleCapacity = 0;
    if (faction.peopleTrack.boxes && Array.isArray(faction.peopleTrack.boxes)) {
      for (const box of faction.peopleTrack.boxes) {
        peopleCapacity += box.value || 0;
      }
    }

    // Calculate used people track (committed or expended boxes)
    let peopleUsed = 0;
    if (faction.peopleTrack.boxes && Array.isArray(faction.peopleTrack.boxes)) {
      for (const box of faction.peopleTrack.boxes) {
        if (box.committed || box.expended) {
          peopleUsed += box.value || 0;
        }
      }
    }

    // Calculate available consequences capacity (only enabled consequences)
    let consequencesCapacity = 0;
    const consequences = systemData.consequences?.consequences;
    if (consequences) {
      // Minor consequence: always available, worth 2
      consequencesCapacity += 2;

      // Minor2 consequence: only if enabled, worth 2
      if (consequences.minor2?.enabled) {
        consequencesCapacity += 2;
      }

      // Moderate consequence: always available, worth 4
      consequencesCapacity += 4;

      // Severe consequence: always available, worth 6
      consequencesCapacity += 6;
    }

    // Calculate used consequences (filled in consequences)
    let consequencesUsed = 0;
    if (consequences) {
      // Minor consequence: used if has a value
      if (consequences.minor?.value) {
        consequencesUsed += 2;
      }

      // Minor2 consequence: used if enabled AND has a value
      if (consequences.minor2?.enabled && consequences.minor2?.value) {
        consequencesUsed += 2;
      }

      // Moderate consequence: used if has a value
      if (consequences.moderate?.value) {
        consequencesUsed += 4;
      }

      // Severe consequence: used if has a value
      if (consequences.severe?.value) {
        consequencesUsed += 6;
      }
    }

    // Total faction trauma
    const factionTraumaCapacity = peopleCapacity + consequencesCapacity;
    const factionTraumaUsed = peopleUsed + consequencesUsed;

    // Store for token bar (value = remaining, max = capacity)
    faction.trauma = {
      value: factionTraumaCapacity - factionTraumaUsed,  // Remaining capacity
      max: factionTraumaCapacity                          // Total capacity
    };
  }

  /**
   * Validate Fate pyramid structure for skills
   * Returns an object with validation results
   */
  validateSkillPyramid() {
    const skills = Object.values(this.system.scion.skills);
    const maxSkill = game.scionsOfFarstar.getMaxSkill();

    return this._validatePyramid(skills, maxSkill, 'skills');
  }

  /**
   * Validate Fate pyramid structure for capabilities
   * Returns an object with validation results
   */
  validateCapabilityPyramid() {
    const capabilities = Object.values(this.system.faction.capabilities);
    const maxCapability = game.scionsOfFarstar.getMaxCapability();

    return this._validatePyramid(capabilities, maxCapability, 'capabilities');
  }

  /**
   * Generic pyramid validator
   * @param {Array} items - Array of skills or capabilities with .value property
   * @param {Number} maxRating - Maximum allowed rating
   * @param {String} type - 'skills' or 'capabilities' for error messages
   */
  _validatePyramid(items, maxRating, type) {
    const counts = {};
    let valid = true;
    const errors = [];

    // Count items at each rating level
    items.forEach(item => {
      const rating = item.value;
      counts[rating] = (counts[rating] || 0) + 1;

      // Check if any exceed max
      if (rating > maxRating) {
        valid = false;
        errors.push(`${type} rating ${rating} exceeds maximum of ${maxRating}`);
      }
    });

    // Validate pyramid structure: each level should have more items than the level above
    const ratings = Object.keys(counts).map(Number).sort((a, b) => b - a).filter(r => r > 0);

    for (let i = 0; i < ratings.length - 1; i++) {
      const higher = ratings[i];
      const lower = ratings[i + 1];

      if (counts[higher] > counts[lower]) {
        valid = false;
        errors.push(`Pyramid violation: ${counts[higher]} at +${higher} but only ${counts[lower]} at +${lower}`);
      }
    }

    // Check apex (should have exactly 1 at highest non-zero rating)
    if (ratings.length > 0 && counts[ratings[0]] !== 1) {
      valid = false;
      errors.push(`Pyramid apex should have exactly 1 ${type} at highest rating`);
    }

    return {
      valid,
      errors,
      counts,
      maxRating
    };
  }

  /**
   * Override token bar attribute updates to make trauma read-only
   * @override
   */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    // Block direct updates to trauma (it's calculated from stress/age track)
    if (attribute === 'scion.trauma') {
      ui.notifications.warn("Trauma cannot be edited directly. Use the character sheet to manage stress and age track.");
      return this;
    }

    // Block direct updates to faction trauma (it's calculated from people track/consequences)
    if (attribute === 'faction.trauma') {
      ui.notifications.warn("Faction Trauma cannot be edited directly. Use the character sheet to manage people track and consequences.");
      return this;
    }

    // Allow other attributes to be modified normally
    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
  }

  /**
   * Roll a Fate dice check (4dF + modifier)
   * @param {String} skillOrCap - The skill/capability being rolled
   * @param {Number} modifier - The modifier value
   * @param {String} label - Label for the roll
   * @param {String} speakerName - Optional custom speaker name for the roll
   */
  async rollFateDice(skillOrCap, modifier = 0, label = null, speakerName = null) {
    const rollLabel = label || skillOrCap;

    // Use the imported function from main module
    const { rollFateDice, createFateRoll } = await import('../scions-of-farstar.mjs');

    return createFateRoll(rollLabel, modifier, this, speakerName);
  }

  /**
   * Configure default token settings for new actors
   * @override
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    // Set default token configuration
    const prototypeToken = {
      displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,  // Always show name
      displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,  // Always show bars
      bar1: { attribute: "scion.trauma" },             // Primary bar: Trauma
      bar2: { attribute: "faction.fatePoints" }        // Secondary bar: Fate Points
    };

    this.updateSource({ prototypeToken });
  }
}
