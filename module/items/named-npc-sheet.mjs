/**
 * Named NPC Item Sheet
 * Handles the UI for minor named NPCs that can be embedded in actor sheets
 */
export class NamedNpcSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "item", "named-npc"],
      template: "systems/scions-of-farstar/templates/item/named-npc-sheet.hbs",
      width: 600,
      height: 700
    });
  }

  /** @override */
  async getData(options) {
    const context = super.getData(options);

    // Use a safe clone of item data for manipulation
    const itemData = this.item.toObject(false);

    // Add system data for easy access
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Calculate NPC age data
    context.npcData = this._calculateNpcData(context.system);

    return context;
  }

  /**
   * Calculate all NPC age-related data for display
   * @param {Object} systemData - The item's system data
   * @returns {Object} - Calculated NPC data
   */
  _calculateNpcData(systemData) {
    const currentGeneration = game.scionsOfFarstar.getGenerationNumber();
    const birthGeneration = systemData.birthGeneration || 0;
    const ageInGenerations = currentGeneration - birthGeneration;

    // Age stages with generation thresholds
    // Child: 0-15 years (0-0.75 generations, ~20 years per generation)
    // Youthful: 16-29 years (0.8-1.45 gen)
    // Seasoned: 30-49 years (1.5-2.45 gen)
    // Older: 50-69 years (2.5-3.45 gen)
    // Geriatric: 70-89 years (3.5-4.45 gen)
    // Ancient: 90+ years (4.5+ gen)
    const stages = ['child', 'youthful', 'seasoned', 'older', 'geriatric', 'ancient'];
    const ageThresholds = [0.75, 1.45, 2.45, 3.45, 4.45, Infinity];

    // Determine current age stage based on generations
    let currentAgeStage = null;
    let currentAgeIndex = -1;
    for (let i = 0; i < stages.length; i++) {
      if (ageInGenerations <= ageThresholds[i]) {
        currentAgeStage = stages[i];
        currentAgeIndex = i;
        break;
      }
    }

    // Count scars from the bottom up
    const ageTrack = systemData.ageTrack;
    let scarCount = 0;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (ageTrack[stages[i]].scar) {
        scarCount++;
      } else {
        break; // Scars must be contiguous from bottom
      }
    }

    // Maximum age stage is reduced by number of scars
    const maxAgeIndex = stages.length - 1 - scarCount;

    // NPC is deceased if their current age exceeds their max age
    const isDeceased = currentAgeIndex > maxAgeIndex;

    // Calculate death generation (when they crossed beyond max age)
    let deathGeneration = null;
    if (isDeceased) {
      // They died when they aged past maxAgeIndex
      // Death occurred at the threshold of the stage after maxAgeIndex
      const deathAgeInGenerations = ageThresholds[maxAgeIndex] + 0.01; // Just past the threshold
      deathGeneration = Math.floor(birthGeneration + deathAgeInGenerations);
    }

    // Build age track display data
    const ageTrackDisplay = [];
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageData = ageTrack[stage];

      // Can check scar if it's the next one down from the first scarred (or if already scarred)
      let firstScarredIndex = stages.length;
      for (let j = stages.length - 1; j >= 0; j--) {
        if (ageTrack[stages[j]].scar) {
          firstScarredIndex = j;
        }
      }
      const canCheckScar = (i === firstScarredIndex - 1) || stageData.scar;

      ageTrackDisplay.push({
        key: stage,
        label: stageData.label,
        ageRange: stageData.ageRange,
        scar: stageData.scar,
        isCurrent: !isDeceased && currentAgeStage === stage,
        isPast: !isDeceased && currentAgeIndex > i,
        canCheckScar: canCheckScar
      });
    }

    return {
      ageInGenerations: ageInGenerations,
      currentAgeStage: currentAgeStage,
      currentAgeLabel: currentAgeStage ? ageTrack[currentAgeStage].label : 'Unknown',
      isDeceased: isDeceased,
      deathGeneration: deathGeneration,
      ageTrackDisplay: ageTrackDisplay
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Age scar checkboxes
    html.find('.age-scar').click(this._onAgeScarToggle.bind(this));

    // Make image clickable to change it
    html.find('.profile-img').click(this._onEditImage.bind(this));
  }

  /**
   * Handle toggling age scars
   * @param {Event} event - The click event
   */
  async _onAgeScarToggle(event) {
    event.preventDefault();
    const checkbox = event.currentTarget;
    const stage = checkbox.dataset.stage;

    if (checkbox.disabled || checkbox.classList.contains('disabled-checkbox')) {
      return;
    }

    // Toggle the scar value
    const currentValue = this.item.system.ageTrack[stage].scar;
    await this.item.update({
      [`system.ageTrack.${stage}.scar`]: !currentValue
    });
  }

  /**
   * Handle clicking the image to open file picker
   * @param {Event} event - The click event
   */
  async _onEditImage(event) {
    event.preventDefault();
    const current = this.item.img;
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        this.item.update({ img: path });
      }
    });
    return fp.browse();
  }
}
