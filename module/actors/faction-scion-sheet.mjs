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
      maxCapability: game.scionsOfFarstar.getMaxCapability(),
      expectedCapabilityTotal: game.scionsOfFarstar.getExpectedCapabilityTotal()
    };

    // Enrich text fields (for rich text editors)
    const enrichHTML = foundry.applications?.ux?.TextEditor?.implementation?.enrichHTML || TextEditor.enrichHTML;
    context.enrichedScionAspect = await enrichHTML(context.system.scion.aspects.scionAspect.value, { async: true });
    context.enrichedHighConcept = await enrichHTML(context.system.aspects.highConcept.value, { async: true });
    context.enrichedTrouble = await enrichHTML(context.system.aspects.trouble.value, { async: true });
    context.enrichedInheritance = await enrichHTML(context.system.faction.aspects.inheritance.value, { async: true });

    // Get all named-npc items and enrich with calculated data
    context.npcItems = this.actor.items.filter(item => item.type === 'named-npc').map(item => {
      const itemData = item.toObject(false);
      return {
        ...itemData,
        npcData: this._calculateNpcData(itemData.system)
      };
    });

    // Get all Extra items (all types)
    const extraTypes = ['extra-aspect', 'extra-ladder', 'extra-skill', 'extra-track', 'extra-growing-track'];
    context.extraItems = this.actor.items.filter(item => extraTypes.includes(item.type)).map(item => {
      // Use spread operator to preserve all properties including _id
      const itemData = {
        ...item.toObject(false),
        _id: item.id  // Explicitly ensure _id is present
      };

      // For extra-ladder, calculate ladder display data
      if (item.type === 'extra-ladder') {
        itemData.ladderData = this._calculateLadderData(itemData.system);
      }

      return itemData;
    });

    // Get all Stunt items (all types)
    const stuntTypes = ['stunt-basic', 'stunt-swap', 'stunt-consequence', 'stunt-stress', 'stunt-other'];
    context.stuntItems = this.actor.items.filter(item => stuntTypes.includes(item.type)).map(item => {
      const itemData = {
        ...item.toObject(false),
        _id: item.id
      };
      return itemData;
    });

    return context;
  }

  /** @override */
  async _updateObject(event, formData) {
    // Save all ProseMirror editor content first
    this._saveProseMirrorEditors();

    // Expand the formData to handle arrays properly
    const expandedData = foundry.utils.expandObject(formData);

    // Ensure stunts array is properly handled
    if (expandedData.system?.faction?.stunts) {
      // Convert the stunts object back to an array, preserving existing descriptions
      const stuntsObj = expandedData.system.faction.stunts;
      const stuntsArray = Object.values(stuntsObj);

      // Merge with existing stunt data to preserve rich text descriptions
      const currentStunts = this.actor.system.faction.stunts || [];
      stuntsArray.forEach((stunt, index) => {
        if (currentStunts[index] && !stunt.description) {
          stunt.description = currentStunts[index].description;
        }
      });

      expandedData.system.faction.stunts = stuntsArray;
    }

    // Update the actor with the expanded data
    return this.actor.update(expandedData);
  }

  /**
   * Save all ProseMirror editor content before form submission
   * This ensures rich text content is captured in the form data
   */
  _saveProseMirrorEditors() {
    // Find all ProseMirror editor elements in the sheet
    const editors = this.element.find('.editor-content[data-edit]');

    editors.each((i, el) => {
      const $editor = $(el);
      const fieldName = $editor.attr('data-edit');

      // Get the ProseMirror instance for this editor
      const editorInstance = this.editors?.[fieldName];

      if (editorInstance) {
        // Save the editor content back to the element
        // This updates the hidden input field that will be included in formData
        if (editorInstance.instance) {
          const content = editorInstance.instance.getHTML?.() || editorInstance.instance.innerHTML || '';
          const input = this.element.find(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
          if (input.length) {
            input.val(content);
          }
        }
      }
    });
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

  /**
   * Calculate ladder display data for Extra-Ladder items
   * @param {Object} systemData - The item's system data
   * @returns {Object} - Ladder display data
   */
  _calculateLadderData(systemData) {
    // Ensure rungs is an array, rebuild from rungCount if necessary
    let rungs = systemData.rungs;
    const rungCount = systemData.rungCount || 5;

    if (!Array.isArray(rungs)) {
      // Initialize rungs array if it's not an array
      rungs = [];
      for (let i = 0; i < rungCount; i++) {
        rungs.push({ aspect: '', checked: false });
      }
    }

    // Find the first (topmost) unchecked rung
    let highestUncheckedIndex = -1;
    for (let i = 0; i < rungCount; i++) {
      if (!rungs[i]?.checked) {
        highestUncheckedIndex = i;
        break;
      }
    }

    // Build display data for each rung
    const displayRungs = [];
    for (let i = 0; i < rungCount; i++) {
      displayRungs.push({
        index: i,
        aspect: rungs[i]?.aspect || '',
        checked: rungs[i]?.checked || false,
        isHighestUnchecked: i === highestUncheckedIndex
      });
    }

    return { rungs: displayRungs };
  }

  /**
   * Calculate NPC data (same logic as RegistrarSheet)
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

    const ageTrack = systemData.ageTrack;
    let scarCount = 0;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (ageTrack[stages[i]].scar) {
        scarCount++;
      } else {
        break;
      }
    }

    const maxAgeIndex = stages.length - 1 - scarCount;
    const isDeceased = currentAgeIndex > maxAgeIndex;

    let deathGeneration = null;
    if (isDeceased) {
      // They died when they aged one generation past maxAgeIndex
      deathGeneration = birthGeneration + maxAgeIndex + 1;
    }

    return {
      currentAgeLabel: currentAgeStage ? ageTrack[currentAgeStage].label : 'Unknown',
      isDeceased: isDeceased,
      deathGeneration: deathGeneration
    };
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
    html.find('.people-box').click(this._onTogglePeople.bind(this));

    // Age track handlers
    html.find('.age-passed').click(this._onToggleAgePassed.bind(this));
    html.find('.wound-stress-box').click(this._onToggleAgeWound.bind(this));
    html.find('.age-invoke-used').click(this._onToggleAgeInvokeUsed.bind(this));
    html.find('.age-scar').click(this._onToggleAgeScar.bind(this));

    // Fate point adjusters
    html.find('.fate-points-increment').click(this._onAdjustFatePoints.bind(this, 1));
    html.find('.fate-points-decrement').click(this._onAdjustFatePoints.bind(this, -1));

    // Stunt handlers (now use item system)
    html.find('.add-item-button[data-type^="stunt-"]').click(this._onCreateStunt.bind(this));
    html.find('.roll-stunt').click(this._onRollStunt.bind(this));

    // Extra item handlers
    html.find('.invoke-checkbox').click(this._onToggleExtraInvoke.bind(this));
    html.find('.ladder-rung-clickable').click(this._onToggleLadderRung.bind(this));
    html.find('.track-box-wrapper').click(this._onToggleTrackBox.bind(this));
    html.find('.roll-extra-skill').click(this._onRollExtraSkill.bind(this));

    // Item controls (NPC and Extra items)
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.roll-npc-skill').click(this._onRollNpcSkill.bind(this));

    // Make NPC items draggable
    html.find('.npc-item').each((i, li) => {
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });

    // Make Extra items draggable
    html.find('.extra-item').each((i, li) => {
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });

    // Make Stunt items draggable
    html.find('.stunt-item').each((i, li) => {
      li.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });

    // Context menu for stunt items (right-click to send to chat)
    html.find('.stunt-item').on('contextmenu', this._onStuntContextMenu.bind(this));

    // Context menu for consequence boxes (right-click to send to chat)
    html.find('.consequence-box').on('contextmenu', this._onConsequenceContextMenu.bind(this));

    // Drag events for skill/capability macro creation
    // Note: draggable="true" is set in the template on the divs, we just need to add the event listener
    const skillDivs = html.find('.skill-item[draggable="true"]');
    console.log(`Scions of FarStar | Found ${skillDivs.length} skill divs for drag setup`);
    skillDivs.each((i, div) => {
      div.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });

    const capabilityDivs = html.find('.capability-item[draggable="true"]');
    console.log(`Scions of FarStar | Found ${capabilityDivs.length} capability divs for drag setup`);
    capabilityDivs.each((i, div) => {
      div.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });
  }

  /**
   * Handle beginning of drag operation for skills, capabilities, and items
   * @override
   */
  _onDragStart(event) {
    const element = event.currentTarget;
    console.log("Scions of FarStar | _onDragStart called", element);

    // Check if this is a stunt item drag (special handling for macro creation)
    if (element.classList.contains('stunt-item')) {
      const itemId = element.dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item && item.type.startsWith('stunt-')) {
        console.log("Scions of FarStar | Stunt item drag detected:", item.name, item.type);
        // For stunt items, use custom data for our hotbarDrop handler
        event.dataTransfer.setData("text/plain", JSON.stringify({
          type: "StuntItem",
          itemId: itemId,
          itemType: item.type,
          actorId: this.actor.id
        }));
        return;
      }
    }

    // Check if this is an item drag (NPC or Extra items)
    const itemId = element.dataset.itemId;
    if (itemId) {
      console.log("Scions of FarStar | Item drag detected:", itemId);
      // This is an item drag - use the parent class handler
      return super._onDragStart(event);
    }

    // Check if this is a skill drag
    const skillKey = element.dataset.skill;
    if (skillKey) {
      const skill = this.actor.system.scion.skills[skillKey];
      if (skill) {
        console.log("Scions of FarStar | Skill drag detected:", skillKey, skill.label);
        event.dataTransfer.setData("text/plain", JSON.stringify({
          type: "FactionScionSkill",
          actorId: this.actor.id,
          skillKey: skillKey,
          skillLabel: skill.label
        }));
      }
      return;
    }

    // Check if this is a capability drag
    const capabilityKey = element.dataset.capability;
    if (capabilityKey) {
      const capability = this.actor.system.faction.capabilities[capabilityKey];
      if (capability) {
        console.log("Scions of FarStar | Capability drag detected:", capabilityKey, capability.label);
        event.dataTransfer.setData("text/plain", JSON.stringify({
          type: "FactionScionCapability",
          actorId: this.actor.id,
          capabilityKey: capabilityKey,
          capabilityLabel: capability.label
        }));
      }
      return;
    }

    console.log("Scions of FarStar | No matching drag type, falling back to parent");
    // Fall back to parent class handler for other drags
    return super._onDragStart(event);
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
   * Toggle the second minor consequence slot on/off
   */
  async _onToggleConsequenceSlot(event) {
    event.preventDefault();
    const currentEnabled = this.actor.system.consequences.minor2.enabled;
    await this.actor.update({
      'system.consequences.minor2.enabled': !currentEnabled
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
  /**
   * Create a new stunt item
   */
  async _onCreateStunt(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const stuntType = button.dataset.type;

    await Item.create({
      name: `New ${stuntType.replace('stunt-', '').charAt(0).toUpperCase() + stuntType.replace('stunt-', '').slice(1)} Stunt`,
      type: stuntType,
      system: {}
    }, { parent: this.actor });
  }

  /**
   * Roll a stunt (basic or swap)
   */
  async _onRollStunt(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const stunt = this.actor.items.get(itemId);

    if (!stunt) return;

    // Import the createFateRoll function
    const { createFateRoll } = await import('../scions-of-farstar.mjs');

    if (stunt.type === "stunt-basic") {
      // Basic stunt: /fate SkillName ActionType Stunt+2 StuntName
      const skill = stunt.system.skillOrCapability;
      const action = stunt.system.actionType;
      const stuntName = stunt.name;

      if (!skill || !action) {
        ui.notifications.warn("Stunt is not fully configured. Edit the stunt to set skill/capability and action type.");
        return;
      }

      // Extract plain text description (strip HTML tags)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = stunt.system.description || '';
      const description = tempDiv.textContent || tempDiv.innerText || '';

      // Build roll data for basic stunt
      const rollData = {
        modifier: 0,
        skillName: skill,
        skillValue: 0, // Will be filled by parseFateCommand
        skillSource: null, // Will be detected
        actionType: action,
        stuntBonus: 2,
        stuntSwap: null,
        stuntName: stuntName,
        note: description
      };

      // Get skill value from actor
      const scionSkills = ["Academics", "Combat", "Deception", "Engineering", "Exploration", "Influence"];
      if (scionSkills.includes(skill)) {
        rollData.skillValue = this.actor.system.scion.skills[skill.toLowerCase()].value;
        rollData.skillSource = 'scion';
      } else {
        rollData.skillValue = this.actor.system.faction.capabilities[skill.toLowerCase()].value;
        rollData.skillSource = 'faction';
      }

      rollData.modifier = rollData.skillValue + rollData.stuntBonus;

      await createFateRoll(rollData, 0, this.actor, null);

    } else if (stunt.type === "stunt-swap") {
      // Swap stunt: /fate TargetSkill ActionType Stunt-Swap ReplacementSkill StuntName
      const targetSkill = stunt.system.targetSkillOrCapability;
      const replacementSkill = stunt.system.replacementSkillOrCapability;
      const action = stunt.system.actionType;
      const stuntName = stunt.name;

      if (!targetSkill || !replacementSkill || !action) {
        ui.notifications.warn("Stunt is not fully configured. Edit the stunt to set skills/capabilities and action type.");
        return;
      }

      // Extract plain text description (strip HTML tags)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = stunt.system.description || '';
      const description = tempDiv.textContent || tempDiv.innerText || '';

      // Get skill values
      const scionSkills = ["Academics", "Combat", "Deception", "Engineering", "Exploration", "Influence"];

      let targetValue, replacementValue;
      if (scionSkills.includes(targetSkill)) {
        targetValue = this.actor.system.scion.skills[targetSkill.toLowerCase()].value;
      } else {
        targetValue = this.actor.system.faction.capabilities[targetSkill.toLowerCase()].value;
      }

      if (scionSkills.includes(replacementSkill)) {
        replacementValue = this.actor.system.scion.skills[replacementSkill.toLowerCase()].value;
      } else {
        replacementValue = this.actor.system.faction.capabilities[replacementSkill.toLowerCase()].value;
      }

      // Build roll data for swap stunt
      const rollData = {
        modifier: replacementValue,
        skillName: targetSkill,
        skillValue: targetValue,
        skillSource: scionSkills.includes(targetSkill) ? 'scion' : 'faction',
        actionType: action,
        stuntBonus: 0,
        stuntSwap: {
          from: targetSkill,
          fromValue: targetValue,
          to: replacementSkill,
          toValue: replacementValue
        },
        stuntName: stuntName,
        note: description
      };

      await createFateRoll(rollData, 0, this.actor, null);
    }
  }

  /**
   * Handle right-click context menu for stunt items
   * @param {Event} event - The contextmenu event
   */
  async _onStuntContextMenu(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const stunt = this.actor.items.get(itemId);

    if (!stunt) return;

    // Create context menu with "Send to Chat" option
    new ContextMenu($(event.currentTarget), ".stunt-item", [
      {
        name: "Send to Chat",
        icon: '<i class="fas fa-comment"></i>',
        callback: async (li) => {
          const stuntId = li.data("itemId");
          const stuntItem = this.actor.items.get(stuntId);
          if (stuntItem) {
            await this._sendStuntToChat(stuntItem);
          }
        }
      }
    ]);
  }

  /**
   * Handle right-click context menu for consequence boxes
   * @param {Event} event - The contextmenu event
   */
  async _onConsequenceContextMenu(event) {
    event.preventDefault();

    const consequenceType = event.currentTarget.dataset.consequenceType;
    const consequence = this.actor.system.consequences[consequenceType];

    if (!consequence) return;

    // Only show context menu if consequence is active or treated
    if (!consequence.value) return;

    // Create context menu with "Send to Chat" option
    new ContextMenu($(event.currentTarget), ".consequence-box", [
      {
        name: "Send to Chat",
        icon: '<i class="fas fa-comment"></i>',
        callback: async (li) => {
          const cType = li.data("consequenceType");
          await this._sendConsequenceToChat(cType);
        }
      }
    ]);
  }

  /**
   * Send a consequence to chat
   * @param {string} consequenceType - The type of consequence (minor, minor2, moderate, severe)
   */
  async _sendConsequenceToChat(consequenceType) {
    const consequence = this.actor.system.consequences[consequenceType];

    if (!consequence || !consequence.value) return;

    // Determine consequence details
    const consequenceLabels = {
      minor: 'Minor (2-Point)',
      minor2: 'Minor (2-Point)',
      moderate: 'Moderate (4-Point)',
      severe: 'Severe (6-Point)'
    };

    const consequenceClears = {
      minor: 'Clears: 1 Session',
      minor2: 'Clears: 1 Session',
      moderate: 'Clears: 1 Scenario',
      severe: 'Clears: 1 Milestone'
    };

    const consequenceColors = {
      minor: '#3498db', // blue (--sof-accent)
      minor2: '#3498db',
      moderate: '#f39c12', // orange (--sof-warning)
      severe: '#e74c3c' // red (--sof-danger)
    };

    const label = consequenceLabels[consequenceType];
    const clears = consequenceClears[consequenceType];
    const borderColor = consequenceColors[consequenceType];

    // Determine status (Active or Treated)
    const isActive = consequence.value && !consequence.treated;
    const isTreated = consequence.treated;

    // Build the chat card HTML
    let cardHTML = `
      <div class="consequence-chat-card" style="border-left-color: ${borderColor};">
        <div class="consequence-chat-header">
          <h3 class="consequence-chat-title">${label}</h3>
    `;

    // Add status badge
    if (isTreated) {
      cardHTML += `<span class="status-badge treated">Treated</span>`;
    } else if (isActive) {
      cardHTML += `<span class="status-badge active">Active</span>`;
    }

    cardHTML += `
        </div>
        <div class="consequence-chat-body">
          <div class="consequence-chat-aspect">${consequence.value}</div>
    `;

    // Add free invoke badge if applicable
    if (consequence.freeInvoke) {
      cardHTML += `<div class="consequence-chat-invoke"><span class="free-invoke-badge">Free Invoke</span></div>`;
    }

    // Add clears reminder
    cardHTML += `
          <div class="consequence-chat-clears">${clears}</div>
        </div>
      </div>
    `;

    // Create the chat message with the actor as speaker
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: cardHTML,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /**
   * Send a stunt to chat
   * @param {Item} stunt - The stunt item to send
   */
  async _sendStuntToChat(stunt) {
    // Build the stunt description based on type
    let content = `<div class="stunt-chat-card scope-${stunt.system.scope}">`;
    content += `<div class="stunt-chat-header">`;
    const bgStyle = stunt.system.iconBackground ? `style="background-color: ${stunt.system.iconBackground};"` : '';
    content += `<img src="${stunt.img}" alt="${stunt.name}" class="stunt-icon" ${bgStyle}/>`;
    content += `<h3 class="stunt-name">${stunt.name}</h3>`;
    content += `</div>`;
    content += `<div class="stunt-chat-content">`;

    // Generate content based on stunt type
    if (stunt.type === "stunt-basic") {
      if (stunt.system.skillOrCapability && stunt.system.actionType) {
        const action = stunt.system.actionType.charAt(0).toUpperCase() + stunt.system.actionType.slice(1);
        content += `<p>Because I have <strong>${stunt.name}</strong> I get a +2 when I ${action} with ${stunt.system.skillOrCapability}.`;
        if (stunt.system.description) {
          content += ` ${stunt.system.description}`;
        }
        content += `</p>`;
      } else {
        content += `<p><em>Configure skill/capability and action in item sheet.</em></p>`;
      }
    } else if (stunt.type === "stunt-swap") {
      if (stunt.system.targetSkillOrCapability && stunt.system.replacementSkillOrCapability && stunt.system.actionType) {
        const action = stunt.system.actionType.charAt(0).toUpperCase() + stunt.system.actionType.slice(1);
        content += `<p>Because I have <strong>${stunt.name}</strong> when I roll ${action} with ${stunt.system.targetSkillOrCapability} I can use ${stunt.system.replacementSkillOrCapability} instead.`;
        if (stunt.system.description) {
          content += ` ${stunt.system.description}`;
        }
        content += `</p>`;
      } else {
        content += `<p><em>Configure skills/capabilities and action in item sheet.</em></p>`;
      }
    } else if (stunt.type === "stunt-consequence") {
      content += `<p>Because I have <strong>${stunt.name}</strong> I get an additional Minor Consequence slot (2-point).`;
      if (stunt.system.description) {
        content += ` ${stunt.system.description}`;
      }
      content += `</p>`;
    } else if (stunt.type === "stunt-stress") {
      content += `<p>Because I have <strong>${stunt.name}</strong> I get Two additional Stress Boxes.`;
      if (stunt.system.description) {
        content += ` ${stunt.system.description}`;
      }
      content += `</p>`;
    } else if (stunt.type === "stunt-other") {
      if (stunt.system.description) {
        content += stunt.system.description;
      } else {
        content += `<p><em>Add stunt description in item sheet.</em></p>`;
      }
    }

    content += `</div>`;
    content += `</div>`;

    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    };

    await ChatMessage.create(chatData);
  }

  /**
   * Toggle an Extra item's invoke checkbox
   * @param {Event} event - The click event
   */
  async _onToggleExtraInvoke(event) {
    event.preventDefault();
    event.stopPropagation();

    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const index = parseInt(event.currentTarget.dataset.index);

    if (!item) return;

    const invokes = [...item.system.invokes];
    if (invokes[index]) {
      invokes[index].spent = !invokes[index].spent;
      await item.update({ 'system.invokes': invokes });
    }
  }

  /**
   * Toggle an Extra-Ladder's rung checkbox
   * @param {Event} event - The click event
   */
  async _onToggleLadderRung(event) {
    event.preventDefault();
    event.stopPropagation();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const index = parseInt(event.currentTarget.dataset.index);

    if (!item) return;

    // Ensure rungs is a proper array
    let rungs = item.system.rungs;
    if (!Array.isArray(rungs)) {
      const rungCount = item.system.rungCount || 5;
      rungs = [];
      for (let i = 0; i < rungCount; i++) {
        rungs.push({ aspect: '', checked: false });
      }
    } else {
      rungs = [...rungs];
    }

    // Toggle the rung if it exists
    if (rungs[index]) {
      rungs[index].checked = !rungs[index].checked;
      await item.update({ 'system.rungs': rungs });
    }
  }

  /**
   * Toggle an Extra-Track's checkbox
   * @param {Event} event - The click event
   */
  async _onToggleTrackBox(event) {
    event.preventDefault();
    event.stopPropagation();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const index = parseInt(event.currentTarget.dataset.index);

    if (!item) return;

    const boxes = [...item.system.boxes];
    if (boxes[index]) {
      boxes[index].checked = !boxes[index].checked;
      await item.update({ 'system.boxes': boxes });
    }
  }

  /**
   * Handle rolling an Extra-Skill's skill
   * @param {Event} event - The click event
   */
  async _onRollExtraSkill(event) {
    event.preventDefault();
    event.stopPropagation();

    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    if (!item) return;

    const skillName = item.system.skillName;
    const skillValue = item.system.skillValue || 0;

    if (!skillName) return;

    // Import the createFateRoll function
    const { createFateRoll } = await import("../scions-of-farstar.mjs");

    // Create the label and roll
    const label = `${item.name}: ${skillName}`;
    await createFateRoll(label, skillValue, null, item.name);
  }

  /**
   * Handle editing an item (NPC, Extra, or Stunt)
   * @param {Event} event - The click event
   */
  _onItemEdit(event) {
    event.preventDefault();

    // Get item ID from the button's data attribute
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (item) {
      item.sheet.render(true);
    }
  }

  /**
   * Handle deleting an item (NPC, Extra, or Stunt)
   * @param {Event} event - The click event
   */
  async _onItemDelete(event) {
    event.preventDefault();

    // Get item ID from the button's data attribute
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (item) {
      const confirmed = await Dialog.confirm({
        title: `Delete ${item.name}?`,
        content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
        defaultYes: false
      });
      if (confirmed) {
        await item.delete();
      }
    }
  }

  /**
   * Handle rolling an NPC's skill
   * @param {Event} event - The click event
   */
  async _onRollNpcSkill(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent item edit from triggering

    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    if (!item) return;

    const skillName = item.system.skillName;
    const skillValue = item.system.skillValue || 0;

    if (!skillName) return;

    // Import the createFateRoll function
    const { createFateRoll } = await import("../scions-of-farstar.mjs");

    // Create the label and roll
    const label = `${item.name}: ${skillName}`;
    await createFateRoll(label, skillValue, null, item.name);
  }
}
