/**
 * Threat Actor Sheet
 * Handles the UI for the flexible Threat sheet with edit/play modes
 */
export class ThreatSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "actor", "threat"],
      template: "systems/scions-of-farstar/templates/actor/threat-sheet.hbs",
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
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
    context.editMode = context.system.editMode;

    // Build sorted sections list for main tab
    context.sortedSections = this._getSortedSections(context.system.modularSections, context.editMode);

    // Add age track validation if age track is visible
    if (context.system.modularSections.ageTrack.visible) {
      context.ageTrackValidation = this._getAgeTrackValidation(context.system.modularSections.ageTrack.stages);
      context.currentAgeStage = context.system.currentAgeStage;
    }

    // Enrich HTML content for details section
    context.enrichedDetailsContent = await TextEditor.enrichHTML(context.system.modularSections.details.content, {
      async: true,
      secrets: this.actor.isOwner
    });

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

    return context;
  }

  /**
   * Sort modular sections by priority and return them in display order
   * In edit mode, show ALL sections regardless of visibility
   */
  _getSortedSections(modularSections, editMode) {
    const sections = [];

    // Build array of section objects with their keys and data
    for (const [key, section] of Object.entries(modularSections)) {
      // In edit mode, show all sections; in play mode, only show visible ones
      if (editMode || section.visible) {
        sections.push({
          key: key,
          data: section,
          priority: section.priority || 999
        });
      }
    }

    // Sort by priority
    sections.sort((a, b) => a.priority - b.priority);

    return sections;
  }

  /**
   * Determine which age track checkboxes can be clicked based on validation rules
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
        canCheckPassed: (i === lastPassedIndex + 1) || ageTrack[stage].passed,
        canCheckScar: (i === firstScarredIndex - 1) || ageTrack[stage].scar
      };
    }

    return validation;
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

  /** @override */
  async _updateObject(event, formData) {
    // Save all ProseMirror editor content first
    this._saveProseMirrorEditors();

    // Expand the formData to handle arrays properly
    const expandedData = foundry.utils.expandObject(formData);

    // Ensure stunts array is properly handled
    if (expandedData.system?.stunts) {
      const stuntsObj = expandedData.system.stunts;
      const stuntsArray = Object.values(stuntsObj);

      // Merge with existing stunt data to preserve rich text descriptions
      const currentStunts = this.actor.system.stunts || [];
      stuntsArray.forEach((stunt, index) => {
        if (currentStunts[index] && !stunt.description) {
          stunt.description = currentStunts[index].description;
        }
      });

      expandedData.system.stunts = stuntsArray;
    }

    // Handle ladder rungs arrays in modular sections
    if (expandedData.system?.modularSections) {
      const modularSections = expandedData.system.modularSections;

      // Process ladder1 rungs
      if (modularSections.ladder1?.rungs) {
        const rungsObj = modularSections.ladder1.rungs;
        if (typeof rungsObj === 'object' && !Array.isArray(rungsObj)) {
          modularSections.ladder1.rungs = Object.values(rungsObj);
        }
      }

      // Process ladder2 rungs
      if (modularSections.ladder2?.rungs) {
        const rungsObj = modularSections.ladder2.rungs;
        if (typeof rungsObj === 'object' && !Array.isArray(rungsObj)) {
          modularSections.ladder2.rungs = Object.values(rungsObj);
        }
      }

      // Process skills arrays in skill columns
      ['capabilitiesColumn', 'skillsColumn'].forEach(columnKey => {
        if (modularSections[columnKey]?.skills) {
          const skillsObj = modularSections[columnKey].skills;
          if (typeof skillsObj === 'object' && !Array.isArray(skillsObj)) {
            const skillsArray = Object.values(skillsObj);

            // Merge with existing skills to preserve data not in this update
            const currentSkills = this.actor.system.modularSections[columnKey]?.skills || [];
            const mergedSkills = [];

            for (let i = 0; i < Math.max(skillsArray.length, currentSkills.length); i++) {
              const updatedSkill = skillsArray[i] || {};
              const currentSkill = currentSkills[i] || { name: "", value: 0 };

              mergedSkills.push({
                name: updatedSkill.name !== undefined ? updatedSkill.name : currentSkill.name,
                value: updatedSkill.value !== undefined ? updatedSkill.value : currentSkill.value
              });
            }

            modularSections[columnKey].skills = mergedSkills;
          }
        }
      });

      // Process stress track boxes arrays
      ['singlePointStress', 'growingStress'].forEach(stressKey => {
        if (modularSections[stressKey]) {
          ['track1', 'track2'].forEach(trackKey => {
            if (modularSections[stressKey][trackKey]?.boxes) {
              const boxesObj = modularSections[stressKey][trackKey].boxes;
              if (typeof boxesObj === 'object' && !Array.isArray(boxesObj)) {
                modularSections[stressKey][trackKey].boxes = Object.values(boxesObj);
              }
            }
          });
        }
      });

      // Preserve details content from editor if not in formData
      if (modularSections.details && !modularSections.details.content) {
        modularSections.details.content = this.actor.system.modularSections.details?.content || '';
      }
    }

    // Update the actor with the expanded data
    return this.actor.update(expandedData);
  }

  /**
   * Save all ProseMirror editor content before form submission
   */
  _saveProseMirrorEditors() {
    const editors = this.element.find('.editor-content[data-edit]');

    editors.each((i, el) => {
      const $editor = $(el);
      const fieldName = $editor.attr('data-edit');

      const editorInstance = this.editors?.[fieldName];

      if (editorInstance) {
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Edit/Play mode toggle
    html.find('.toggle-edit-mode').click(this._onToggleEditMode.bind(this));

    // Share to Chat button
    html.find('.share-to-chat').click(this._onShareToChat.bind(this));

    // Aspect visibility toggles (edit mode only)
    html.find('.aspect-visibility-toggle').click(this._onToggleAspectVisibility.bind(this));

    // Section visibility toggles (edit mode only)
    html.find('.section-visibility-toggle').click(this._onToggleSectionVisibility.bind(this));

    // Track visibility toggles (edit mode only)
    html.find('.track-visibility-toggle').click(this._onToggleTrackVisibility.bind(this));

    // Skill count adjusters (edit mode only)
    html.find('.skill-count-increment').click(this._onAdjustSkillCount.bind(this, 1));
    html.find('.skill-count-decrement').click(this._onAdjustSkillCount.bind(this, -1));

    // Stress track max adjusters (edit mode only)
    html.find('.stress-max-increment').click(this._onAdjustStressMax.bind(this, 1));
    html.find('.stress-max-decrement').click(this._onAdjustStressMax.bind(this, -1));

    // Consequence visibility toggles (edit mode only)
    html.find('.consequence-visibility-toggle').click(this._onToggleConsequenceVisibility.bind(this));

    // Ladder rung count adjusters (edit mode only)
    html.find('.ladder-rung-increment').click(this._onAdjustLadderRungCount.bind(this, 1));
    html.find('.ladder-rung-decrement').click(this._onAdjustLadderRungCount.bind(this, -1));

    // Roll handlers (play mode)
    html.find('.roll-skill').click(this._onRollSkill.bind(this));

    // Stress box handlers (play mode)
    html.find('.stress-box').click(this._onToggleStressBox.bind(this));
    // Growing stress boxes now use standard checkbox form submission

    // Ladder rung value box handlers (play mode) - replaces checkbox
    html.find('.ladder-rung-clickable').click(this._onToggleLadderRung.bind(this));

    // Age track handlers (play mode)
    html.find('.age-passed').click(this._onToggleAgePassed.bind(this));
    html.find('.wound-stress-box').click(this._onToggleAgeWound.bind(this));
    html.find('.age-invoke-used').click(this._onToggleAgeInvokeUsed.bind(this));
    html.find('.age-scar').click(this._onToggleAgeScar.bind(this));

    // Stunt handlers
    html.find('.stunt-add').click(this._onAddStunt.bind(this));
    html.find('.stunt-delete').click(this._onDeleteStunt.bind(this));

    // Extra item handlers
    html.find('.invoke-checkbox').click(this._onToggleExtraInvoke.bind(this));
    html.find('.roll-extra-skill').click(this._onRollExtraSkill.bind(this));
    html.find('.track-box-wrapper').click(this._onToggleTrackBox.bind(this));

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

    // Drag events for macro creation
    html.find('.rollable').each((i, li) => {
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });
  }

  /**
   * Toggle between edit and play modes
   */
  async _onToggleEditMode(event) {
    event.preventDefault();
    const currentMode = this.actor.system.editMode;
    await this.actor.update({ 'system.editMode': !currentMode });
  }

  /**
   * Share threat details to chat
   */
  async _onShareToChat(event) {
    event.preventDefault();

    const system = this.actor.system;
    const threatName = this.actor.name;

    // Collect active aspects (visible ones with values)
    const activeAspects = [];
    for (const [key, aspect] of Object.entries(system.aspects)) {
      if (aspect.visible && aspect.value) {
        activeAspects.push({
          label: aspect.label,
          value: aspect.value
        });
      }
    }

    // Collect active consequences (with free invokes)
    const activeConsequences = [];
    const conseqSection = system.modularSections.consequences;
    if (conseqSection.visible) {
      const conseqKeys = ['minor', 'minor2', 'moderate', 'severe'];
      const conseqLabels = {
        'minor': 'Minor (2)',
        'minor2': 'Minor (2)',
        'moderate': 'Moderate (4)',
        'severe': 'Severe (6)'
      };

      for (const key of conseqKeys) {
        const conseq = conseqSection[key];
        if (conseq.visible && conseq.value) {
          activeConsequences.push({
            label: conseqLabels[key],
            value: conseq.value,
            freeInvoke: !conseq.freeInvoke && !conseq.treated
          });
        }
      }
    }

    // Collect active ladders
    const activeLadders = [];
    for (const ladderKey of ['ladder1', 'ladder2']) {
      const ladder = system.modularSections[ladderKey];
      if (ladder.visible) {
        // Find the highest unchecked rung
        let highestUnchecked = -1;
        for (let i = 0; i < ladder.rungCount; i++) {
          if (!ladder.rungs[i]?.checked) {
            highestUnchecked = i;
            break;
          }
        }

        if (highestUnchecked !== -1 && ladder.rungs[highestUnchecked].aspect) {
          activeLadders.push({
            heading: ladder.heading,
            currentRung: ladder.rungs[highestUnchecked].aspect,
            rungNumber: highestUnchecked + 1,
            totalRungs: ladder.rungCount
          });
        }
      }
    }

    // Check age track
    let currentAge = null;
    const ageTrack = system.modularSections.ageTrack;
    if (ageTrack.visible && system.currentAgeStage) {
      const stage = ageTrack.stages[system.currentAgeStage];
      if (stage) {
        currentAge = {
          label: stage.label,
          ageRange: stage.ageRange
        };
      }
    }

    // Build the chat card HTML
    let cardHTML = `
      <div class="threat-share-card">
        <div class="threat-header">
          <h3>${threatName}</h3>
        </div>
    `;

    // Add aspects
    if (activeAspects.length > 0) {
      cardHTML += `<div class="threat-section">`;
      cardHTML += `<div class="section-title">Aspects</div>`;
      for (const aspect of activeAspects) {
        cardHTML += `<div class="aspect-entry"><strong>${aspect.label}:</strong> ${aspect.value}</div>`;
      }
      cardHTML += `</div>`;
    }

    // Add consequences
    if (activeConsequences.length > 0) {
      cardHTML += `<div class="threat-section">`;
      cardHTML += `<div class="section-title">Consequences</div>`;
      for (const conseq of activeConsequences) {
        cardHTML += `<div class="consequence-entry">`;
        cardHTML += `<strong>${conseq.label}:</strong> ${conseq.value}`;
        if (conseq.freeInvoke) {
          cardHTML += ` <span class="free-invoke-badge">Free Invoke</span>`;
        }
        cardHTML += `</div>`;
      }
      cardHTML += `</div>`;
    }

    // Add ladders
    if (activeLadders.length > 0) {
      cardHTML += `<div class="threat-section">`;
      for (const ladder of activeLadders) {
        cardHTML += `<div class="ladder-entry">`;
        cardHTML += `<strong>${ladder.heading}:</strong> ${ladder.currentRung}`;
        cardHTML += ` <span class="rung-info">(Rung ${ladder.rungNumber}/${ladder.totalRungs})</span>`;
        cardHTML += `</div>`;
      }
      cardHTML += `</div>`;
    }

    // Add current age
    if (currentAge) {
      cardHTML += `<div class="threat-section">`;
      cardHTML += `<div class="age-entry">`;
      cardHTML += `<strong>Age:</strong> ${currentAge.label} (${currentAge.ageRange})`;
      cardHTML += `</div>`;
      cardHTML += `</div>`;
    }

    cardHTML += `</div>`;

    // Create the chat message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: cardHTML,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /**
   * Toggle aspect visibility
   */
  async _onToggleAspectVisibility(event) {
    event.preventDefault();
    const aspectKey = event.currentTarget.dataset.aspect;
    const current = this.actor.system.aspects[aspectKey].visible;
    await this.actor.update({ [`system.aspects.${aspectKey}.visible`]: !current });
  }

  /**
   * Toggle section visibility
   */
  async _onToggleSectionVisibility(event) {
    event.preventDefault();
    const section = event.currentTarget.dataset.section;
    const current = this.actor.system.modularSections[section].visible;
    await this.actor.update({ [`system.modularSections.${section}.visible`]: !current });
  }

  /**
   * Toggle track visibility within a section
   */
  async _onToggleTrackVisibility(event) {
    event.preventDefault();
    const section = event.currentTarget.dataset.section;
    const track = event.currentTarget.dataset.track;
    const current = this.actor.system.modularSections[section][track].visible;
    await this.actor.update({ [`system.modularSections.${section}.${track}.visible`]: !current });
  }

  /**
   * Adjust skill count for a column
   */
  async _onAdjustSkillCount(delta, event) {
    event.preventDefault();
    const column = event.currentTarget.dataset.column;
    const current = this.actor.system.modularSections[column].skillCount;
    const newCount = Math.max(1, Math.min(8, current + delta));
    await this.actor.update({ [`system.modularSections.${column}.skillCount`]: newCount });
  }

  /**
   * Adjust stress track max
   */
  async _onAdjustStressMax(delta, event) {
    event.preventDefault();
    const section = event.currentTarget.dataset.section;
    const track = event.currentTarget.dataset.track;
    const current = this.actor.system.modularSections[section][track].max;
    const newMax = Math.max(1, Math.min(10, current + delta));

    // Build new boxes array
    const boxes = [];
    for (let i = 0; i < newMax; i++) {
      boxes.push({
        value: this.actor.system.modularSections[section][track].boxes[i]?.value || false
      });
    }

    await this.actor.update({
      [`system.modularSections.${section}.${track}.max`]: newMax,
      [`system.modularSections.${section}.${track}.boxes`]: boxes
    });
  }

  /**
   * Toggle consequence visibility
   */
  async _onToggleConsequenceVisibility(event) {
    event.preventDefault();
    const consequence = event.currentTarget.dataset.consequence;
    const current = this.actor.system.modularSections.consequences[consequence].visible;
    await this.actor.update({ [`system.modularSections.consequences.${consequence}.visible`]: !current });
  }

  /**
   * Adjust ladder rung count
   */
  async _onAdjustLadderRungCount(delta, event) {
    event.preventDefault();
    const ladder = event.currentTarget.dataset.ladder;
    const current = this.actor.system.modularSections[ladder].rungCount;
    const newCount = Math.max(2, Math.min(10, current + delta));
    await this.actor.update({ [`system.modularSections.${ladder}.rungCount`]: newCount });
  }

  /**
   * Roll a skill
   */
  async _onRollSkill(event) {
    event.preventDefault();
    const column = event.currentTarget.dataset.column;
    const index = parseInt(event.currentTarget.dataset.index);
    const skill = this.actor.system.modularSections[column].skills[index];

    if (skill && skill.name) {
      const label = `${skill.name} (+${skill.value})`;
      await this.actor.rollFateDice(skill.name, skill.value, label);
    }
  }

  /**
   * Toggle a single-point stress box
   */
  async _onToggleStressBox(event) {
    event.preventDefault();
    const track = event.currentTarget.dataset.track;
    const index = parseInt(event.currentTarget.dataset.index);
    const boxes = [...this.actor.system.modularSections.singlePointStress[track].boxes];

    if (boxes[index]) {
      boxes[index].value = !boxes[index].value;
      await this.actor.update({ [`system.modularSections.singlePointStress.${track}.boxes`]: boxes });
    }
  }

  /**
   * Toggle a growing stress box
   */
  async _onToggleGrowingStressBox(event) {
    event.preventDefault();
    const track = event.currentTarget.dataset.track;
    const index = parseInt(event.currentTarget.dataset.index);
    const boxes = [...this.actor.system.modularSections.growingStress[track].boxes];

    if (boxes[index]) {
      boxes[index].value = !boxes[index].value;
      await this.actor.update({ [`system.modularSections.growingStress.${track}.boxes`]: boxes });
    }
  }

  /**
   * Toggle a ladder rung checkbox (for both modular sections and Extra items)
   */
  async _onToggleLadderRung(event) {
    event.preventDefault();
    event.stopPropagation();

    const itemId = event.currentTarget.dataset.itemId;
    const ladder = event.currentTarget.dataset.ladder;
    const index = parseInt(event.currentTarget.dataset.index);

    // Check if this is an Extra item ladder (has itemId)
    if (itemId) {
      const item = this.actor.items.get(itemId);
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
    } else if (ladder) {
      // This is a modular section ladder
      const rungs = [...this.actor.system.modularSections[ladder].rungs];

      if (rungs[index]) {
        rungs[index].checked = !rungs[index].checked;
        await this.actor.update({ [`system.modularSections.${ladder}.rungs`]: rungs });
      }
    }
  }

  /**
   * Age track handlers - reused from Faction-Scion sheet
   */
  async _onToggleAgePassed(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.modularSections.ageTrack.stages[stage].passed;
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];
    const stageIndex = stages.indexOf(stage);

    if (!current) {
      // Checking Passed: validate that all previous stages are passed
      for (let i = 0; i < stageIndex; i++) {
        if (!this.actor.system.modularSections.ageTrack.stages[stages[i]].passed) {
          ui.notifications.warn(`You must pass ${stages[i]} before passing ${stage}.`);
          return;
        }
      }

      // Checking Passed: clear Wound, Invoke, and Scar
      await this.actor.update({
        [`system.modularSections.ageTrack.stages.${stage}.passed`]: true,
        [`system.modularSections.ageTrack.stages.${stage}.wound`]: false,
        [`system.modularSections.ageTrack.stages.${stage}.freeInvokeUsed`]: false,
        [`system.modularSections.ageTrack.stages.${stage}.scar`]: false
      });
    } else {
      // Unchecking Passed: validate that no later stages are passed
      for (let i = stageIndex + 1; i < stages.length; i++) {
        if (this.actor.system.modularSections.ageTrack.stages[stages[i]].passed) {
          ui.notifications.warn(`You must uncheck ${stages[i]} before unchecking ${stage}.`);
          return;
        }
      }

      // Unchecking Passed: just uncheck it
      await this.actor.update({ [`system.modularSections.ageTrack.stages.${stage}.passed`]: false });
    }
  }

  async _onToggleAgeWound(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.modularSections.ageTrack.stages[stage].wound;

    if (current) {
      // Unchecking Wound: also clear Invoke
      await this.actor.update({
        [`system.modularSections.ageTrack.stages.${stage}.wound`]: false,
        [`system.modularSections.ageTrack.stages.${stage}.freeInvokeUsed`]: false
      });
    } else {
      // Checking Wound: just check it
      await this.actor.update({ [`system.modularSections.ageTrack.stages.${stage}.wound`]: true });
    }
  }

  async _onToggleAgeInvokeUsed(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.modularSections.ageTrack.stages[stage].freeInvokeUsed;
    await this.actor.update({ [`system.modularSections.ageTrack.stages.${stage}.freeInvokeUsed`]: !current });
  }

  async _onToggleAgeScar(event) {
    event.preventDefault();
    const stage = event.currentTarget.dataset.stage;
    const current = this.actor.system.modularSections.ageTrack.stages[stage].scar;
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];
    const stageIndex = stages.indexOf(stage);

    if (!current) {
      // Checking Scar: validate that all later stages are scarred
      for (let i = stageIndex + 1; i < stages.length; i++) {
        if (!this.actor.system.modularSections.ageTrack.stages[stages[i]].scar) {
          ui.notifications.warn(`You must scar ${stages[i]} before scarring ${stage}.`);
          return;
        }
      }

      // Checking Scar: clear Wound, Invoke, and Passed
      await this.actor.update({
        [`system.modularSections.ageTrack.stages.${stage}.scar`]: true,
        [`system.modularSections.ageTrack.stages.${stage}.wound`]: false,
        [`system.modularSections.ageTrack.stages.${stage}.freeInvokeUsed`]: false,
        [`system.modularSections.ageTrack.stages.${stage}.passed`]: false
      });
    } else {
      // Unchecking Scar: validate that no earlier stages are scarred
      for (let i = 0; i < stageIndex; i++) {
        if (this.actor.system.modularSections.ageTrack.stages[stages[i]].scar) {
          ui.notifications.warn(`You must uncheck ${stages[i]} before unchecking ${stage}.`);
          return;
        }
      }

      // Unchecking Scar: just uncheck it
      await this.actor.update({ [`system.modularSections.ageTrack.stages.${stage}.scar`]: false });
    }
  }

  /**
   * Add a new stunt
   */
  async _onAddStunt(event) {
    event.preventDefault();
    const stunts = [...this.actor.system.stunts];
    stunts.push({ name: "", description: "" });
    await this.actor.update({ 'system.stunts': stunts });
  }

  /**
   * Delete a stunt
   */
  async _onDeleteStunt(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const stunts = [...this.actor.system.stunts];
    stunts.splice(index, 1);
    await this.actor.update({ 'system.stunts': stunts });
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
   * Handle editing an item (NPC or Extra)
   * @param {Event} event - The click event
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    if (item) {
      item.sheet.render(true);
    }
  }

  /**
   * Handle deleting an NPC item
   * @param {Event} event - The click event
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
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
