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

    // Calculate threat trauma for token bar
    this._calculateThreatTrauma(systemData);
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
   * Calculate threat trauma capacity and usage for token bar
   * Only visible sections with countsTowardTrauma=true are included
   */
  _calculateThreatTrauma(systemData) {
    const sections = systemData.modularSections;
    let traumaCapacity = 0;
    let traumaUsed = 0;

    // Single-point stress tracks (per-section checkbox)
    if (sections.singlePointStress.visible && sections.singlePointStress.countsTowardTrauma) {
      ['track1', 'track2'].forEach(trackKey => {
        const track = sections.singlePointStress[trackKey];
        if (track.visible && Array.isArray(track.boxes)) {
          const boxValue = track.traumaValue || 0;
          if (boxValue > 0) {
            track.boxes.forEach(box => {
              traumaCapacity += boxValue;
              if (box.value) traumaUsed += boxValue;
            });
          }
        }
      });
    }

    // Growing stress tracks (per-track checkboxes)
    if (sections.growingStress.visible) {
      ['track1', 'track2'].forEach(trackKey => {
        const track = sections.growingStress[trackKey];
        if (track.visible && track.countsTowardTrauma && Array.isArray(track.boxes)) {
          track.boxes.forEach((box, index) => {
            const boxValue = index + 1; // Growing boxes are worth 1, 2, 3, etc.
            traumaCapacity += boxValue;
            if (box.value) traumaUsed += boxValue;
          });
        }
      });
    }

    // Consequences (per-section checkbox)
    // Minor=2, Minor2=2, Moderate=4, Severe=6
    // Treated consequences still count as used
    if (sections.consequences.visible && sections.consequences.countsTowardTrauma) {
      const cons = sections.consequences;

      // Minor
      if (cons.minor.visible) {
        traumaCapacity += 2;
        if (cons.minor.value) traumaUsed += 2;
      }

      // Minor2
      if (cons.minor2.visible) {
        traumaCapacity += 2;
        if (cons.minor2.value) traumaUsed += 2;
      }

      // Moderate
      if (cons.moderate.visible) {
        traumaCapacity += 4;
        if (cons.moderate.value) traumaUsed += 4;
      }

      // Severe
      if (cons.severe.visible) {
        traumaCapacity += 6;
        if (cons.severe.value) traumaUsed += 6;
      }
    }

    // Age track (per-section checkbox)
    // 1 trauma per wound box (not hidden by scar or passed)
    if (sections.ageTrack.visible && sections.ageTrack.countsTowardTrauma) {
      const stages = sections.ageTrack.stages;
      for (const stageKey in stages) {
        const stage = stages[stageKey];
        // Only count wounds that are not hidden (scar=false and passed=false)
        if (!stage.scar && !stage.passed) {
          traumaCapacity += 1;
          if (stage.wound) traumaUsed += 1;
        }
      }
    }

    // Ladder tracks (per-section checkbox)
    // Use configured traumaValue per rung
    ['ladder1', 'ladder2'].forEach(ladderKey => {
      const ladder = sections[ladderKey];
      if (ladder.visible && ladder.countsTowardTrauma && Array.isArray(ladder.rungs)) {
        const rungValue = ladder.traumaValue || 0;
        if (rungValue > 0) {
          // Only count up to rungCount rungs
          const activeRungs = ladder.rungs.slice(0, ladder.rungCount);
          activeRungs.forEach(rung => {
            traumaCapacity += rungValue;
            if (rung.checked) traumaUsed += rungValue;
          });
        }
      }
    });

    // Store for token bar
    systemData.trauma = {
      value: traumaCapacity - traumaUsed,
      max: traumaCapacity
    };
  }

  /**
   * Override modifyTokenAttribute to lock the trauma bar
   */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    if (attribute === 'trauma') {
      ui.notifications.warn("Threat Trauma cannot be edited directly. Use the character sheet to manage stress tracks, consequences, age track, and ladders.");
      return this;
    }
    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
  }

  /**
   * Configure default token settings for new actors
   * @override
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    // Set default token configuration
    const prototypeToken = {
      displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,  // Always show name
      displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,  // Always show bars
      bar1: { attribute: "trauma" },                   // Primary bar: Trauma
      disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE    // Threats are hostile by default
    };

    this.updateSource({ prototypeToken });
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
