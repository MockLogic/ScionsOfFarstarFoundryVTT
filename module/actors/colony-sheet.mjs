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
      dragDrop: [{ dragSelector: ".attribute-item", dropSelector: ".attribute-rank" }]
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
   * Handle beginning of drag operation
   * @override
   */
  _onDragStart(event) {
    const item = event.currentTarget;
    const index = item.dataset.index;

    if (!index) return;

    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Attribute",
      actorId: this.actor.id,
      index: parseInt(index)
    }));
  }

  /**
   * Handle dropping an attribute onto a rank
   * @override
   */
  async _onDrop(event) {
    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }

    if (data.type !== "Attribute" || data.actorId !== this.actor.id) {
      return;
    }

    // Get the target rank from the drop zone
    const dropZone = event.target.closest('.attribute-rank');
    if (!dropZone) return;

    const newRank = parseInt(dropZone.dataset.rank);
    const attributeIndex = data.index;

    // Update the attribute's rank
    const attributes = [...this.actor.system.attributes];
    attributes[attributeIndex].rank = newRank;

    await this.actor.update({ "system.attributes": attributes });
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
}
