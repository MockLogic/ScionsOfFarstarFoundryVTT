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
    const birthGeneration = systemData.birthGeneration ?? 0;
    const ageInGenerations = currentGeneration - birthGeneration;

    // Age stages: each stage = 1 generation
    // Child = 0, Youthful = 1, Seasoned = 2, Older = 3, Geriatric = 4, Ancient = 5, Dead = 6+
    const stages = ['child', 'youthful', 'seasoned', 'older', 'geriatric', 'ancient'];

    // Determine current age stage based on whole generations
    let currentAgeStage = null;
    let currentAgeIndex = -1;

    if (ageInGenerations < 0) {
      // Not yet born
      currentAgeStage = null;
      currentAgeIndex = -1;
    } else if (ageInGenerations <= 5) {
      // Within the age track
      currentAgeIndex = ageInGenerations;
      currentAgeStage = stages[currentAgeIndex];
    } else {
      // Beyond Ancient (dead from old age)
      currentAgeIndex = stages.length; // 6 or higher
      currentAgeStage = null;
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
      // They died when they aged one generation past maxAgeIndex
      deathGeneration = birthGeneration + maxAgeIndex + 1;
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

    // Share to Chat button
    html.find('.share-to-chat').click(this._onShareToChat.bind(this));

    // Age scar checkboxes
    html.find('.age-scar').click(this._onAgeScarToggle.bind(this));

    // Skill roll button
    html.find('.roll-npc-skill').click(this._onRollSkill.bind(this));

    // Clear background button
    html.find('.clear-bg-button').click(this._onClearBackground.bind(this));
  }

  /**
   * Share NPC details to chat
   */
  async _onShareToChat(event) {
    event.preventDefault();

    const system = this.item.system;
    const npcName = this.item.name;
    const npcData = this._calculateNpcData(system);

    // Build the chat card HTML
    let cardHTML = `
      <div class="npc-share-card">
        <div class="npc-header">
    `;

    // Add portrait if it exists and is not default
    const hasCustomPortrait = this.item.img && this.item.img !== "icons/svg/mystery-man.svg";
    if (hasCustomPortrait) {
      const bgStyle = system.iconBackground ? `background-color: ${system.iconBackground};` : '';
      cardHTML += `<img class="npc-portrait" src="${this.item.img}" style="${bgStyle}" width="80" height="80"/>`;
    }

    cardHTML += `<h3>${npcName}</h3>
        </div>
    `;

    // Add current age
    cardHTML += `<div class="npc-section">`;
    if (npcData.isDeceased) {
      cardHTML += `<div class="age-entry deceased"><strong>Status:</strong> Deceased (Gen ${npcData.deathGeneration})</div>`;
    } else {
      cardHTML += `<div class="age-entry"><strong>Age:</strong> ${npcData.currentAgeLabel}</div>`;
    }
    cardHTML += `</div>`;

    // Add aspect if present
    if (system.aspect) {
      cardHTML += `<div class="npc-section">`;
      cardHTML += `<div class="section-title">Aspect</div>`;
      cardHTML += `<div class="aspect-entry">${system.aspect}</div>`;
      cardHTML += `</div>`;
    }

    // Add skill if present
    if (system.skillName) {
      cardHTML += `<div class="npc-section">`;
      cardHTML += `<div class="section-title">Notable Skill</div>`;
      cardHTML += `<div class="skill-entry"><strong>${system.skillName}</strong> ${this._formatSkillValue(system.skillValue)}</div>`;
      cardHTML += `</div>`;
    }

    cardHTML += `</div>`;

    // Create the chat message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content: cardHTML,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /**
   * Format skill value with + or - sign
   */
  _formatSkillValue(value) {
    const num = value || 0;
    return num >= 0 ? `+${num}` : `${num}`;
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
   * Handle rolling the NPC's notable skill
   * @param {Event} event - The click event
   */
  async _onRollSkill(event) {
    event.preventDefault();

    const skillName = this.item.system.skillName;
    const skillValue = this.item.system.skillValue || 0;

    if (!skillName) return;

    // Import the createFateRoll function
    const { createFateRoll } = await import("../scions-of-farstar.mjs");

    // Create the label and roll
    const label = `${this.item.name}: ${skillName}`;
    await createFateRoll(label, skillValue, null, this.item.name);
  }

  /**
   * Handle clearing the icon background color
   * @param {Event} event - The click event
   */
  async _onClearBackground(event) {
    event.preventDefault();
    await this.item.update({ 'system.iconBackground': '' });
  }
}
