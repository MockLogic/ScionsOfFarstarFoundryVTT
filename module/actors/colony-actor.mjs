/**
 * Colony Actor Class
 * Represents a colony with attributes pyramid and population tracking
 */
export class ColonyActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Prepare derived data for the actor
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;

    // Generate Population Track boxes based on Population attribute rank
    this._preparePopulationTrack(systemData);
  }

  /**
   * Generate Population Track boxes based on Population attribute rank
   * @param {Object} systemData - The actor's system data
   */
  _preparePopulationTrack(systemData) {
    const populationAttr = systemData.attributes.find(attr => attr.name === "Population");
    const populationRank = populationAttr ? populationAttr.rank : 0;

    console.log('Colony Actor | Population attribute:', populationAttr);
    console.log('Colony Actor | Population rank:', populationRank);

    // Generate boxes based on population rank (max 6)
    const numBoxes = Math.max(0, Math.min(6, populationRank));

    console.log('Colony Actor | Number of boxes to generate:', numBoxes);

    // Initialize boxes array if needed
    if (!systemData.populationTrack) {
      systemData.populationTrack = { boxes: [] };
    }
    if (!systemData.populationTrack.boxes) {
      systemData.populationTrack.boxes = [];
    }

    // Ensure we have the right number of boxes
    while (systemData.populationTrack.boxes.length < numBoxes) {
      systemData.populationTrack.boxes.push({
        value: systemData.populationTrack.boxes.length + 1,
        committed: false,
        expended: false
      });
    }

    // Remove excess boxes
    if (systemData.populationTrack.boxes.length > numBoxes) {
      systemData.populationTrack.boxes = systemData.populationTrack.boxes.slice(0, numBoxes);
    }

    console.log('Colony Actor | Final boxes:', systemData.populationTrack.boxes);
  }

  /**
   * Roll a Fate dice check (4dF + modifier)
   * @param {String} attributeName - The attribute being rolled
   * @param {Number} modifier - The modifier value
   * @param {String} label - Label for the roll
   */
  async rollFateDice(attributeName, modifier = 0, label = null) {
    const rollLabel = label || attributeName;

    // Use the imported function from main module
    const { createFateRoll } = await import('../scions-of-farstar.mjs');

    return createFateRoll(rollLabel, modifier, this);
  }
}
