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
      dragDrop: [{ dragSelector: ".attribute-item", dropSelector: ".attribute-rank" }]
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

    // Organize attributes by rank for pyramid display
    context.attributesByRank = this._organizeAttributesByRank(context.system.attributes);

    // Enrich text fields (for rich text editors)
    const enrichHTML = foundry.applications?.ux?.TextEditor?.implementation?.enrichHTML || TextEditor.enrichHTML;
    context.enrichedHighConcept = await enrichHTML(context.system.aspects.highConcept.value, { async: true });
    context.enrichedTrouble = await enrichHTML(context.system.aspects.trouble.value, { async: true });

    return context;
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

    // Cycle through states: empty -> committed -> expended -> empty
    if (!boxes[index].committed && !boxes[index].expended) {
      boxes[index].committed = true;
    } else if (boxes[index].committed) {
      boxes[index].committed = false;
      boxes[index].expended = true;
    } else {
      boxes[index].committed = false;
      boxes[index].expended = false;
    }

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

    const attribute = this.actor.system.attributes[index];

    // Prevent dragging locked attributes
    if (attribute.locked) {
      event.preventDefault();
      ui.notifications.warn(`Cannot move ${attribute.name} - it is locked.`);
      return;
    }

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
}
