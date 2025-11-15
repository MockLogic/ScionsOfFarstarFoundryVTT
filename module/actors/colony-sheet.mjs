/**
 * Colony Actor Sheet
 * Handles the UI for colony management
 */
export class ColonySheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "actor", "colony"],
      template: "systems/scions-of-farstar/templates/actor/colony-sheet.hbs",
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      dragDrop: [
        { dragSelector: ".attribute-item", dropSelector: ".attribute-rank" },
        { dragSelector: ".item-list .item", dropSelector: null }
      ]
    });
  }

  /** @override */
  async getData(options) {
    const context = super.getData(options);

    // Use the actor's system data directly to include derived data
    context.system = this.actor.system;
    context.flags = this.actor.flags;

    // Organize attributes by rank for pyramid display
    context.attributesByRank = this._organizeAttributesByRank(context.system.attributes);

    // Calculate counts for each rank
    context.rankCounts = {};
    for (let rank = 0; rank <= 6; rank++) {
      context.rankCounts[rank] = context.attributesByRank[rank].length;
    }

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

  /** @override */
  async _updateObject(event, formData) {
    // Save all ProseMirror editor content first
    this._saveProseMirrorEditors();

    // Expand the formData to handle arrays properly
    const expandedData = foundry.utils.expandObject(formData);

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
   * Organize attributes by rank for pyramid display
   * @param {Array} attributes - Array of attribute objects
   * @returns {Object} Attributes organized by rank (0-6)
   */
  _organizeAttributesByRank(attributes) {
    const byRank = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    attributes.forEach((attr, index) => {
      const rank = Math.max(0, Math.min(6, attr.rank));
      byRank[rank].push({ ...attr, index });
    });

    return byRank;
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
  activateListeners(html) {
    super.activateListeners(html);

    // Roll buttons for attributes
    html.find('.roll-attribute').click(this._onRollAttribute.bind(this));

    // Add attribute button
    html.find('.add-attribute').click(this._onAddAttribute.bind(this));

    // Delete attribute button
    html.find('.delete-attribute').click(this._onDeleteAttribute.bind(this));

    // Population track clicks
    html.find('.population-box').click(this._onPopulationBoxClick.bind(this));

    // Attribute name editing
    html.find('.attribute-name').change(this._onAttributeNameChange.bind(this));

    // Attribute right-click context menu for damage status
    html.find('.attribute-item').on('contextmenu', this._onAttributeContextMenu.bind(this));

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

    // Context menu for aspects (right-click to send to chat)
    html.find('.aspect-box input[type="text"]').on('contextmenu', this._onAspectContextMenu.bind(this));
  }

  /**
   * Handle rolling an attribute
   * @param {Event} event
   */
  async _onRollAttribute(event) {
    event.preventDefault();
    const index = event.currentTarget.closest('.attribute-item').dataset.index;
    const attribute = this.actor.system.attributes[index];

    if (attribute) {
      // Build label with status if not normal
      let label = attribute.name;
      const status = attribute.status || "normal";

      if (status === "damaged") {
        label = `${attribute.name} (${game.i18n.localize("SCIONS.Colony.Damaged")})`;
      } else if (status === "in-repair") {
        label = `${attribute.name} (${game.i18n.localize("SCIONS.Colony.InRepair")})`;
      }

      await this.actor.rollFateDice(label, attribute.rank);
    }
  }

  /**
   * Handle adding a new attribute
   * @param {Event} event
   */
  async _onAddAttribute(event) {
    event.preventDefault();

    const attributes = [...this.actor.system.attributes];
    attributes.push({
      name: "New Attribute",
      rank: 0,
      locked: false,
      status: "normal"
    });

    await this.actor.update({ "system.attributes": attributes });
  }

  /**
   * Handle deleting an attribute
   * @param {Event} event
   */
  async _onDeleteAttribute(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.closest('.attribute-item').dataset.index);
    const attribute = this.actor.system.attributes[index];

    // Prevent deleting locked attributes
    if (attribute.locked) {
      ui.notifications.warn(`Cannot delete ${attribute.name} - it is locked.`);
      return;
    }

    // Confirm deletion
    const confirmed = await Dialog.confirm({
      title: `Delete ${attribute.name}?`,
      content: `<p>Are you sure you want to delete the attribute <strong>${attribute.name}</strong>?</p>`,
      defaultYes: false
    });

    if (!confirmed) {
      return;
    }

    const attributes = this.actor.system.attributes.filter((_, i) => i !== index);
    await this.actor.update({ "system.attributes": attributes });
  }

  /**
   * Handle changing an attribute name
   * @param {Event} event
   */
  async _onAttributeNameChange(event) {
    event.preventDefault();
    const input = event.currentTarget;
    const index = parseInt(input.closest('.attribute-item').dataset.index);
    const attribute = this.actor.system.attributes[index];

    // Prevent renaming locked attributes
    if (attribute.locked) {
      ui.notifications.warn(`Cannot rename ${attribute.name} - it is locked.`);
      input.value = attribute.name; // Reset to original
      return;
    }

    const attributes = [...this.actor.system.attributes];
    attributes[index].name = input.value;

    await this.actor.update({ "system.attributes": attributes });
  }

  /**
   * Handle right-click context menu on attributes to cycle damage status
   * @param {Event} event
   */
  async _onAttributeContextMenu(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const attribute = this.actor.system.attributes[index];

    // Population cannot be damaged
    if (attribute.name === "Population") {
      ui.notifications.info(game.i18n.localize("SCIONS.Colony.PopulationCannotBeDamaged"));
      return;
    }

    const attributes = [...this.actor.system.attributes];
    const currentStatus = attributes[index].status || "normal";

    // Cycle through: normal -> damaged -> in-repair -> normal
    const statusCycle = {
      "normal": "damaged",
      "damaged": "in-repair",
      "in-repair": "normal"
    };

    attributes[index].status = statusCycle[currentStatus];

    await this.actor.update({ "system.attributes": attributes });
  }

  /**
   * Handle population track box clicks
   * @param {Event} event
   */
  async _onPopulationBoxClick(event) {
    event.preventDefault();
    const box = event.currentTarget;
    const index = parseInt(box.dataset.index);
    const boxes = [...this.actor.system.populationTrack.boxes];

    if (!boxes[index]) return;

    // Toggle between ok and expended (no committed state)
    boxes[index].expended = !boxes[index].expended;
    boxes[index].committed = false; // Remove committed state entirely

    await this.actor.update({ "system.populationTrack.boxes": boxes });
  }

  /**
   * Handle beginning of drag operation for attributes and items
   * @override
   */
  _onDragStart(event) {
    const element = event.currentTarget;

    // Check if this is an NPC item drag (has data-item-id)
    const itemId = element.dataset.itemId;
    if (itemId) {
      // This is an item drag - use the parent class handler
      return super._onDragStart(event);
    }

    // This is an attribute drag - use custom handler
    const index = element.dataset.index;
    if (!index) return;

    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Attribute",
      actorId: this.actor.id,
      index: parseInt(index)
    }));
  }

  /**
   * Handle dropping an attribute onto a rank or items onto the sheet
   * @override
   */
  async _onDrop(event) {
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return super._onDrop(event);
    }

    // Handle attribute drops (custom behavior)
    if (data.type === "Attribute" && data.actorId === this.actor.id) {
      event.preventDefault();

      // Get the target rank from the drop zone
      const dropZone = event.target.closest('.attribute-rank');
      if (!dropZone) return;

      const newRank = parseInt(dropZone.dataset.rank);
      const attributeIndex = data.index;

      // Update the attribute's rank
      const attributes = [...this.actor.system.attributes];
      attributes[attributeIndex].rank = newRank;

      await this.actor.update({ "system.attributes": attributes });
      return;
    }

    // For all other drops (like items), use the parent class handler
    return super._onDrop(event);
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

  /**
   * Handle right-click context menu for aspect fields
   * @param {Event} event - The contextmenu event
   */
  async _onAspectContextMenu(event) {
    event.preventDefault();

    const input = event.currentTarget;
    const fieldName = input.getAttribute('name');
    const aspectValue = input.value;

    // Don't show menu if aspect is empty
    if (!aspectValue || aspectValue.trim() === '') {
      return;
    }

    // Determine which aspect was right-clicked based on the field name
    let aspectLabel = '';

    if (fieldName === 'system.aspects.highConcept.value') {
      aspectLabel = game.i18n.localize("SCIONS.Colony.HighConcept") || "High Concept";
    } else if (fieldName === 'system.aspects.trouble.value') {
      aspectLabel = game.i18n.localize("SCIONS.Colony.Trouble") || "Trouble";
    }

    if (!aspectLabel) return;

    // Store values in variables for closure
    const label = aspectLabel;
    const value = aspectValue;

    // Get the parent aspect-box as the context menu container (use [0] to get HTMLElement)
    const aspectBox = $(input).closest('.aspect-box')[0];

    // Create context menu with "Send to Chat" option using Foundry V13 API
    new foundry.applications.ux.ContextMenu(aspectBox, ".aspect-box input[type='text']", [
      {
        name: "Send to Chat",
        icon: '<i class="fas fa-comment"></i>',
        callback: async () => {
          await this._sendAspectToChat(label, value);
        }
      }
    ], { jQuery: false });
  }

  /**
   * Send an aspect to chat
   * @param {string} label - The aspect label
   * @param {string} value - The aspect value
   */
  async _sendAspectToChat(label, value) {
    const content = `
      <div class="aspect-chat-card">
        <div class="aspect-chat-header">
          <h3>${label}</h3>
        </div>
        <div class="aspect-chat-content">
          <p><strong>${value}</strong></p>
          <p class="aspect-source">From: ${this.actor.name}</p>
        </div>
      </div>
    `;

    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    };

    await ChatMessage.create(chatData);
  }
}
