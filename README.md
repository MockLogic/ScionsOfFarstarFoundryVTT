# Scions of FarStar - Foundry VTT System

A custom Foundry VTT game system for **Scions of FarStar**, a multigenerational sci-fi colony-building RPG using heavily modified Fate mechanics. It is intended for a personal game.

---

## What is Scions of FarStar?

**Scions of FarStar** is a tabletop RPG about building a colony on a distant world across multiple generations. Players control both individual leaders (Scions) and their organizations (Factions) as they face threats, explore alien landscapes, and shape the future of humanity's newest home.

### Core Themes
- **Generational Play:** Characters age, gain experience, and eventually pass leadership to successors
- **Dual Management:** Each player controls both a Scion (individual hero) and their Faction (organization/tribe/corporation)
- **Colony Building:** Players collectively manage a shared colony that grows over time
- **Long-Term Consequences:** Decisions echo through generations

### Game Mechanics Highlights
- Based on Fate Core/Condensed but heavily customized
- **Custom Invoke Mechanic:** Instead of +2, fix individual die results to prevent alpha-strikes
- **Age Tracks:** Scions become more skilled but more fragile as they age
- **Generational Advancement:** Both Scions and Factions grow stronger over time
- **Dynamic Threats:** GM uses flexible threat sheets to represent everything from rival factions to alien plagues

---

## Project Status

🚧 **IN DEVELOPMENT** 🚧

This is a custom Foundry VTT system being built for a private home game. It is not intended for public use and is not supported beyond my own use.

I am building this with AI assistance.

**Current Version:** Early Development  
**Target Foundry Version:** v13 build 350

---

## Repository Structure

```
/
├── README.md           # This file - project overview
├── DESIGN.md          # Comprehensive design document (READ THIS FIRST)
├── system.json        # Foundry system manifest
├── template.json      # Actor/Item data structures
├── module/            # JavaScript modules
├── styles/            # CSS stylesheets
├── templates/         # Handlebars templates for sheets
├── lang/              # Localization files
└── assets/            # Images, fonts, icons
```

---

## For Developers (Including AI Assistants)

### 📖 READ FIRST: `DESIGN.md`

Before making any changes or additions to this system, **read the `DESIGN.md` file**. It contains:
- Complete specifications for all three actor types (Faction-Scion, Threat, Colony)
- Custom mechanics explanations
- Data structure definitions
- Technical requirements
- Implementation guidelines

### Key Design Principles

1. **Three Actor Types, Three Purposes:**
   - **Faction-Scion:** Combined player character sheet (Scion + their Faction on one sheet)
   - **Threat:** Highly configurable GM tool for rivals, dangers, environmental hazards
   - **Colony:** Shared resource sheet representing the entire colony

2. **Custom Fate Mechanics:**
   - Invokes fix dice instead of granting +2 (effects roll visiblity needs)
   - Age tracks replace traditional consequences for Scions
   - Generational consequence recovery for Factions/Colony
   - Story-based initiative (no turn order automation needed)

3. **Flexibility Over Automation:**
   - Focus on tracking and organization
   - Manual calculation for complex rolls (Leadership, Scale)
   - Individual die results must be visible (for invoke mechanic)
   - Validation where needed (pyramids), freeform where appropriate (threats)

4. **Dynamic Configuration:**
   - Threat sheets can show/hide features as needed
   - Edit vs Play modes for GM sheets
   - Customizable labels and track lengths

---

## Game Design Context

### What Makes This Different From Standard Fate?

**Standard Fate Core:**
- Invoking aspects grants +2 or reroll
- Characters have stress + three consequence slots
- Skills advance through milestones
- Single character per player

**Scions of FarStar:**
- Invoking aspects **fixes individual die results** (- to +, blank to +)
- **Scions** have stress + age track (no consequences)
- **Factions** have People track + three consequences (generational recovery)
- Skills/Capabilities advance **automatically with age/generations**
- Each player controls **both** Scion and Faction (combined sheet)

### The Three Timescales

1. **Scene:** Immediate action, conflicts, exploration
   - Scion stress clears between scenes
   
2. **Session/Arc:** Multi-scene storylines, faction operations
   - Faction People track clears between scenes
   
3. **Generation:** 20-ish year spans, succession of leadership
   - Consequences clear (after treatment)
   - Skills advance
   - Colony grows
   - Named characters like Scions age and may retire or even die of old age.

### The Three Sheets

#### 1. Faction-Scion (Player Character)
A **combined sheet** representing both the Scion (individual) and their Faction (organization).

**Scion Side:**
- 6 Skills (Influence, Combat, Academics, Engineering, Exploration, Deception)
- 3-5 stress boxes
- Age track (5 stages: Youthful → Ancient)
- Becomes more skilled but more fragile with age

**Faction Side:**
- 6 Capabilities (Military, Industrial, Technology, Culture, Mobility, People)
- People track (commitment-based resource + stress)
- 3 consequences (Minor/Moderate/Severe - generational recovery)
- Becomes more powerful over generations

**Philosophy:** The Scion is a specialized feature of the Faction, not a separate entity.

#### 2. Threat Front (GM Tool)
A **highly configurable sheet** that can represent anything threatening the colony:
- Rival factions (skills + capabilities)
- Environmental hazards (magnitude ratings)
- Alien swarms (hive capabilities)
- Ideological movements (influence + culture)
- Plagues (infection tracks + countdown)

**Key Features:**
- Dynamic show/hide for all features
- Two countdown ladders (2-10 stages each)
- 8 customizable skill slots
- 8 customizable capability slots
- Optional age track
- Multiple track types (stress, scale)
- Edit mode for configuration, Play mode for use

#### 3. Colony (Shared Resource)
Represents the **entire colony** as a collective entity including all player factions and some NPC factions.

**Features:**
- Population attribute (special, tied to track)
- Dynamic custom attributes (Power, Food, Water, Housing, etc.)
- Pyramid advancement (can't grow Population without supporting infrastructure)
- Consequences (generational recovery like Factions)

**Philosophy:** Colony growth is a group achievement requiring balanced development.

## Key Technical Details

### Fate Dice Display
This system uses a **custom invoke mechanic** that requires seeing individual die results:
- Must display: `[+] [-] [-] [blank]` not just total
- Uses Fate Core Official font for symbols
- Roll format: 4dF dice + skill modifier = result

### No Complex Roll Dialogs
The system intentionally avoids pop-up dialogs for rolls:
- Skills/Capabilities have click-to-roll buttons
- Complex combinations (Scion + Faction, Scale modifiers) calculated manually
- Keeps gameplay flowing without interruptions

### Validation Approach
- **Faction-Scion sheets:** Enforce counts of skills, capabilities, and refresh vs stunts.
- **Colony sheets:** Enforce pyramid rules for attributes
- **Threat sheets:** No validation - fully freeform for GM flexibility

### Edit vs Play Modes
Threat sheets have two distinct modes:
- **Edit Mode:** Configure which elements are visible, set parameters
- **Play Mode:** Clean view showing only enabled elements

---

## Custom Mechanics Reference

### Invokes (Non-Standard!)
**Standard Fate:** Invoke aspect for +2 or reroll  
**Scions of FarStar:** Invoke aspect to fix one die result
- Change `-` to `blank` or `+`
- Change `blank` to `+`
- Hostile invokes in reverse, making rolls worse.
- Each die can only be invoked once.
- Prevents stacking multiple +2s for alpha-strike attacks

### Age Track
Replaces consequences for Scions. 5 stages, each with three states:
- **Passed:** Crossed off when advancing to next age (skill +1)
- **Wound:** Marked to absorb 1 stress (gives enemies free invoke)
- **Scar:** Permanent mark (no free invoke, but track box is used, clears other wounds)

**Progression:** Youthful → Seasoned → Older → Geriatric → Ancient
- Scion starting age is determined by the player.

### People Track
Faction resource that serves dual purpose:
- **Resource:** Can be committed to multiple tasks (splitting forces)
- **Stress:** Only committed boxes vulnerable during engagement
- **Recovery:** Clears between scenes (casualties regroup/heal/resupply)

### Consequences (Faction/Colony)
Different recovery timing than standard Fate:

**Minor (2):**
- Treatment: Overcome vs difficulty 2
- Recovery: Clears end of scene it was treated. May be treated between scenes.

**Moderate (4):**
- Treatment: Overcome vs difficulty 4, rename consequence
- Recovery: Lasts through current generation after treatment

**Severe (6):**
- Treatment: Overcome vs difficulty 6, rename consequence
- Recovery: Lasts through NEXT generation after treatment (multigenerational scar)

### Countdown Ladders (Threats)
Threats use **ladders instead of clocks** - each stage is a named aspect:
```
[ ] Stage 5: Colony Under Siege (End State)
[ ] Stage 4: Scouts Probing Defenses
[ ] Stage 3: Swarm Detected on Sensors
[✓] Stage 2: Strange Seismic Activity
[✓] Stage 1: Livestock Acting Nervous
```
Each stage becomes a situation aspect when reached.

---

## Contributing

This is a private home game system, but if you find it useful:

---

## License

This is a personal project for private use. Foundry VTT and Fate are properties of their respective owners.

**Fate Core** is licensed under Creative Commons Attribution 3.0 Unported (CC BY 3.0)  
**Foundry VTT** is © Foundry Gaming LLC
**The Fate Core Font** is © Evil Hat Productions, LLC and is used with permission. The Four Actions icons were designed by Jeremy Keller.

This system implementation is provided as-is for personal use.

**Read `DESIGN.md` for complete specifications and implementation details.**