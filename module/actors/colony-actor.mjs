/**
 * Colony Actor Class
 * Represents a colony with attributes pyramid and population tracking
 */
export class ColonyActor extends Actor {

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

    // Generate Population Track boxes based on Population attribute rank
    this._preparePopulationTrack(systemData);

    // Validate attribute column structure
    this._validateAttributeColumn(systemData);
  }

  /**
   * Generate Population Track boxes based on Population attribute rank
   * @param {Object} systemData - The actor's system data
   */
  _preparePopulationTrack(systemData) {
    const populationAttr = systemData.attributes.find(attr => attr.name === "Population");
    const populationRank = populationAttr ? populationAttr.rank : 0;

    // Generate boxes based on population rank (max 6)
    const numBoxes = Math.max(0, Math.min(6, populationRank));

    // Initialize boxes array if needed
    if (!systemData.populationTrack) {
      systemData.populationTrack = { boxes: [] };
    }
    if (!systemData.populationTrack.boxes) {
      systemData.populationTrack.boxes = [];
    }

    // Ensure we have the right number of boxes
    while (systemData.populationTrack.boxes.length < numBoxes) {
      systemData.populationTrack.boxes.push({
        value: systemData.populationTrack.boxes.length + 1,
        committed: false,
        expended: false
      });
    }

    // Remove excess boxes
    if (systemData.populationTrack.boxes.length > numBoxes) {
      systemData.populationTrack.boxes = systemData.populationTrack.boxes.slice(0, numBoxes);
    }

    // Calculate population bar for token
    // Available population = total capacity - expended boxes
    let populationCapacity = 0;
    let populationExpended = 0;

    if (systemData.populationTrack.boxes && Array.isArray(systemData.populationTrack.boxes)) {
      systemData.populationTrack.boxes.forEach(box => {
        populationCapacity += box.value || 0;
        if (box.expended) {
          populationExpended += box.value || 0;
        }
      });
    }

    // Store for token bar (showing available population)
    systemData.population = {
      value: populationCapacity - populationExpended,
      max: populationCapacity
    };
  }

  /**
   * Validate attribute column structure (Fate Core skill column rule)
   * @param {Object} systemData - The actor's system data
   */
  _validateAttributeColumn(systemData) {
    // Count attributes at each rank (1-6, excluding rank 0)
    const rankCounts = {};
    for (let rank = 1; rank <= 6; rank++) {
      rankCounts[rank] = 0;
    }

    let totalPoints = 0;
    systemData.attributes.forEach(attr => {
      const rank = attr.rank;
      if (rank >= 1 && rank <= 6) {
        rankCounts[rank]++;
        totalPoints += rank;
      }
    });

    // Calculate expected total based on generation (6 + generation)
    const generationNumber = game.scionsOfFarstar?.getGenerationNumber() || 1;
    const expectedTotal = 6 + generationNumber;

    // Validate column structure: can't have more at a rank than the rank below
    systemData.attributeValidation = {
      valid: true,
      errors: [],
      warnings: [],
      invalidRanks: {},
      totalPoints: totalPoints,
      expectedTotal: expectedTotal
    };

    // Check column structure
    for (let rank = 6; rank >= 2; rank--) {
      const currentCount = rankCounts[rank];
      const belowCount = rankCounts[rank - 1];

      if (currentCount > belowCount) {
        systemData.attributeValidation.valid = false;
        systemData.attributeValidation.errors.push(
          `Column violation: ${currentCount} attribute(s) at +${rank} but only ${belowCount} at +${rank - 1}`
        );
        systemData.attributeValidation.invalidRanks[rank] = true;
      }
    }

    // Check total points
    if (totalPoints < expectedTotal) {
      systemData.attributeValidation.warnings.push({
        type: 'low',
        message: game.i18n.format("SCIONS.Colony.Validation.TotalTooLow", {
          total: totalPoints,
          expected: expectedTotal,
          difference: expectedTotal - totalPoints
        })
      });
    } else if (totalPoints > expectedTotal) {
      systemData.attributeValidation.warnings.push({
        type: 'high',
        message: game.i18n.format("SCIONS.Colony.Validation.TotalTooHigh", {
          total: totalPoints,
          expected: expectedTotal,
          difference: totalPoints - expectedTotal
        })
      });
    }

    // Check Population rank vs Generation
    // Max Population rank = (Generation / 2, rounded down) + 1
    const populationAttr = systemData.attributes.find(attr => attr.name === "Population");
    if (populationAttr) {
      const populationRank = populationAttr.rank || 0;
      const maxPopulationRank = Math.floor(generationNumber / 2) + 1;

      if (populationRank > maxPopulationRank) {
        systemData.attributeValidation.warnings.push({
          type: 'high',
          message: game.i18n.format("SCIONS.Colony.Validation.PopulationTooHigh", {
            populationRank: populationRank,
            maxRank: maxPopulationRank,
            generation: generationNumber
          })
        });
      }
    }

    // Store counts for display
    systemData.attributeRankCounts = rankCounts;
  }

  /**
   * Override modifyTokenAttribute to lock the population bar
   */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    if (attribute === 'population') {
      ui.notifications.warn("Population cannot be edited directly. Use the character sheet to manage the population track.");
      return this;
    }
    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
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
      bar1: { attribute: "population" },               // Primary bar: Population
      disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY   // Colonies are friendly by default
    };

    this.updateSource({ prototypeToken });
  }

  /**
   * Roll a Fate dice check (4dF + modifier)
   * @param {String} attributeName - The attribute being rolled
   * @param {Number} modifier - The modifier value
   * @param {String} label - Label for the roll
   */
  async rollFateDice(attributeName, modifier = 0, label = null) {
    const rollLabel = label || attributeName;

    // Use the imported function from main module
    const { createFateRoll } = await import('../scions-of-farstar.mjs');

    return createFateRoll(rollLabel, modifier, this);
  }
}
