# Scions of FarStar - Foundry VTT System Design Document

**Design Version:** 1.0  
**Target Foundry Version:** v13 build 350  
**System Type:** Custom Fate-based system  
**Repository:** GitHub (private/personal use)

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Custom Mechanics](#custom-mechanics)
3. [Actor Types](#actor-types)
4. [Technical Requirements](#technical-requirements)
5. [Data Structures](#data-structures)

---

## Game Overview

**Scions of FarStar** is a multigenerational sci-fi colony game using heavily customized Fate mechanics. Players control both individual Scions (leaders) and their Factions over multiple generations as they build a colony on a distant world.

### Core Concepts
- **Generational Play:** Characters age, advance, and are replaced by successors
- **Dual Management:** Players control both a Scion (individual) and a Faction (organization)
- **Colony Building:** Shared colony sheet tracks collective progress
- **Dynamic Threats:** GM uses flexible threat sheets to represent rivals, dangers, and challenges

---

## Custom Mechanics

### Invokes
**Non-standard:** Instead of granting +2, invokes allow fixing a single die result:
- Change a `-` to `blank` or `+`
- Change a `blank` to `+`
- Prevents alpha-strike stacking of bonuses

**Technical Requirement:** Dice roll display MUST show individual die results (not just totals).

### Leadership Rolls
When a Scion leads faction activities, combine bonuses:
- Scion Skill + Faction Capability + 4dF
- Manually calculated (no automation required)

### Scale System
Based on People/resources committed to action:
- 5 vs 50 = disadvantage
- Manually calculated situationally

### Story-Based Initiative
Uses Elective Action Order / Popcorn Initiative:
- Players declare actions when narratively appropriate
- No automated turn order needed
- Status tracking (Ready vs Done states)

---

## Actor Types

### 1. Faction-Scion Sheet (Combined)

**Philosophy:** A Scion is a feature of their Faction, not a separate entity. One combined sheet represents both.

#### Scion Section

**Aspects:**
- 1 Scion Aspect (personal defining trait)

**Skills:** (6 skills, Fate pyramid: +3/+2/+1/+1/+0/-1, max +4, Skill points increased by Age Track)
1. Academics
2. Combat
3. Deception
4. Engineering
5. Exploration
6. Influence

**Stress Track:**
- 3 single-point boxes (clear between scenes)
- Can increase to 5 boxes via stunt (only once, manually expand)

**Age Track:** (5 stages intentional in order of age, does not auto-clear)
- Youthful (16-29)
- Seasoned (30-49)
- Older (50-69)
- Geriatric (70-89)
- Ancient (90+)

Each stage has three checkboxes:
- **Passed/Crossed:** Mark when advancing to next age
- **Wound:** Marked when taking hit on this stage (gives free invoke to enemies)
- **Scar:** Permanent wound marker (no free invoke)

**Advancement:** Scions get a +1 to a Skill per age category crossed. Scions become more skilled but more fragile.

**Design Note:** Age numbers do not need to be visible in the actor sheets, but the order shown is important. Best arranged vertically.

#### Faction Section

**Refresh and Fate Points**
- Starting Refresh is 3
- Current Fate points can be higher or lower as they are spent or gained.

**Aspects:**
- High Concept
- Trouble
- Inheritance (generational legacy)

**Capabilities:** (6 capabilities, Fate pyramid: +2/+2/+1/+1/+0/-1, max +6)
1. Cultutre
2. Industrial
3. Military
4. Mobility
5. People
6. Technology

**People Track:** (Growing boxes like Fate Core stress: [1][2][3][4][5][6]...)
- Functions as both resource and stress
- Can be committed to tasks (dividing forces)
- Only committed boxes are vulnerable to stress
- Clears between scenes
- Number of boxes = People capability rating

**Consequences:** (Clear generationally after treatment)
- **Minor (2):** Clears at end of scene after treatment (overcome vs difficulty 2)
- **Moderate (4):** Lasts through end of current generation after treatment (overcome vs difficulty 4, rename)
- **Severe (6):** Lasts through NEXT generation after treatment (overcome vs difficulty 6, rename)
- Each has treatment checkbox

**Stunts:**
- 3 starting stunts per faction-scion
- 1 faction stunt, 1 scion stunt, 1 player's choice
- Freeform text (title + description)
- Extra stunts gained through reducing Refresh

**Extras:**
- Freeform text (title + description)
- None by default, can be added by GM only but edited by owner if added.
- No Validation

**Skill Validation:** Faction-Scion sheets SHOULD validate skills, capabilities, and stunts. Indicate when too high or low.
 - Scion Skills should always total base values + 1 per age track marked. 
 - Faction Capabilities should always total starting capbilities +1 per Signficant Milestone.
 - The number of Stunts should always be at least 3 and for each additional one, the Refresh should be reduced. Refresh should never go below 1.

---

### 2. Threat Front Sheet (Dynamic/Configurable)

**Philosophy:** Highly flexible sheet that can represent factions, environmental hazards, ideological movements, plagues, alien swarms, etc. GM configures visibility of features per threat. No validation needed.

#### Always Visible
- **Threat Name**
- **Type** (freeform text: Faction/Environmental/Ideological/etc.)
- **High Concept** (Aspect 1)

#### Aspects (Configurable Labels & Visibility)
- **Aspect 2:** Default label "Trouble" (customizable, can hide)
- **Aspect 3:** Default label "Aspect 3" (customizable, can hide)
- **Aspect 4:** Default label "Aspect 4" (customizable, can hide)
- **Aspect 5:** Default label "Aspect 5" (customizable, can hide)

#### Skills (8 slots, dynamic)
- Custom name per slot
- Rating value (+X)
- Click to roll 4dF + rating
- Empty slots can be hidden
- **Defaults for slots 1-6:** Use Scion skill names (Influence, Combat, Academics, Engineering, Exploration, Deception)
- **Defaults for slots 7-8:** "Extra A", "Extra B"

#### Capabilities (8 slots, dynamic)
- Custom name per slot
- Rating value (+X)
- Click to roll 4dF + rating
- Empty slots can be hidden
- **Defaults for slots 1-6:** Use Faction capability names (Military, Industrial, Technology, Culture, Mobility, People)
- **Defaults for slots 7-8:** "Extra A", "Extra B"

#### Age Track (Optional, can hide)
- Same as Scion age track
- 5 stages: Youthful/Seasoned/Older/Geriatric/Ancient
- Each stage: Passed checkbox, Wound checkbox, Scar checkbox
- Wounds give free invokes to enemies

#### Countdown Ladders (2 available)
- **Ladder 1:** Configurable 2-10 stages (visible by default with 5 stages)
- **Ladder 2:** Configurable 2-10 stages (hidden by default)
- Each stage:
  - Name/aspect (becomes situation aspect when reached)
  - Checkbox (marked/unmarked)
  - No description field needed
- Name for each ladder is editable
- Best arranged vertically

#### Stress Tracks (2 types available)
- **Single-box track:**
  - Default name: "Stress"
  - 1-10 configurable boxes (dispalyed as [1][1][1]...)
  - Can hide
  - Hidden by default
  
- **Growing-box track:**
  - Default name: "People"
  - 1-10 configurable boxes (displayed as [1][2][3]...)
  - Can hide
  - **Visible by default with 3 boxes**

#### Consequences (Individually toggleable)
- **Minor (2)** + treatment checkbox (visible by default)
- **Second Minor (2)** + treatment checkbox (hidden by default)
- **Moderate (4)** + treatment checkbox (visible by default)
- **Severe (6)** + treatment checkbox (visible by default)

#### Stunts (Unlimited)
- Add/remove dynamically
- Each stunt: Title + rich text description
- Freeform, no validation

#### Extras (Unlimited)
- Add/remove dynamically
- Each Extra: Title + rich text description
- Freeform, no validation

#### Default Visibility (New Threat)
When creating new threat, these elements are visible:
- High Concept
- Trouble (Aspect 2)
- Aspect 3
- Capabilities 1-6 (slots visible with default names, ratings at 0)
- Growing track ("People") with 3 boxes
- Consequences: Minor/Moderate/Severe with treatment checkboxes
- Ladder 1: 5 stages

#### Edit vs Play Mode
- **Edit Mode:** Configuration interface where GM can show/hide elements, set track lengths, customize labels
- **Play Mode:** Shows only enabled/configured elements in clean view
- Toggle between modes via interface

**Skill Validation:** Threat sheets do NOT enforce Fate pyramid or advancement rules. Freeform ratings allowed.

---

### 3. Colony Sheet (Shared)

**Philosophy:** Represents the entire colony as a shared resource/challenge. Uses Fate's pyramid advancement system with goal of Population depending on supporting infrastructure.

#### Aspects
- **High Concept**
- **Trouble**
- **Aspect 3:** Default label "Aspect 3" (customizable, hidden by default)
- **Aspect 4:** Default label "Aspect 4" (customizable, hidden by default)
- **Aspect 5:** Default label "Aspect 5" (customizable, hidden by default)

#### Attributes (Dynamic Skill Pyramid)
- **Population** (always present, special attribute)
- **Custom Attributes** (player-named, typical examples):
  - Power
  - Food
  - Water
  - Housing
  - Medical
  - Defense
  - etc,

**Pyramid Rules:** 
- Attributes use Fate skill pyramid structure

#### Population Track
- Based on Population attribute rating
- Displays as checkboxes: [1][2][3][4][5]...
- Number of boxes = Population rating
- Can be marked off to represent casualties/stress
- Clear at generational advances

#### Consequences (Same as Faction)
- **Minor (2)** + treatment checkbox
- **Moderate (4)** + treatment checkbox  
- **Severe (6)** + treatment checkbox
- Same recovery timing as factions (generational)

#### Attributes Configuration
- Population is always called Population
- next 3 default to: Power, Food, Water
- Can add/remove/rename as needed
- Each attribute has rating (0-6)
- Click to roll 4dF + rating

**Skill Validation:** Colony sheet SHOULD validate pyramid structure for attributes.

---

## Technical Requirements

### Foundry Version
- **Target:** Foundry VTT v13 build 350
- **System Type:** Fully custom (not a fork)

### Fonts & Assets
- **Fate Core Official Font** for Fate symbols (+, -, blank, stress boxes)
- All Fate-specific icons should use official font (https://fate-srd.com/official-licensing-fate)

### Dice Rolling
- **Critical Requirement:** Must display individual die results
- Players need to see: `[+] [-] [-] [blank]` to use invoke mechanic
- Show total modifier separate from individual dice
- Format: 4dF dice icons + total = final result
- Use offical Fate font for dispaly.

### Roll Buttons
- Skills/Capabilities clickable to roll 4dF + rating
- No complex roll dialogs needed
- Manual calculation for combined rolls (Leadership, Scale)
- Generic "Roll 4dF" button also available, and roll without skill value

### Character Sheet Features
- Support for Foundry Add-on Module PopOut! (https://github.com/League-of-Foundry-Developers/fvtt-module-popout)
- Responsive design for different screen sizes
- Clean separation of Scion/Faction sections on combined sheet, highlighting Faction as primary and Scion as a major feature of the Faction.
- Edit/Play mode toggle for Threat sheets
- Consequence text fields should be editble play mode.

### Data Validation
- **Faction-Scion sheets:** Enforce various skill/capability/stunt counts
- **Colony sheet:** Enforce pyramid rules for Attributes
- **Threat sheets:** No validation (freeform)

### Permissions
- Players should be able to edit their Faction-Scion sheet
- GM can edit all sheets
- Colony sheet should be editable by all players
- Threat sheets are GM-only

---

## Implementation Notes

### Phase 1: Core System
1. Create system.json manifest
2. Create template.json with all three actor types
3. Basic actor sheet HTML/CSS for Faction-Scion
4. Implement Fate dice roller with individual die display
5. Basic roll buttons on skills/capabilities

### Phase 2: Threat Sheets
1. Implement dynamic show/hide system
2. Edit/Play mode toggle
3. Configurable ladder lengths
4. Dynamic skill/capability slots

### Phase 3: Colony Sheet
1. Dynamic attribute system
2. Pyramid validation
3. Population track tied to Population attribute

### Phase 4: Polish
1. Styling and layout refinement
2. Fate font integration
3. Pop-out window testing
4. Permission system configuration

---

## Version History

- **v1.0** (2024-11-02): Initial design document
