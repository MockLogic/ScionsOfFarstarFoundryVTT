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

    // Initialize stress boxes if needed
    if (!Array.isArray(scion.stress.boxes) || scion.stress.boxes.length !== scion.stress.max) {
      scion.stress.boxes = [];
      for (let i = 0; i < scion.stress.max; i++) {
        scion.stress.boxes.push({ value: false });
      }
    }
  }

  /**
   * Prepare Faction-specific derived data
   */
  _prepareFactionData(systemData) {
    const faction = systemData.faction;

    // Calculate total capability points
    const capabilities = Object.values(faction.capabilities);
    faction.totalCapabilityPoints = capabilities.reduce((sum, cap) => sum + cap.value, 0);

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

    // Count stunts
    faction.stuntCount = faction.stunts.filter(s => s.name || s.description).length;

    // Calculate Refresh
    // Formula: 3 + Significant Milestones - Extra Stunts (beyond 3)
    // Refresh minimum = 1
    const significantMilestones = game.scionsOfFarstar.getSignificantMilestones();
    const extraStunts = Math.max(0, faction.stuntCount - 3);
    const calculatedRefresh = Math.max(1, 3 + significantMilestones - extraStunts);

    // Auto-update refresh value
    faction.refresh.value = calculatedRefresh;
    faction.refreshValid = true; // Always valid since it's calculated
    faction.expectedRefresh = calculatedRefresh;
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
}
