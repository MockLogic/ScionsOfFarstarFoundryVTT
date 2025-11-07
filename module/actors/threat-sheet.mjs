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

  /** @override */
  async _updateObject(event, formData) {
    // Save all ProseMirror editor content first
    this._saveProseMirrorEditors();

    // Expand the formData to handle arrays properly
    const expandedData = foundry.utils.expandObject(formData);

    // Ensure stunts and extras arrays are properly handled
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

    if (expandedData.system?.extras) {
      const extrasObj = expandedData.system.extras;
      const extrasArray = Object.values(extrasObj);

      // Merge with existing extra data to preserve rich text descriptions
      const currentExtras = this.actor.system.extras || [];
      extrasArray.forEach((extra, index) => {
        if (currentExtras[index] && !extra.description) {
          extra.description = currentExtras[index].description;
        }
      });

      expandedData.system.extras = extrasArray;
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
   * Toggle between edit and play modes
   */
  async _onToggleEditMode(event) {
    event.preventDefault();
    const currentMode = this.actor.system.editMode;
    await this.actor.update({ 'system.editMode': !currentMode });
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
   * Toggle a ladder rung checkbox
   */
  async _onToggleLadderRung(event) {
    event.preventDefault();
    const ladder = event.currentTarget.dataset.ladder;
    const index = parseInt(event.currentTarget.dataset.index);
    const rungs = [...this.actor.system.modularSections[ladder].rungs];

    if (rungs[index]) {
      rungs[index].checked = !rungs[index].checked;
      await this.actor.update({ [`system.modularSections.${ladder}.rungs`]: rungs });
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
   * Add a new extra
   */
  async _onAddExtra(event) {
    event.preventDefault();
    const extras = [...this.actor.system.extras];
    extras.push({ name: "", description: "" });
    await this.actor.update({ 'system.extras': extras });
  }

  /**
   * Delete an extra
   */
  async _onDeleteExtra(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const extras = [...this.actor.system.extras];
    extras.splice(index, 1);
    await this.actor.update({ 'system.extras': extras });
  }
}
