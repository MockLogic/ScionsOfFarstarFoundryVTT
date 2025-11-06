/**
 * Threat Actor Class
 * Represents a flexible GM-only threat (disease, swarm, faction, character, weather, etc.)
 */
export class ThreatActor extends Actor {

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

    // Initialize skill columns to ensure all 8 slots exist
    this._prepareSkillColumns(systemData);

    // Initialize stress track boxes based on max values
    this._prepareStressTracks(systemData);

    // Initialize ladder rungs based on rung counts
    this._prepareLadders(systemData);

    // Determine current age stage if age track is enabled
    if (systemData.modularSections.ageTrack.visible) {
      systemData.currentAgeStage = this._determineCurrentAge(systemData.modularSections.ageTrack.stages);
    }
  }

  /**
   * Ensure skill columns have all 8 slots populated
   */
  _prepareSkillColumns(systemData) {
    ['capabilitiesColumn', 'skillsColumn'].forEach(columnKey => {
      const column = systemData.modularSections[columnKey];
      if (!Array.isArray(column.skills)) {
        column.skills = [];
      }
      // Ensure we have exactly 8 skill slots
      while (column.skills.length < 8) {
        column.skills.push({ name: "", value: 0 });
      }
    });
  }

  /**
   * Initialize stress track boxes based on max values
   */
  _prepareStressTracks(systemData) {
    const singlePoint = systemData.modularSections.singlePointStress;
    const growing = systemData.modularSections.growingStress;

    // Single-point stress tracks
    ['track1', 'track2'].forEach(trackKey => {
      const track = singlePoint[trackKey];
      if (!Array.isArray(track.boxes) || track.boxes.length !== track.max) {
        track.boxes = [];
        for (let i = 0; i < track.max; i++) {
          track.boxes.push({ value: false });
        }
      }
    });

    // Growing stress tracks
    ['track1', 'track2'].forEach(trackKey => {
      const track = growing[trackKey];
      if (!Array.isArray(track.boxes) || track.boxes.length !== track.max) {
        track.boxes = [];
        for (let i = 0; i < track.max; i++) {
          track.boxes.push({ value: false });
        }
      }
    });
  }

  /**
   * Initialize ladder rungs based on rung counts
   */
  _prepareLadders(systemData) {
    ['ladder1', 'ladder2'].forEach(ladderKey => {
      const ladder = systemData.modularSections[ladderKey];
      if (!Array.isArray(ladder.rungs)) {
        ladder.rungs = [];
      }
      // Ensure we have exactly rungCount rungs (up to 10)
      while (ladder.rungs.length < ladder.rungCount) {
        ladder.rungs.push({ aspect: "", checked: false });
      }
    });
  }

  /**
   * Determine the current age stage based on which stages are marked as "Passed"
   * Current age = the first stage after the last "Passed" stage
   */
  _determineCurrentAge(ageTrack) {
    const stages = ['youthful', 'seasoned', 'older', 'geriatric', 'ancient'];

    // Find the last stage marked as "Passed"
    let lastPassedIndex = -1;
    for (let i = 0; i < stages.length; i++) {
      if (ageTrack[stages[i]].passed) {
        lastPassedIndex = i;
      }
    }

    // Current age is the stage after the last passed one
    const currentIndex = lastPassedIndex + 1;

    // If we've passed Ancient, there's no current age
    if (currentIndex >= stages.length) {
      return null;
    }

    return stages[currentIndex];
  }

  /**
   * Roll a Fate dice check (4dF + modifier)
   */
  async rollFateDice(skillOrCap, modifier = 0, label = null) {
    const rollLabel = label || skillOrCap;

    // Use the imported function from main module
    const { rollFateDice, createFateRoll } = await import('../scions-of-farstar.mjs');

    return createFateRoll(rollLabel, modifier, this);
  }
}
