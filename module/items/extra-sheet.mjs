/**
 * Extra Item Sheet
 * Handles the UI for all Extra item types (aspect, ladder, skill, track, growing-track)
 */
export class ExtraSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["scions-of-farstar", "sheet", "item", "extra"],
      template: "systems/scions-of-farstar/templates/item/extra-sheet.hbs",
      width: 600,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
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

    // Calculate ladder data if this is a ladder extra
    if (this.item.type === 'extra-ladder') {
      context.ladderData = this._calculateLadderData(context.system);
    }

    return context;
  }

  /**
   * Calculate ladder display data (similar to threat sheet ladder)
   * @param {Object} systemData - The item's system data
   * @returns {Object} - Calculated ladder data
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

    // Find the first (topmost) unchecked rung index
    let highestUncheckedIndex = -1;
    for (let i = 0; i < rungs.length; i++) {
      if (!rungs[i].checked) {
        highestUncheckedIndex = i;
        break;
      }
    }

    // Build display data for each rung
    const rungsDisplay = rungs.map((rung, index) => ({
      index: index,
      aspect: rung.aspect || '',
      checked: rung.checked || false,
      isHighestUnchecked: index === highestUncheckedIndex
    }));

    return {
      rungs: rungsDisplay,
      highestUncheckedIndex: highestUncheckedIndex
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Clear background button
    html.find('.clear-bg-button').click(this._onClearBackground.bind(this));

    // Send to Chat button
    html.find('.send-to-chat').click(this._onSendToChat.bind(this));

    // Invoke checkboxes
    html.find('.invoke-box').click(this._onInvokeToggle.bind(this));

    // Invoke count adjusters
    html.find('.invoke-increment').click(this._onInvokeAdjust.bind(this, 1));
    html.find('.invoke-decrement').click(this._onInvokeAdjust.bind(this, -1));

    // Ladder rung checkboxes - handled by Foundry's auto-save via name attribute

    // Ladder rung count adjusters
    html.find('.rung-increment').click(this._onRungCountAdjust.bind(this, 1));
    html.find('.rung-decrement').click(this._onRungCountAdjust.bind(this, -1));

    // Track box checkboxes
    html.find('.track-box').click(this._onTrackBoxToggle.bind(this));

    // Track length adjusters
    html.find('.track-increment').click(this._onTrackLengthAdjust.bind(this, 1));
    html.find('.track-decrement').click(this._onTrackLengthAdjust.bind(this, -1));

    // Skill roll button
    html.find('.roll-extra-skill').click(this._onRollSkill.bind(this));
  }

  /**
   * Handle clearing the icon background color
   * @param {Event} event - The click event
   */
  async _onClearBackground(event) {
    event.preventDefault();
    await this.item.update({ 'system.iconBackground': '' });
  }

  /**
   * Handle sending the Extra to chat
   * @param {Event} event - The click event
   */
  async _onSendToChat(event) {
    event.preventDefault();

    const system = this.item.system;
    const extraName = this.item.name;
    const extraType = this.item.type;

    // Build the chat card HTML
    const iconBgStyle = system.iconBackground ? `background-color: ${system.iconBackground};` : '';
    const tintStyle = system.tintColor ? `border-color: ${system.tintColor};` : '';

    // Calculate available free invokes
    const availableInvokes = system.invokes && system.invokes.length > 0
      ? system.invokes.filter(inv => !inv.spent).length
      : 0;

    let cardHTML = `
      <div class="extra-chat-card" style="${tintStyle}">
        <div class="extra-chat-header">
          <img src="${this.item.img}" alt="${extraName}" class="extra-icon" style="${iconBgStyle}"/>
          <h3 class="extra-name">${extraName}</h3>
        </div>
        <div class="extra-chat-body">
    `;

    // Add aspect if present
    if (system.aspect) {
      const aspectLabel = system.aspectLabel || 'Aspect';
      cardHTML += `
        <div class="extra-section">
          <strong>${aspectLabel}:</strong> ${system.aspect}`;

      // Add free invoke badge with count if multiple
      if (availableInvokes > 0) {
        if (availableInvokes === 1) {
          cardHTML += ` <span class="free-invoke-badge">Free Invoke</span>`;
        } else {
          cardHTML += ` <span class="free-invoke-badge">Free Invoke <span class="invoke-count">x${availableInvokes}</span></span>`;
        }
      }

      cardHTML += `
        </div>
      `;
    }

    // Add ladder information if this is an extra-ladder
    if (extraType === 'extra-ladder' && system.rungs) {
      const ladderLabel = system.ladderLabel || 'Ladder';
      const traumaValue = system.traumaValue || 0;

      // Find the highest unchecked rung (currently active)
      let highestUncheckedIndex = -1;
      for (let i = 0; i < system.rungs.length; i++) {
        if (!system.rungs[i]?.checked) {
          highestUncheckedIndex = i;
          break;
        }
      }

      cardHTML += `
        <div class="extra-section ladder-section">
          <strong>${ladderLabel}:</strong>
          <div class="ladder-display-chat">
      `;

      // Show all rungs (not just the active one)
      system.rungs.forEach((rung, index) => {
        if (rung.aspect) {
          const checkedClass = rung.checked ? 'checked' : '';
          const activeClass = index === highestUncheckedIndex ? 'active' : '';

          // Show box with value (if trauma value set) or empty
          cardHTML += `
            <div class="ladder-rung-row ${activeClass}">
              <div class="chat-box ${checkedClass}">
                ${traumaValue > 0 ? `<span class="box-value">${traumaValue}</span>` : ''}
              </div>
              <span class="rung-aspect ${checkedClass}">${rung.aspect}</span>
            </div>
          `;
        }
      });

      cardHTML += `
          </div>
        </div>
      `;
    }

    // Add skill information if this is an extra-skill
    if (extraType === 'extra-skill' && system.skillName) {
      cardHTML += `
        <div class="extra-section">
          <strong>Skill:</strong> ${system.skillName} (+${system.skillValue || 0})
        </div>
      `;
    }

    // Add track information if this is an extra-track or extra-growing-track
    if ((extraType === 'extra-track' || extraType === 'extra-growing-track') && system.boxes) {
      const trackLabel = system.trackLabel || 'Track';
      const isGrowing = extraType === 'extra-growing-track';
      const trackValue = system.trackValue || 0;

      cardHTML += `
        <div class="extra-section">
          <strong>${trackLabel}:</strong>
          <div class="track-display-chat">
      `;

      // Display each box visually
      system.boxes.forEach((box, index) => {
        const boxValue = isGrowing ? index + 1 : trackValue;
        const checkedClass = box.checked ? 'checked' : '';

        cardHTML += `
          <div class="chat-box ${checkedClass}">
            ${boxValue > 0 ? `<span class="box-value">${boxValue}</span>` : ''}
          </div>
        `;
      });

      cardHTML += `
          </div>
        </div>
      `;
    }

    // Add description if present
    if (system.description) {
      // Strip HTML tags from description for chat display
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = system.description;
      const plainDescription = tempDiv.textContent || tempDiv.innerText || '';

      if (plainDescription.trim()) {
        cardHTML += `
          <div class="extra-section description">
            ${plainDescription}
          </div>
        `;
      }
    }

    cardHTML += `
        </div>
      </div>
    `;

    // Create the chat message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content: cardHTML,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /** @override */
  async _updateObject(event, formData) {
    // Expand the formData to handle arrays properly
    const expandedData = foundry.utils.expandObject(formData);

    // Convert ladder rungs object back to array if needed
    if (expandedData.system?.rungs) {
      const rungsObj = expandedData.system.rungs;
      if (typeof rungsObj === 'object' && !Array.isArray(rungsObj)) {
        expandedData.system.rungs = Object.values(rungsObj);
      }
    }

    // Convert invokes object back to array if needed
    if (expandedData.system?.invokes) {
      const invokesObj = expandedData.system.invokes;
      if (typeof invokesObj === 'object' && !Array.isArray(invokesObj)) {
        expandedData.system.invokes = Object.values(invokesObj);
      }
    }

    // Convert boxes object back to array if needed
    if (expandedData.system?.boxes) {
      const boxesObj = expandedData.system.boxes;
      if (typeof boxesObj === 'object' && !Array.isArray(boxesObj)) {
        expandedData.system.boxes = Object.values(boxesObj);
      }
    }

    // Update the item with the expanded data
    return this.item.update(expandedData);
  }

  /**
   * Handle toggling invoke boxes
   * @param {Event} event - The click event
   */
  async _onInvokeToggle(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);

    const invokes = Array.isArray(this.item.system.invokes) ? [...this.item.system.invokes] : [];
    if (invokes[index]) {
      invokes[index].spent = !invokes[index].spent;
      await this.item.update({ 'system.invokes': invokes });
    }
  }

  /**
   * Handle adjusting invoke count
   * @param {number} delta - Amount to adjust (+1 or -1)
   * @param {Event} event - The click event
   */
  async _onInvokeAdjust(delta, event) {
    event.preventDefault();

    const currentMax = this.item.system.maxInvokes;
    const newMax = Math.max(0, Math.min(10, currentMax + delta));

    if (newMax === currentMax) return;

    // Adjust the invokes array to match new size
    let invokes = this.item.system.invokes;
    if (!Array.isArray(invokes)) {
      invokes = [];
      for (let i = 0; i < currentMax; i++) {
        invokes.push({ spent: false });
      }
    } else {
      invokes = [...invokes];
    }

    if (newMax > currentMax) {
      // Add new invoke boxes
      for (let i = currentMax; i < newMax; i++) {
        invokes.push({ spent: false });
      }
    } else {
      // Remove invoke boxes from the end
      invokes.splice(newMax);
    }

    await this.item.update({
      'system.maxInvokes': newMax,
      'system.invokes': invokes
    });
  }

  /**
   * Handle adjusting ladder rung count
   * @param {number} delta - Amount to adjust (+1 or -1)
   * @param {Event} event - The click event
   */
  async _onRungCountAdjust(delta, event) {
    event.preventDefault();

    const currentCount = this.item.system.rungCount;
    const newCount = Math.max(1, Math.min(10, currentCount + delta));

    if (newCount === currentCount) return;

    // Adjust the rungs array to match new size
    // Ensure rungs is an array
    let rungs = this.item.system.rungs;
    if (!Array.isArray(rungs)) {
      rungs = [];
      for (let i = 0; i < currentCount; i++) {
        rungs.push({ aspect: "", checked: false });
      }
    } else {
      rungs = [...rungs];
    }

    if (newCount > currentCount) {
      // Add new rungs
      for (let i = currentCount; i < newCount; i++) {
        rungs.push({ aspect: "", checked: false });
      }
    } else {
      // Remove rungs from the end
      rungs.splice(newCount);
    }

    await this.item.update({
      'system.rungCount': newCount,
      'system.rungs': rungs
    });
  }

  /**
   * Handle toggling track box checkboxes
   * @param {Event} event - The click event
   */
  async _onTrackBoxToggle(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);

    const boxes = Array.isArray(this.item.system.boxes) ? [...this.item.system.boxes] : [];
    if (boxes[index]) {
      boxes[index].checked = !boxes[index].checked;
      await this.item.update({ 'system.boxes': boxes });
    }
  }

  /**
   * Handle adjusting track length
   * @param {number} delta - Amount to adjust (+1 or -1)
   * @param {Event} event - The click event
   */
  async _onTrackLengthAdjust(delta, event) {
    event.preventDefault();

    const currentLength = this.item.system.trackLength;
    const newLength = Math.max(1, Math.min(10, currentLength + delta));

    if (newLength === currentLength) return;

    // Adjust the boxes array to match new size
    let boxes = this.item.system.boxes;
    if (!Array.isArray(boxes)) {
      boxes = [];
      for (let i = 0; i < currentLength; i++) {
        boxes.push({ checked: false });
      }
    } else {
      boxes = [...boxes];
    }

    if (newLength > currentLength) {
      // Add new boxes
      for (let i = currentLength; i < newLength; i++) {
        boxes.push({ checked: false });
      }
    } else {
      // Remove boxes from the end
      boxes.splice(newLength);
    }

    await this.item.update({
      'system.trackLength': newLength,
      'system.boxes': boxes
    });
  }

  /**
   * Handle rolling the Extra's skill
   * @param {Event} event - The click event
   */
  async _onRollSkill(event) {
    event.preventDefault();

    const skillName = this.item.system.skillName;
    const skillValue = this.item.system.skillValue || 0;

    if (!skillName) return;

    // Import the createFateRoll function
    const { createFateRoll } = await import("../scions-of-farstar.mjs");

    // Create the label and roll
    const label = `${this.item.name}: ${skillName}`;
    await createFateRoll(label, skillValue, null, this.item.name);
  }
}
