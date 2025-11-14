/**
 * Base Stunt Item Sheet
 * Parent class for all stunt item types
 */
class StuntSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "item", "stunt"],
      width: 600,
      height: 500
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
    context.itemType = this.item.type;

    // Enrich description HTML
    context.enrichedDescription = await TextEditor.enrichHTML(context.system.description, {
      async: true,
      secrets: this.item.isOwner
    });

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
  }

  /**
   * Auto-detect scope based on skill/capability selection
   * Called after form updates
   * @param {String} skillOrCapability - The selected skill or capability name
   * @returns {String} - "faction", "scion", or "other"
   */
  _detectScope(skillOrCapability) {
    if (!skillOrCapability) return "faction";

    const scionSkills = ["Academics", "Combat", "Deception", "Engineering", "Exploration", "Influence"];
    const factionCapabilities = ["Culture", "Industrial", "Military", "Mobility", "Technology", "People"];

    if (scionSkills.includes(skillOrCapability)) {
      return "scion";
    } else if (factionCapabilities.includes(skillOrCapability)) {
      return "faction";
    }

    return "other";
  }

  /** @override */
  async _updateObject(event, formData) {
    // Auto-update scope based on skill/capability selection
    if (this.item.type === "stunt-basic" && formData["system.skillOrCapability"]) {
      formData["system.scope"] = this._detectScope(formData["system.skillOrCapability"]);
    } else if (this.item.type === "stunt-swap" && formData["system.targetSkillOrCapability"]) {
      // For swap stunts, scope is based on the TARGET skill (being replaced)
      formData["system.scope"] = this._detectScope(formData["system.targetSkillOrCapability"]);
    }

    return super._updateObject(event, formData);
  }
}

/**
 * Basic Stunt Sheet (+2 bonus)
 */
export class StuntBasicSheet extends StuntSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/scions-of-farstar/templates/item/stunt-basic-sheet.hbs"
    });
  }
}

/**
 * Swap Stunt Sheet (skill replacement)
 */
export class StuntSwapSheet extends StuntSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/scions-of-farstar/templates/item/stunt-swap-sheet.hbs"
    });
  }
}

/**
 * Consequence Stunt Sheet (enables minor2)
 */
export class StuntConsequenceSheet extends StuntSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/scions-of-farstar/templates/item/stunt-consequence-sheet.hbs",
      height: 400
    });
  }
}

/**
 * Stress Stunt Sheet (expands scion stress)
 */
export class StuntStressSheet extends StuntSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/scions-of-farstar/templates/item/stunt-stress-sheet.hbs",
      height: 400
    });
  }
}

/**
 * Other Stunt Sheet (free-form)
 */
export class StuntOtherSheet extends StuntSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/scions-of-farstar/templates/item/stunt-other-sheet.hbs",
      height: 400
    });
  }
}
