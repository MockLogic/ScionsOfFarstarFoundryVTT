/**
 * Faction-Scion Actor Sheet
 * Handles the UI for the combined Faction-Scion character sheet
 */
export class FactionScionSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "actor", "faction-scion"],
      template: "systems/scions-of-farstar/templates/actor/faction-scion-sheet.hbs",
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "faction" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  async getData(options) {
    const context = super.getData(options);

    // Use a safe clone of actor data for manipulation
    const actorData = this.actor.toObject(false);

    // Add system data for easy access
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Add validation results
    context.skillValidation = this.actor.validateSkillPyramid();
    context.capabilityValidation = this.actor.validateCapabilityPyramid();

    // Determine current age stage
    context.currentAgeStage = this._determineCurrentAge(context.system.scion.ageTrack);

    // Add age track validation info (which checkboxes can be clicked)
    context.ageTrackValidation = this._getAgeTrackValidation(context.system.scion.ageTrack);

    // Add game globals for display
    context.globals = {
      generationNumber: game.scionsOfFarstar.getGenerationNumber(),
      significantMilestones: game.scionsOfFarstar.getSignificantMilestones(),
      majorMilestones: game.settings.get('scions-of-farstar', 'majorMilestones'),
      maxSkill: game.scionsOfFarstar.getMaxSkill(),
      maxCapability: game.scionsOfFarstar.getMaxCapability()
    };

    // Enrich text fields (for rich text editors)
    context.enrichedScionAspect = await TextEditor.enrichHTML(context.system.scion.aspects.scionAspect.value, { async: true });
    context.enrichedHighConcept = await TextEditor.enrichHTML(context.system.aspects.highConcept.value, { async: true });
    context.enrichedTrouble = await TextEditor.enrichHTML(context.system.aspects.trouble.value, { async: true });
    context.enrichedInheritance = await TextEditor.enrichHTML(context.system.faction.aspects.inheritance.value, { async: true });

    return context;
  }

  /**
   * Determine the current age stage based on which stages are marked as "Passed"
   * Current age = the first stage after the last "Passed" stage
   * @param {Object} ageTrack - The age track object
   * @returns {string|null} - The key of the current age stage
   */
  _determineCurrentAge(ageTrack) {
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];

    // Find the last stage marked as "Passed"
    let lastPassedIndex = -1;
    for (let i = 0; i < stages.length; i++) {
      if (ageTrack[stages[i]].passed) {
        lastPassedIndex = i;
      }
    }

    // Current age is the stage after the last passed one
    // If no stages are passed, current age is the first stage
    const currentIndex = lastPassedIndex + 1;

    // If we've passed Ancient (index 4), there's no current age
    if (currentIndex >= stages.length) {
      return null;
    }

    return stages[currentIndex];
  }

  /**
   * Determine which age track checkboxes can be clicked based on validation rules
   * @param {Object} ageTrack - The age track object
   * @returns {Object} - Object with enabled status for each stage's passed/scar checkboxes
   */
  _getAgeTrackValidation(ageTrack) {
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];
    const validation = {};

    // Find last passed and first scarred
    let lastPassedIndex = -1;
    let firstScarredIndex = stages.length;

    for (let i = 0; i < stages.length; i++) {
      if (ageTrack[stages[i]].passed) {
        lastPassedIndex = i;
      }
      if (ageTrack[stages[i]].scar && i < firstScarredIndex) {
        firstScarredIndex = i;
      }
    }

    // Determine which checkboxes can be clicked
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      validation[stage] = {
        // Passed can be checked if: it's the next one after last passed, OR it's already checked
        canCheckPassed: (i === lastPassedIndex + 1) || ageTrack[stage].passed,
        // Scar can be checked if: it's the next one before first scarred, OR it's already checked
        canCheckScar: (i === firstScarredIndex - 1) || ageTrack[stage].scar
      };
    }

    return validation;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers
    html.find('.roll-skill').click(this._onRollSkill.bind(this));
    html.find('.roll-capability').click(this._onRollCapability.bind(this));
    html.find('.roll-fate').click(this._onRollFate.bind(this));
    html.find('.roll-fate-header').click(this._onRollFate.bind(this));

    // Stress box handlers
    html.find('.stress-box').click(this._onToggleStress.bind(this));
    html.find('.stress-size-checkbox').click(this._onToggleStressSize.bind(this));
    html.find('.people-box').click(this._onTogglePeople.bind(this));

    // Age track handlers
    html.find('.age-passed').click(this._onToggleAgePassed.bind(this));
    html.find('.wound-stress-box').click(this._onToggleAgeWound.bind(this));
    html.find('.age-invoke-used').click(this._onToggleAgeInvokeUsed.bind(this));
    html.find('.age-scar').click(this._onToggleAgeScar.bind(this));

    // Fate point adjusters
    html.find('.fate-points-increment').click(this._onAdjustFatePoints.bind(this, 1));
    html.find('.fate-points-decrement').click(this._onAdjustFatePoints.bind(this, -1));

    // Stunt/Extra handlers
    html.find('.stunt-add').click(this._onAddStunt.bind(this));
    html.find('.stunt-delete').click(this._onDeleteStunt.bind(this));
    html.find('.extra-add').click(this._onAddExtra.bind(this));
    html.find('.extra-delete').click(this._onDeleteExtra.bind(this));

    // Drag events for macro creation
    html.find('.rollable').each((i, li) => {
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });
  }

  /**
   * Handle rolling a skill
   */
  async _onRollSkill(event) {
    event.preventDefault();
    const skillKey = event.currentTarget.dataset.skill;
    const skill = this.actor.system.scion.skills[skillKey];

    if (skill) {
      const scionName = this.actor.system.scion.name || "Scion";
      const label = `${skill.label} (+${skill.value})`;
      await this.actor.rollFateDice(skill.label, skill.value, label, scionName);
    }
  }

  /**
   * Handle rolling a capability
   */
  async _onRollCapability(event) {
    event.preventDefault();
    const capKey = event.currentTarget.dataset.capability;
    const capability = this.actor.system.faction.capabilities[capKey];

    if (capability) {
      const label = `${capability.label} (+${capability.value})`;
      await this.actor.rollFateDice(capability.label, capability.value, label);
    }
  }

  /**
   * Handle rolling 4dF without modifiers
   */
  async _onRollFate(event) {
    event.preventDefault();
    await this.actor.rollFateDice('4dF', 0, '4dF');
  }

  /**
   * Toggle a stress box
   */
  async _onToggleStress(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const boxes = [...this.actor.system.scion.stress.boxes]; // Create copy to trigger update

    if (boxes[index]) {
      boxes[index].value = !boxes[index].value;
      await this.actor.update({ 'system.scion.stress.boxes': boxes });
    }
  }

  /**
   * Toggle stress track size between 3 and 5 boxes
   */
  async _onToggleStressSize(event) {
    event.preventDefault();
    const currentMax = this.actor.system.scion.stress.max;
    const newMax = currentMax === 3 ? 5 : 3;

    // Build new boxes array
    const boxes = [];
    for (let i = 0; i < newMax; i++) {
      // Preserve existing box values, default to false for new boxes
      boxes.push({
        value: this.actor.system.scion.stress.boxes[i]?.value || false
      });
    }

    await this.actor.update({
      'system.scion.stress.max': newMax,
      'system.scion.stress.boxes': boxes
    });
  }

  /**
   * Toggle a people track box through three states: empty → committed → expended → empty
   */
  async _onTogglePeople(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const boxes = [...this.actor.system.faction.peopleTrack.boxes]; // Create copy to trigger update

    if (boxes[index]) {
      const box = boxes[index];

      // Cycle through states: empty → committed → expended → empty
      if (!box.committed && !box.expended) {
        // Empty → Committed
        box.committed = true;
        box.expended = false;
      } else if (box.committed && !box.expended) {
        // Committed → Expended
        box.committed = false;
        box.expended = true;
      } else {
        // Expended → Empty
        box.committed = false;
        box.expended = false;
      }

      await this.actor.update({ 'system.faction.peopleTrack.boxes': boxes });
    }
  }

  /**
   * Toggle age track "passed" checkbox
   * Validation: Passed must be checked from youngest to oldest
   * When checked: clears and hides Wound, Invoke, Scar
   * When unchecked: reverts to normal (Wound visible, Invoke hidden)
   */
  async _onToggleAgePassed(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.scion.ageTrack[stage].passed;
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];
    const stageIndex = stages.indexOf(stage);

    if (!current) {
      // Checking Passed: validate that all previous stages are passed
      for (let i = 0; i < stageIndex; i++) {
        if (!this.actor.system.scion.ageTrack[stages[i]].passed) {
          ui.notifications.warn(`You must pass ${stages[i]} before passing ${stage}.`);
          return;
        }
      }

      // Checking Passed: clear Wound, Invoke, and Scar
      await this.actor.update({
        [`system.scion.ageTrack.${stage}.passed`]: true,
        [`system.scion.ageTrack.${stage}.wound`]: false,
        [`system.scion.ageTrack.${stage}.freeInvokeUsed`]: false,
        [`system.scion.ageTrack.${stage}.scar`]: false
      });
    } else {
      // Unchecking Passed: validate that no later stages are passed
      for (let i = stageIndex + 1; i < stages.length; i++) {
        if (this.actor.system.scion.ageTrack[stages[i]].passed) {
          ui.notifications.warn(`You must uncheck ${stages[i]} before unchecking ${stage}.`);
          return;
        }
      }

      // Unchecking Passed: just uncheck it, revert to normal state
      await this.actor.update({ [`system.scion.ageTrack.${stage}.passed`]: false });
    }
  }

  /**
   * Toggle age track "wound" checkbox
   * When unchecked: also clears Invoke checkbox
   */
  async _onToggleAgeWound(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.scion.ageTrack[stage].wound;

    if (current) {
      // Unchecking Wound: also clear Invoke
      await this.actor.update({
        [`system.scion.ageTrack.${stage}.wound`]: false,
        [`system.scion.ageTrack.${stage}.freeInvokeUsed`]: false
      });
    } else {
      // Checking Wound: just check it
      await this.actor.update({ [`system.scion.ageTrack.${stage}.wound`]: true });
    }
  }

  /**
   * Toggle age track "free invoke used" checkbox
   */
  async _onToggleAgeInvokeUsed(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.scion.ageTrack[stage].freeInvokeUsed;
    await this.actor.update({ [`system.scion.ageTrack.${stage}.freeInvokeUsed`]: !current });
  }

  /**
   * Toggle age track "scar" checkbox
   * Validation: Scars must be checked from oldest to youngest
   * When checked: clears and hides Wound, Invoke, Passed
   * When unchecked: reverts to normal (Wound visible, Invoke hidden)
   */
  async _onToggleAgeScar(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.scion.ageTrack[stage].scar;
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];
    const stageIndex = stages.indexOf(stage);

    if (!current) {
      // Checking Scar: validate that all later stages are scarred
      for (let i = stageIndex + 1; i < stages.length; i++) {
        if (!this.actor.system.scion.ageTrack[stages[i]].scar) {
          ui.notifications.warn(`You must scar ${stages[i]} before scarring ${stage}.`);
          return;
        }
      }

      // Checking Scar: clear Wound, Invoke, and Passed
      await this.actor.update({
        [`system.scion.ageTrack.${stage}.scar`]: true,
        [`system.scion.ageTrack.${stage}.wound`]: false,
        [`system.scion.ageTrack.${stage}.freeInvokeUsed`]: false,
        [`system.scion.ageTrack.${stage}.passed`]: false
      });
    } else {
      // Unchecking Scar: validate that no earlier stages are scarred
      for (let i = 0; i < stageIndex; i++) {
        if (this.actor.system.scion.ageTrack[stages[i]].scar) {
          ui.notifications.warn(`You must uncheck ${stages[i]} before unchecking ${stage}.`);
          return;
        }
      }

      // Unchecking Scar: just uncheck it, revert to normal state
      await this.actor.update({ [`system.scion.ageTrack.${stage}.scar`]: false });
    }
  }

  /**
   * Adjust fate points up or down
   */
  async _onAdjustFatePoints(delta, event) {
    event.preventDefault();
    const current = this.actor.system.faction.fatePoints.value;
    const newValue = Math.max(0, current + delta);
    await this.actor.update({ 'system.faction.fatePoints.value': newValue });
  }

  /**
   * Add a new stunt
   */
  async _onAddStunt(event) {
    event.preventDefault();
    const stunts = [...this.actor.system.faction.stunts];
    stunts.push({ name: "", description: "" });
    await this.actor.update({ 'system.faction.stunts': stunts });
  }

  /**
   * Delete a stunt
   */
  async _onDeleteStunt(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const stunts = [...this.actor.system.faction.stunts];
    stunts.splice(index, 1);
    await this.actor.update({ 'system.faction.stunts': stunts });
  }

  /**
   * Add a new extra
   */
  async _onAddExtra(event) {
    event.preventDefault();
    const extras = [...this.actor.system.faction.extras];
    extras.push({ name: "", description: "" });
    await this.actor.update({ 'system.faction.extras': extras });
  }

  /**
   * Delete an extra
   */
  async _onDeleteExtra(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const extras = [...this.actor.system.faction.extras];
    extras.splice(index, 1);
    await this.actor.update({ 'system.faction.extras': extras });
  }
}
