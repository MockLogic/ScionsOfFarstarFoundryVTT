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

    // Get all items (should be named-npc items)
    context.items = this.actor.items.contents;

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Item controls
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
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
}
