/**
 * Simple Aspect Actor Sheet
 * A minimal actor type for tracking scene aspects and boosts with free invokes
 */
export class SimpleAspectSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "actor", "simple-aspect"],
      template: "systems/scions-of-farstar/templates/actor/simple-aspect-sheet.hbs",
      width: 400,
      height: 300,
      dragDrop: []
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

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Free invokes increment/decrement
    html.find('.invoke-increment').click(this._onInvokeIncrement.bind(this));
    html.find('.invoke-decrement').click(this._onInvokeDecrement.bind(this));
  }

  /**
   * Handle incrementing free invokes value
   * @param {Event} event - The click event
   */
  async _onInvokeIncrement(event) {
    event.preventDefault();
    const value = this.actor.system.freeInvokes.value;

    await this.actor.update({
      "system.freeInvokes.value": value + 1
    });
  }

  /**
   * Handle decrementing free invokes value
   * @param {Event} event - The click event
   */
  async _onInvokeDecrement(event) {
    event.preventDefault();
    const value = this.actor.system.freeInvokes.value;

    await this.actor.update({
      "system.freeInvokes.value": Math.max(value - 1, 0)
    });
  }
}
