# Scions of FarStar - Foundry VTT System Design Document

**Design Version:** 1.3
**Current System Version:** 1.11.2
**Target Foundry Version:** v13 build 351
**System Type:** Custom Fate-based system
**Repository:** GitHub (private/personal use)
**Status:** Phase 4 Complete - In Active Gameplay

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Custom Mechanics](#custom-mechanics)
3. [Actor Types](#actor-types)
4. [Item Types](#item-types)
5. [Technical Requirements](#technical-requirements)
6. [Implementation Status](#implementation-status)

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
- **Implementation:** Uses Lancer Initiative module (see [Third-Party Module Integration](#third-party-module-integration))

---

## Actor Types

### 1. Faction-Scion Sheet (Combined)

**Philosophy:** A Scion is a feature of their Faction, not a separate entity. One combined sheet represents both, but many features are specific to the Scion.

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
- Can increase to 5 boxes via stunt (only once)

**Age Track:** (5 stages intentional in order of age, does not auto-clear)
- Youthful (16-29)
- Seasoned (30-49)
- Older (50-69)
- Geriatric (70-89)
- Ancient (90+)

Each stage has four checkboxes:
- **Passed:** Mark when advancing to next age as generations advance
- **Wound:** Marked when taking hit on this stage (gives free invoke to enemies)
- **Free Invoke Used:** Tracks if enemy has used the free invoke from a wound
- **Scar:** Permanent trauma marker reduces lifespan but clears wounds

**Age Track Validation (Sequential Rules):**
- **Passed Checkboxes:** Must be checked sequentially from youngest to oldest
  - Cannot mark "Seasoned: Passed" unless "Youthful: Passed" is checked
  - Cannot mark "Older: Passed" unless both Youthful and Seasoned are passed
  - And so on through the age stages
  - Ensures realistic aging progression
- **Scar Checkboxes:** Must be checked sequentially from oldest to youngest (reverse)
  - Cannot mark "Older: Scar" unless "Geriatric: Scar" is checked
  - Cannot mark "Seasoned: Scar" unless Older is scarred
  - Represents that older age stages are more fragile and scar first
  - System alerts but does NOT prevent invalid scar patterns (player discretion)
- **Wounds and Free Invokes:** No sequential validation - can be marked on any stage at any time

**Advancement:** Scions get a +1 to a Skill per age category crossed (passed). Scions become more skilled but more fragile.

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
1. Culture
2. Industrial
3. Military
4. Mobility
5. Technology
6. People

**People Track:** (Growing boxes like Fate Core stress: [1][2][3][4][5][6]...)
- Functions as both resource and stress
- Number of boxes = People capability rating
- **Three-State System:**
  - **Empty (unchecked):** People available for commitment
  - **Committed (white check):** People assigned to tasks, vulnerable to stress, do NOT count toward trauma
  - **Expended (black/filled check):** People lost/casualties, DO count toward Faction Trauma
- Visual indicators: Empty → White check (committed) → Black check (expended)
- Only expended boxes contribute to trauma bar calculations

**Consequences:** (Clear generationally after treatment)
- **Minor (2):** Clears at end of scene after treatment (overcome vs difficulty 2)
- **Moderate (4):** Lasts through end of current generation after treatment (overcome vs difficulty 4, rename)
- **Severe (6):** Lasts through NEXT generation after treatment (overcome vs difficulty 6, rename)
- Each has treatment checkbox
- **Free Invoke Tracking:** Standard Fate mechanic - when you inflict a consequence on an enemy, you get one free invoke
  - Visual indicator: Green circle with white + symbol appears when consequence has an available free invoke
  - Click to toggle free invoke checkbox (tracks whether it's been used)
  - Applies to all actor types with consequences (Faction-Scion, Threat)

**Stunts:**
- 3 starting stunts per faction-scion (drag stunt items to sheet)
- Recommend 1 faction stunt, 1 scion stunt, 1 player's choice
- Extra stunts gained by reducing Refresh (4 stunts = Refresh 2, 5 stunts = Refresh 1, etc.)
- See [Stunt Items](#stunt-items-5-types) for five stunt types with macro support

**Named NPCs:**
- Minor NPCs tracked as items on the Faction-Scion sheet
- Each has: name, aspect, single skill with rating, description, and age track
- Age track has 6 stages (Child 0-15, Youthful 16-29, Seasoned 30-49, Older 50-69, Geriatric 70-89, Ancient 90+)
- Can be marked as VIP to appear prominently on main faction tab
- VIP Cross-Over System: Players create NPCs that connect their faction to another player's faction
  - Promotes party cohesion by highlighting shared connections
  - Demonstrates that factions are not exclusive (NPCs can belong to multiple groups)
  - Example: An NPC might be part of a family faction AND work for a corporate faction
- Named NPCs age and may eventually need replacement as generations pass

**Extras:**
- Custom item-based extras (see [Item Types](#item-types) section)
- Can be added by GM or players as needed
- Provide mechanical effects beyond basic text descriptions

**Token Bars:** Faction-Scion tokens have two bars by default, with a third selectable:
 - **Bar 1 (Default): Scion Trauma** - Read-only, calculated
   - Formula: `stress boxes checked + age track wounds (NOT scars or passed stages)`
   - Example: 2 stress boxes + 1 wound = 3 trauma
   - Updates automatically when stress or age track changes on sheet
 - **Bar 2 (Selectable): Faction Trauma** - Read-only, calculated
   - Formula: `consequences present + expended People Track boxes`
   - Does NOT count committed People boxes (only expended/black checks)
   - Example: 1 Minor consequence + 3 expended People = 2 + 3 = 5 trauma
   - Updates automatically when consequences or People Track changes on sheet
 - **Bar 3: Fate Points** - Editable resource bar
   - Current/max based on Refresh
   - Can be adjusted on token or sheet
 - **Note:** Faction-Scion is a single sheet and defaults to showing Scion Trauma, but Faction Trauma bar is selectable if the token is being used for faction-level representation

**Skill Validation:** Faction-Scion sheets SHOULD validate skills, capabilities, and stunts. Indicate when too high or low.
 - Scion Skills: Max rating = Highest skill. Total skills goes up with Age.
 - Faction Capabilities: Max rating = highest Capability + Major Milestones. Total ratings is starting values + Signficatn Milestones.
 - Stunts vs Refresh: Starting stunts = 3, Refresh = 3. Each additional stunt reduces Refresh by 1. Refresh minimum = 1. Refresh increases with Major Milestones.

---

### 2. Threat Front Sheet (Dynamic/Configurable)

**Philosophy:** Highly flexible sheet that can represent factions, environmental hazards, ideological movements, plagues, alien swarms, etc. GM configures visibility of features per threat. No validation needed.

#### Always Visible
- **Threat Name**
- **High Concept** (Aspect 1)

#### Aspects (Configurable Labels & Visibility)
- **Aspect 2:** Default label "Trouble" (customizable, can hide)
- **Aspect 3:** Default label "Inheritance" (customizable, can hide)
- **Aspect 4:** Default label "Connection" (customizable, can hide)
- **Aspect 5:** Default label "Scion" (customizable, can hide)

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
- Drag stunt items to threat sheet
- All five stunt types available (see [Stunt Items](#stunt-items-5-types))
- No validation or Refresh cost for threats

#### Extras (Unlimited)
- Drag extra items to threat sheet
- All five extra types available (see [Extra Items](#extra-items-5-types))
- Provides flexible mechanics for unique threat features

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

**Token Bars:** Threat tokens have a dynamic trauma bar:
 - Configurable in Edit Mode: individual sections can be marked to "count toward trauma"
 - Automatically calculates based on enabled trauma-contributing elements
 - Read-only on token (cannot be manually edited)
 - Examples: Can count stress only, consequences only, age track, or any combination

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
- Attributes use Fate skill column structure like Fate Core skills.
- **Population Growth Limit:** Population rating cannot exceed (Generations / 2, rounded down) + 1
  - Example: Generation 1 = max Population 1, Generation 3 = max Population 2, Generation 5 = max Population 3
  - Represents plausible colony growth even when pushed hard and fast
  - Requires supporting infrastructure to grow before Population can increase

**Attribute Damage System:**
- Attributes can be marked as "damaged" status (not standard consequences)
- Damaged attributes represent impacted colony features requiring repairs
- Examples: "Power: Damaged" means brownouts, "Food: Damaged" means rationing
- Damage cleared through repair efforts (overcome actions)
- **Note:** Attribute damage does NOT count toward trauma bars (only Population Track boxes do)

#### Population Track
- Based on Population attribute rating
- Displays as checkboxes: [1][2][3][4][5]...
- Number of boxes = Population rating
- Can be marked off to represent casualties/stress
- Clear at generational advances
- Counts toward trauma bar along with consequences

#### Consequences (Non-Standard)
Colonies do NOT use standard Fate consequences. Instead, they use the Attribute Damage system (see above).
- Attributes can be marked as damaged to represent colony-level stress
- Repairs required to clear damage
- More narrative and infrastructure-focused than personal consequences

#### Attributes Configuration
- Population is always called Population
- next 3 default to: Power, Food, Water
- Can add/remove/rename as needed
- Each attribute has rating (0-6)
- Click to roll 4dF + rating

#### Extras
- Extra items can be added to colony sheet
- Useful for tracking colony-wide conditions, projects, or resources
- See [Extra Items](#extra-items-5-types) for available types

**Token Bars:** Colony tokens have a Population Trauma bar:
 - **Population Trauma** - Read-only, calculated
   - Formula: `Population Track boxes checked`
   - Does NOT include attribute damage (colonies use attribute damage system, not consequences)
   - Example: If Population rating is 3 and all 3 boxes are checked = 3 + 2 + 1 = 6 trauma
   - Automatically updates when Population Track boxes change on sheet
   - Represents colony-wide casualties

**Validation:** Colony sheet SHOULD validate:
 - **Pyramid structure for attributes:** Total attribute ranks should follow Fate skill column structure
   - Expected total formula: `expectedTotal = 6 + generationNumber`
   - Example: Generation 1 = 7 total attribute ranks, Generation 5 = 11 total attribute ranks
   - Alerts player if total is too high or too low (but does not prevent)
 - **Population growth limit:** max Population = (Generation / 2, rounded down) + 1
   - Example: Gen 1-2 = max Pop 1, Gen 3-4 = max Pop 2, Gen 5-6 = max Pop 3
   - Alerts player if Population exceeds limit (but does not prevent)

---

### 4. Registrar Sheet (Organizational Tool)

**Philosophy:** A simple organizational actor for tracking collections of Named NPCs without cluttering other sheets.

#### Purpose
- Stores Named NPC items for archival or organizational purposes
- Example use cases:
  - "Book of the Dead" - deceased NPCs removed from active sheets but still tracked
  - "Hall of Heroes" - notable historical figures
  - "Contact List" - NPCs not directly part of any faction
  - NPC pools for GM reference

#### Features
- Contains only a notes field and can hold Named NPC items
- No mechanical features
- Purely organizational
- Can be shared or GM-only as needed

---

### 5. Simple Aspect Sheet (Scene Aspects)

**Philosophy:** Fate gameplay often involves placing aspects on scenes. Traditional Foundry solutions (journal entries, drawings) are clunky. Simple Aspect actors provide a clean token-based solution.

#### Purpose
- Represent scene aspects, situation aspects, or boosts
- Dropped onto the scene as tokens
- Token name IS the aspect text
- Easy to create, rename, and remove during play

#### Features
- **Free Invokes:** Tracks available free invokes (default: 1, configurable)
- **Token-Based:** Drag to scene, position where relevant
- **Flexible:** Can represent temporary advantages, environmental aspects, or ongoing conditions
- No complex mechanics - just aspect name and invoke tracking

#### Usage Examples
- "On Fire" aspect placed on a building token
- "Ambush Prepared" boost for a prepared position
- "Supply Shortage" aspect affecting a district
- "Inspired by Speech" temporary morale boost

---

## Item Types

Scions of FarStar uses structured item types for mechanical features that can be added to actors. This allows for drag-and-drop functionality, macro integration, and visual customization.

---

### Named NPC (Item)

**Purpose:** Represents a minor NPC associated with a faction, including cross-faction connections.

**Data Structure:**
- **Basic Info:** Name, aspect, description
- **Skill:** Single skill name and rating
- **Age Track:** 6 stages (Child, Youthful, Seasoned, Older, Geriatric, Ancient)
  - Each stage has scar checkbox
  - Tracks which generation NPC was born
- **Visual:** Icon background color customization
- **VIP Flag:** Marks NPC to appear on main faction tab

**Usage:**
- Drag to Faction-Scion sheet
- Mark as VIP for cross-faction connection NPCs
- Age track shows generational progression
- Roll skill directly from NPC item

---

### Stunt Items (5 Types)

**Philosophy:** Stunts are structured items rather than freeform text to enable macro creation and mechanical clarity.

#### Stunt-Basic
- **Purpose:** Standard "+2 bonus when..." stunt
- **Fields:**
  - Scope (scion/faction/other)
  - Skill or Capability affected
  - Action type
  - Description of when it applies
- **Macro:** Can be dragged to hotbar for quick reference

#### Stunt-Swap
- **Purpose:** "Use [X] instead of [Y] when..." stunt
- **Fields:**
  - Scope (scion/faction/other)
  - Target skill/capability (what you're replacing)
  - Replacement skill/capability (what you use instead)
  - Action type
  - Description of when it applies
- **Macro:** Drag to hotbar

#### Stunt-Consequence
- **Purpose:** Adds an extra consequence slot to Faction
- **Fields:**
  - Scope (typically faction)
  - Description
- **Effect:** Grants additional Minor, Moderate, or Severe consequence

#### Stunt-Stress
- **Purpose:** Expands Scion stress track from 3 to 5 boxes (usable once only)
- **Fields:**
  - Scope (typically scion)
  - Description
- **Effect:** Adds 2 additional stress boxes to Scion

#### Stunt-Other
- **Purpose:** Freeform stunts with unique effects
- **Fields:**
  - Scope
  - Description
- **Usage:** For stunts that don't fit other categories

**All Stunts:**
- Icon background color customization
- Rich text descriptions
- Counted against Refresh (3 stunts = Refresh 3, 4 stunts = Refresh 2, etc.)
- **Auto-Scope Detection:** When a Scion dies or retires, the system allows changing stunt scopes
  - Useful for transitioning stunts from a retired Scion to their successor
  - Example: "Tactical Genius" might shift from the old Scion's Combat skill to the new Scion's Influence skill
  - Or convert a personal stunt to a faction-level legacy stunt
  - Helps maintain mechanical continuity across generational transitions
  - System detects scope changes and prompts for confirmation

---

### Extra Items (5 Types)

**Philosophy:** Extras represent unique mechanical features, conditions, or resources that don't fit standard aspects or stunts. They provide visual customization and invoke tracking.

**Common Features (All Extras):**
- Aspect label and text
- Description field (rich text)
- Icon tint color and background color
- Invoke tracking (configurable max invokes)

#### Extra-Aspect
- **Purpose:** Simple aspect with invokes
- **Usage:** Temporary conditions, special advantages, campaign-specific aspects
- **Example:** "Blessed by the Ancients" aspect gained through story event

#### Extra-Ladder
- **Purpose:** Aspect with attached countdown ladder (2-10 stages)
- **Usage:** Progressive conditions, diseases, ongoing projects
- **Example:** Disease with stages: Exposed → Symptoms → Serious → Critical → Terminal
- **Features:**
  - Configurable number of rungs
  - Each rung has aspect text and checkbox
  - Optional trauma value

#### Extra-Skill
- **Purpose:** Aspect with attached skill rating
- **Usage:** Temporary skill boosts, specialized knowledge, equipment bonuses
- **Example:** "Advanced Scanner" extra granting bonus to Exploration
- **Features:**
  - Skill name and rating
  - Click to roll 4dF + rating

#### Extra-Track
- **Purpose:** Aspect with single-value stress track [1][1][1]...
- **Usage:** Resources, ammunition, limited-use items
- **Example:** "Drone Squadron" with 5 boxes representing individual drones
- **Features:**
  - Configurable track length (1-10 boxes)
  - Each box is single-value
  - Click boxes to toggle

#### Extra-Growing-Track
- **Purpose:** Aspect with growing-value stress track [1][2][3]...
- **Usage:** Scalable resources, reinforcements, population-like resources
- **Example:** "Manufactured Drone Army" growing from small to large force
- **Features:**
  - Configurable track length (1-10 boxes)
  - Boxes have increasing values like People track
  - Click boxes to toggle

**Extra Usage Examples:**
- Disease tracking on Scion (Extra-Ladder)
- Prototype equipment (Extra-Skill)
- Limited ammunition (Extra-Track)
- Growing military force (Extra-Growing-Track)
- Quest reward aspect (Extra-Aspect)

---

## Game Globals

These settings track campaign-wide progression and affect validation rules across all sheets.

### Campaign Progression Trackers
- **Generation Number:** Default: 1
  - Tracks which generation of Scions the campaign is on
  - Increments when the party advances to next generation
  - For reference only - consequence recovery is handled manually by players

- **Significant Milestones:** Default: 0
  - Tracks number of Significant Milestones achieved
  - Each Significant Milestone allows Factions to increase one Capability by +1
  - For reference only - players manually adjust capabilities

- **Major Milestones:** Default: 0
  - Tracks number of Major Milestones achieved
  - Each Major Milestone increases Max Capability by +1
  - Used for Faction Capability validation caps

### Validation Caps
- **Max Skill:** Default: +4
  - Maximum rating for Scion Skills
  - May be adjusted by GM for high-powered campaigns
  - Scions can exceed this via Age Track advancement

- **Max Capability:** Default: +3
  - Maximum rating for Faction Capabilities at campaign start
  - Increases by +1 per Major Milestone
  - Formula: Base (+3) + Major Milestones = Current Max Capability
  - Used for Faction Capability validation

**Implementation Notes:**
- These should be accessible from world settings or a campaign tracker UI
- Validation logic should reference these globals when checking skill/capability limits
- Max Capability should be dynamic based on Major Milestones count

### Game Globals API

The system provides JavaScript helper methods accessible via `game.scionsOfFarstar` for common operations:

**Available Methods:**
- **Campaign Progression Access:**
  - `game.scionsOfFarstar.getGeneration()` - Returns current generation number
  - `game.scionsOfFarstar.getSignificantMilestones()` - Returns significant milestone count
  - `game.scionsOfFarstar.getMajorMilestones()` - Returns major milestone count
  - `game.scionsOfFarstar.getMaxSkill()` - Returns max skill rating cap
  - `game.scionsOfFarstar.getMaxCapability()` - Returns current max capability (base + major milestones)

- **Validation Helpers:**
  - `game.scionsOfFarstar.validateFactionScionSkills(actor)` - Checks skill pyramid and caps
  - `game.scionsOfFarstar.validateFactionScionCapabilities(actor)` - Checks capability pyramid and caps
  - `game.scionsOfFarstar.validateColonyAttributes(actor)` - Checks colony pyramid and population limit
  - `game.scionsOfFarstar.calculateScionTrauma(actor)` - Returns Scion trauma value
  - `game.scionsOfFarstar.calculateFactionTrauma(actor)` - Returns Faction trauma value
  - `game.scionsOfFarstar.calculateColonyTrauma(actor)` - Returns Colony trauma value

- **Utility Helpers:**
  - `game.scionsOfFarstar.createFateMacro(name, bonus)` - Creates a /Fate chat macro
  - `game.scionsOfFarstar.rollFate(bonus, label)` - Programmatically rolls 4dF + bonus
  - `game.scionsOfFarstar.shareToChat(actor, element, data)` - Shares sheet element to chat

**Usage Examples:**
```javascript
// Get current max capability based on milestones
let maxCap = game.scionsOfFarstar.getMaxCapability(); // Returns 3 + major milestones

// Calculate trauma for token bar update
let trauma = game.scionsOfFarstar.calculateScionTrauma(actor);

// Roll Fate dice programmatically
game.scionsOfFarstar.rollFate(2, "Combat Check");
```

**Purpose:** These helpers centralize common validation logic and calculations, ensuring consistency across sheets and macros. They're primarily used internally by the system but are also available for advanced users and macro creators.

---

## Technical Requirements

### Foundry Version
- **Target:** Foundry VTT v13 build 351
- **System Type:** Fully custom (not a fork)

### Fonts & Assets
- **Fate Core Official Font** for Fate symbols (+, -, blank, stress boxes)
- All Fate-specific icons should use official font (https://fate-srd.com/official-licensing-fate)

### Dice Rolling & /Fate Chat Command
- **Critical Requirement:** Must display individual die results
- Players need to see: `[+] [-] [-] [blank]` to use invoke mechanic
- Show total modifier separate from individual dice
- Format: 4dF dice icons + total = final result
- Use official Fate font for display

**The /Fate Chat Command:**
- Custom chat command for rolling Fate dice: `/Fate [modifier] [label]`
- Example: `/Fate +2 Combat` rolls 4dF+2 with "Combat" label
- Creates formatted chat cards with individual die results
- Detailed usage guide available in separate documentation
- Can be used for manual combined rolls (Leadership, Scale, etc.)

### Roll Buttons & Macro Creation
- **Skills/Capabilities clickable to roll** 4dF + rating directly from sheet
- **Drag to Macro Bar:** Skills, Capabilities, and Stunts can be dragged to the macro hotbar
  - Creates /Fate chat macros automatically
  - Preserves skill/capability name and rating
  - Quick access to frequently used rolls
- **Stunt Items:** Can be dragged to macro bar for quick reference
- No complex roll dialogs needed
- Manual calculation for combined rolls (Leadership, Scale)
- Generic "Roll 4dF" button also available to roll without skill value

### Character Sheet Features
- Support for Foundry Add-on Module PopOut! (https://github.com/League-of-Foundry-Developers/fvtt-module-popout)
- Responsive design for different screen sizes
- Clean separation of Scion/Faction sections on combined sheet, highlighting Faction as primary and Scion as a major feature of the Faction.

### Handlebars Helpers

The system provides 20+ custom Handlebars helpers for use in templates. These helpers enable dynamic sheet rendering, validation displays, and formatting.

**Common Helpers:**
- **Fate Dice & Symbols:**
  - `{{fateDie value}}` - Renders Fate die symbol (+, -, blank) using Fate Core font
  - `{{fateBox checked state}}` - Renders stress/track checkbox with appropriate styling
  - `{{fateTotal diceArray}}` - Calculates total from Fate dice roll array

- **Validation & Display:**
  - `{{skillValidation skills maxSkill}}` - Returns validation class/message for skill pyramid
  - `{{capabilityValidation capabilities maxCap}}` - Returns validation class/message for capability pyramid
  - `{{ageStageClass stage}}` - Returns CSS class for age track stage display
  - `{{traumaValue actor type}}` - Calculates trauma value for specific actor type
  - `{{peopleBoxState box}}` - Returns state class for People Track box (empty/committed/expended)

- **Formatting:**
  - `{{signedNumber value}}` - Formats number with +/- prefix (e.g., "+2", "-1", "0")
  - `{{capitalize string}}` - Capitalizes first letter
  - `{{times n block}}` - Repeats block n times (for generating checkbox arrays)
  - `{{json obj}}` - Safely stringifies JSON for data attributes

- **Conditional Logic:**
  - `{{ifEquals a b}}` - Equality comparison for conditionals
  - `{{ifGreater a b}}` - Greater-than comparison
  - `{{and a b}}` - Logical AND for multiple conditions
  - `{{or a b}}` - Logical OR for multiple conditions

- **Actor/Item Specific:**
  - `{{hasVips actor}}` - Checks if actor has any VIP-flagged Named NPCs
  - `{{getExtras actor type}}` - Filters extras by type
  - `{{stuntScope stunt}}` - Returns readable scope label for stunt
  - `{{ladderProgress ladder}}` - Returns checked rung count / total rungs

**Usage Example:**
```handlebars
<!-- Display signed skill bonus -->
<div class="skill-value">{{signedNumber skill.value}}</div>

<!-- Render Fate stress boxes -->
{{#times stress.max}}
  {{fateBox ../stress.boxes.[this] "stress"}}
{{/times}}

<!-- Conditional validation styling -->
<div class="{{skillValidation scion.skills maxSkill}}">
  Skills total: {{skillTotal}}
</div>
```

**Purpose:** These helpers keep template logic clean and centralize complex calculations and formatting. They ensure consistent rendering across all sheet types and reduce duplication in template files.

### Share to Chat Features
In Fate, transparency is important - players need to see certain information to invoke aspects and understand the situation. The system includes "Share to Chat" functionality for key features:

**Faction-Scion Consequences:**
- Right-click or button to send consequence to chat
- Shows consequence name, severity, and treatment status
- Allows players to invoke enemy consequences
- Creates formatted chat card visible to all players

**Threat Sheet Elements:**
- Threat aspects can be shared to chat
- Consequences can be shared (similar to Faction-Scion)
- Other threat features can be selectively revealed
- Helps GM maintain Fate's transparency principle while controlling information flow

**Design Philosophy:**
- Fate requires visible aspects for invokes
- Chat sharing allows selective revelation without opening entire sheet
- Formatted cards provide clear, professional information display
- Maintains game flow without constant sheet permissions management

### Interactive Elements (Always Available in Play)
All sheets should have these elements clickable/editable during normal play:

**Stress-like Tracks (Click to Toggle):**
- Scion Stress boxes (toggle checked/unchecked)
- Faction People Track boxes (toggle checked/unchecked)
- Colony Population Track boxes (toggle checked/unchecked)
- Threat stress tracks - both single-box and growing-box types (toggle checked/unchecked)

**Age Tracks (Click to Toggle - All Four States):**
- Passed checkboxes (mark when advancing age)
- Wound checkboxes (mark to absorb stress)
- Free Invoke Used/Unused toggle (wounds give free invokes to enemies until used)
- Scar checkboxes (permanent marks)

**Countdown Ladders (Click to Toggle Only):**
- Stage checkboxes (mark stages as they're reached)
- Stage text is locked in Edit Mode, not editable during play

**Consequences (EXCEPTION - Text Editable + Checkbox):**
- Consequence text fields (edit to write/rename consequences during play)
- Treatment checkboxes (mark when consequence is treated)

**Aspects (Generally Not Editable in Play):**
- Most aspects are set outside of play and not edited during sessions
- Exception: Consequences can be edited (see above)
- Threat aspects may need to be editable in Edit Mode only

**Fate Points:**
- Current Fate Points should be easily adjustable (increment/decrement buttons helpful)

### Edit vs Play Mode (Threat Sheets Only)
- **Edit Mode:** Configure which elements are visible, set track lengths, customize labels, add/remove skills/capabilities
- **Play Mode:** All configured elements visible, but interactive elements (stress, ladders, consequences, aspects) remain editable
- Toggle between modes via button in sheet header

### Data Validation
- **Faction-Scion sheets:** Validate Fate pyramid structure for skills/capabilities, max ratings, and stunt/refresh balance
- **Colony sheet:** Validate Fate pyramid structure for Attributes
- **Threat sheets:** No validation (freeform)
- **Manual Player Management:** Consequence recovery, Age Track advancement, capability increases from milestones

### Permissions

**Sheet Editing:**
- Players can edit their own Faction-Scion sheets
- GM can edit all sheets
- Colony sheet is editable by all players (shared resource)
- Threat sheets are GM-only (not visible to players unless shared)
- Registrar sheets follow standard ownership permissions
- Simple Aspect sheets follow standard ownership permissions

**Item Creation Restrictions:**
- **Named NPCs:** Can only be created by GM or Trusted players
  - Prevents abuse of VIP cross-faction system
  - GMs can grant Trusted role to players who need to create cross-faction NPCs
- **Extras:** Can only be created by GM or Trusted players
  - Extras provide mechanical benefits and should be GM-approved
  - Players can request extras from GM
- **Stunts:** Can be created by players (no restriction)
  - Stunts are balanced by Refresh cost
  - Subject to GM approval during character creation/advancement

**Rationale:** Named NPCs and Extras can significantly impact game balance and narrative, so creation is restricted to GMs and Trusted players. Stunts are self-balancing through the Refresh economy.

### Token Bars & Trauma System
Tokens for actors have specialized bar configurations that automatically track mechanical state:

**Faction-Scion Tokens:**
- **Bar 1 (Scion Trauma):** Read-only calculated bar
  - Automatically aggregates: Scion stress boxes + Age Track wounds/scars
  - Cannot be manually edited on token
  - Updates when stress boxes or age track checkboxes are modified on sheet
- **Bar 2 (Faction Trauma):** Read-only calculated bar
  - Automatically aggregates: Faction consequences + People Track stress
  - Cannot be manually edited on token
  - Updates when consequences are added/cleared or People Track boxes are marked
- **Bar 3 (Fate Points):** Editable resource bar
  - Current Fate Points value
  - Can be adjusted directly on token or sheet
  - Max value equals current Refresh

**Threat Tokens:**
- **Dynamic Trauma Bar:** Configurable read-only bar
  - In Edit Mode, individual sheet sections can be marked to "count toward trauma"
  - Examples: stress tracks, consequences, age track
  - Trauma value auto-calculates based on which sections are enabled and marked
  - Cannot be manually edited on token
  - Updates when any trauma-contributing element changes on sheet
- Threats can have any combination of elements contributing to trauma
- Example: A threat might count only consequences, or only stress, or both, or neither

**Colony Tokens:**
- **Population Trauma Bar:** Read-only calculated bar
  - Tracks Population Track stress boxes only
  - Does NOT include attribute damage (colonies use attribute damage system instead of consequences)
  - Cannot be manually edited on token
  - Updates when Population Track boxes change on sheet
  - Represents colony-wide casualties

**Design Philosophy:**
- Trauma bars are **calculated, not editable** to prevent desync between sheet and token
- Players/GM modify the underlying mechanics (stress, consequences, wounds) on sheets
- Token bars automatically reflect aggregate state for at-a-glance status
- Prevents accidental trauma bar manipulation that doesn't match actual mechanical state

### Compendium Packs
The system includes three compendium packs for ease of use:

**Example Stunts:**
- Pre-built stunt items demonstrating all five stunt types
- Provides templates for common stunt patterns
- Players can drag to their sheets and customize

**Templates:**
- Pre-configured actor templates (Faction-Scion, Threat, Colony)
- Example setups for common threat types
- Starting configurations for new campaigns

**Example Macros:**
- Helpful macros for common operations
- Rolling utilities
- Aspect and consequence management
- Can be dragged to macro hotbar

### Third-Party Module Integration
Several game mechanics are enhanced through recommended third-party Foundry VTT modules, but the system is designed to work without hard dependencies.

**Lancer Initiative Module:**
- Recommended for story-based/popcorn initiative system
- Supports Elective Action Order gameplay
- Players declare actions when narratively appropriate
- Provides Ready vs Done status tracking
- No automated turn order - purely narrative-driven
- **Not Required:** Game works fine with manual initiative tracking

**Party Resources Module:**
- Recommended for tracking GM Fate Points pool
- Shared resource pool visible to all players
- Allows GM to spend/gain fate points transparently
- Maintains Fate's economy of fate point exchanges
- Players can see when GM compels or spends fate points
- **Not Required:** GM can track fate points manually or via other means

**Dice So Nice Module:**
- Provides 3D dice rolling animations
- System is designed to work with Dice So Nice if present
- Gracefully degrades if module is not installed
- **Not Required:** Rolls work perfectly without visual effects

**PopOut! Module:**
- Allows character sheets to be popped out into separate windows
- Useful for multi-monitor setups
- Players can keep sheets open while viewing scene
- **Not Required:** Sheets work normally in-window

**Design Philosophy:**
- **No Hard Dependencies:** System must work without any third-party modules
- **Don't Reinvent Wheels:** Use existing solutions where they exist
- **Graceful Degradation:** Enhanced experience with modules, functional without them
- **Module Independence:** If a recommended module vanishes, gameplay continues unaffected
- **Focus Resources:** Spend development time on system-specific features, not general Foundry problems
- These modules enhance the experience but are completely optional

---

## Implementation Status

**Current Status:** Phase 4 Complete - System in Active Gameplay

### Phase 1: Core System ✅ COMPLETE
- ✅ system.json manifest
- ✅ template.json with all actor types
- ✅ Actor sheet HTML/CSS for all three core types
- ✅ Fate dice roller with individual die display using official Fate font
- ✅ Roll buttons on skills/capabilities with 4dF display
- ✅ /Fate chat command for manual rolls with formatted output
- ✅ Drag-to-macro-bar functionality for skills, capabilities, and stunts

### Phase 2: Threat Sheets ✅ COMPLETE
- ✅ Dynamic show/hide system for modular sections
- ✅ Edit/Play mode toggle
- ✅ Configurable ladder lengths (2-10 rungs)
- ✅ Dynamic skill/capability slots (8 each)
- ✅ Multiple stress track types (single-value and growing)
- ✅ Optional age track

### Phase 3: Colony Sheet ✅ COMPLETE
- ✅ Dynamic attribute system with add/remove/rename
- ✅ Pyramid validation
- ✅ Population track tied to Population attribute
- ✅ Shared editing permissions

### Phase 4: Polish & Extended Features ✅ COMPLETE
- ✅ Styling and layout refinement
- ✅ Fate Core font integration for dice and symbols
- ✅ Dice So Nice module integration (optional, graceful degradation)
- ✅ Pop-out window support (tested with PopOut! module)
- ✅ Permission system configuration
- ✅ Named NPC item type with age tracking
- ✅ VIP cross-faction connection system
- ✅ Structured stunt items (5 types) with macro support
- ✅ Extra items (5 types) for flexible mechanics
- ✅ Registrar actor for NPC organization
- ✅ Simple Aspect actor for scene aspects
- ✅ Compendium packs (example stunts, templates, macros)
- ✅ Localization support
- ✅ Chat card integration for aspects and consequences
- ✅ Icon and visual customization systems
- ✅ Token bar system with read-only calculated trauma bars
- ✅ Dual trauma bars for Faction-Scion (Scion + Faction)
- ✅ Dynamic configurable trauma system for Threats
- ✅ Fate Points bar integration for tokens

### Ongoing Development
The system is feature-complete for active gameplay. Future updates will be driven by actual play:
- Quality-of-life improvements
- Bug fixes as discovered
- Minor features requested during campaign
- Balance adjustments based on play experience

**No major features are currently planned or missing from original design goals.**

---

## Version History

- **v1.0** (2025-11-02): Initial design document
- **v1.1** (2025-11-07): Tweaked at first "release" version
- **v1.2** (2025-11-?): Updates during development iterations
- **v1.3** (2025-11-21): Updated to reflect Phase 4 completion and document all implemented features including Named NPCs, VIP system, structured items, and extended actor types
3