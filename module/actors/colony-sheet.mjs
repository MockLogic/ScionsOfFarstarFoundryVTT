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

    return context;
  }

  /** @override */
  async _updateObject(event, formData) {
    // Save all ProseMirror editor content first
    this._saveProseMirrorEditors();

    // Expand the formData to handle arrays properly
    const expandedData = foundry.utils.expandObject(formData);

    // Ensure extras array is properly handled
    if (expandedData.system?.extras) {
      // Convert the extras object back to an array, preserving existing descriptions
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

    // Extras management
    html.find('.extra-add').click(this._onAddExtra.bind(this));
    html.find('.extra-delete').click(this._onDeleteExtra.bind(this));

    // NPC item controls
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.roll-npc-skill').click(this._onRollNpcSkill.bind(this));

    // Make NPC items draggable
    html.find('.npc-item').each((i, li) => {
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", this._onDragStart.bind(this), false);
    });
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
      await this.actor.rollFateDice(attribute.name, attribute.rank);
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
      locked: false
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
   * Handle adding a new extra
   * @param {Event} event
   */
  async _onAddExtra(event) {
    event.preventDefault();
    const extras = [...(this.actor.system.extras || [])];
    extras.push({ name: "", description: "" });
    await this.actor.update({ 'system.extras': extras });
  }

  /**
   * Handle deleting an extra
   * @param {Event} event
   */
  async _onDeleteExtra(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const extras = [...(this.actor.system.extras || [])];
    extras.splice(index, 1);
    await this.actor.update({ 'system.extras': extras });
  }

  /**
   * Handle editing an NPC item
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
