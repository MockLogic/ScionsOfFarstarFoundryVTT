/**
 * Registrar Actor Sheet
 * A simple container actor for storing and organizing named NPC items
 */
export class RegistrarSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "actor", "registrar"],
      template: "systems/scions-of-farstar/templates/actor/registrar-sheet.hbs",
      width: 600,
      height: 700,
      dragDrop: [{ dragSelector: ".item", dropSelector: null }]
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

    // Get all items (should be named-npc items) and enrich with calculated data
    context.items = this.actor.items.contents.map(item => {
      const itemData = item.toObject(false);
      return {
        ...itemData,
        npcData: this._calculateNpcData(itemData.system)
      };
    });

    return context;
  }

  /**
   * Calculate NPC data (same logic as NamedNpcSheet)
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

    // Item controls
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.roll-npc-skill').click(this._onRollNpcSkill.bind(this));
  }

  /**
   * Override to move NPCs instead of copying them when dragged between sheets
   * @override
   */
  async _onDropItemCreate(itemData) {
    // Handle array of items or single item
    const items = itemData instanceof Array ? itemData : [itemData];

    // Store source items and their parent actors before creating copies
    const sourceInfo = [];
    for (const data of items) {
      let sourceItem = null;

      // Try to get the source item from UUID
      if (data.uuid) {
        sourceItem = await fromUuid(data.uuid);
      }

      // If we have a source item and it has a parent actor
      if (sourceItem?.parent) {
        sourceInfo.push({
          item: sourceItem,
          parentId: sourceItem.parent.id
        });
      }
    }

    // Call parent to create the item(s) on this actor
    const created = await super._onDropItemCreate(itemData);

    // Delete source items if they came from a different actor
    for (const info of sourceInfo) {
      if (info.parentId !== this.actor.id) {
        console.log(`Scions of FarStar | Moving NPC "${info.item.name}" from ${info.parentId} to ${this.actor.id}`);
        await info.item.delete();
      }
    }

    return created;
  }

  /**
   * Handle editing an item
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
   * Handle deleting an item
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
   * Handle rolling an NPC's skill from the registrar
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
