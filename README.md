# Scions of FarStar - Foundry VTT System

A custom Foundry VTT game system for **Scions of FarStar**, a multigenerational sci-fi colony-building RPG using heavily modified Fate mechanics.

**This is a personal project for a private home game. It is not intended for public distribution or support.**

---

## What is Scions of FarStar?

**Scions of FarStar** is a tabletop RPG about building a colony on a distant world across multiple generations. Players control both individual leaders (Scions) and their organizations (Factions) as they face threats, explore alien landscapes, and shape the future of humanity's newest home.

### Core Themes
- **Generational Play:** Characters age, gain experience, and eventually pass leadership to successors
- **Dual Management:** Each player controls both a Scion (individual hero) and their Faction (organization/tribe/corporation)
- **Colony Building:** Players collectively manage a shared colony that grows over time
- **Long-Term Consequences:** Decisions echo through generations

### What Makes This Different From Standard Fate?

This system uses heavily customized Fate mechanics:
- **Custom Invoke Mechanic:** Fix individual die results instead of +2 bonuses
- **Age Tracks:** Scions become more skilled but more fragile as they age
- **Generational Advancement:** Both Scions and Factions grow stronger over time
- **Combined Character Sheets:** One sheet for both the Scion and their Faction
- **Dynamic Threats:** Highly configurable threat sheets for everything from rival factions to alien plagues
- **Colony Management:** Shared colony sheet with attribute damage system

---

## Project Status

✅ **PHASE 4 COMPLETE - IN ACTIVE GAMEPLAY**

**Current System Version:** 1.11.2
**Target Foundry Version:** v13 build 351

This system is feature-complete for active gameplay. Future updates will be driven by actual play experience.

**Built with AI assistance.**

---

## 📖 READ FIRST: `DESIGN.md`

**Before making any changes or working with this system, read the [`DESIGN.md`](DESIGN.md) file.**

It contains:
- Complete specifications for all actor types (Faction-Scion, Threat, Colony, Registrar, Simple Aspect)
- All item types (Named NPCs, Stunts, Extras)
- Custom mechanics explanations (invokes, age tracks, people track, etc.)
- Data structure definitions
- Technical requirements and implementation details
- Token bar and trauma system documentation
- Third-party module integration guide
- Complete implementation status

---

## Repository Structure

```
/
├── README.md           # This file - project overview
├── DESIGN.md          # Comprehensive design document (READ THIS FIRST)
├── system.json        # Foundry system manifest
├── template.json      # Actor/Item data structures
├── module/            # JavaScript modules (.mjs)
├── styles/            # CSS stylesheets
├── templates/         # Handlebars templates for sheets
├── lang/              # Localization files
├── assets/            # Images, fonts, icons
└── packs/             # Compendium packs (example stunts, templates, macros)
```

---

## Key Features

### Three Actor Types
1. **Faction-Scion:** Combined player character sheet (Scion + Faction on one sheet)
2. **Threat:** Highly configurable GM tool with modular sections
3. **Colony:** Shared resource sheet with attribute damage system
4. **Registrar:** Organizational tool for archiving Named NPCs
5. **Simple Aspect:** Token-based scene aspects for Fate gameplay

### Item System
- **Named NPCs:** Minor characters with age tracking and VIP cross-faction system
- **Structured Stunts:** 5 types with macro support
- **Extras:** 5 types for flexible mechanics (aspects, ladders, skills, tracks)

### Technical Highlights
- Custom `/Fate` chat command for dice rolls
- Individual die display for invoke mechanic
- Drag-to-macro-bar functionality
- Read-only calculated trauma bars for tokens
- Share-to-chat features for transparency
- Localization support
- No hard dependencies on third-party modules

---

## For Developers (Including AI Assistants)

### Key Design Principles

1. **No Hard Dependencies:** System works without any third-party modules (though several are recommended for enhanced experience)

2. **Flexibility Over Automation:** Focus on tracking and organization, manual calculation for complex rolls

3. **Custom Fate Mechanics:** Invokes fix dice instead of +2, age tracks replace consequences for Scions, generational advancement

4. **Validation Where Needed:** Faction-Scion and Colony sheets validate, Threat sheets are freeform for GM flexibility

5. **Module Independence:** If recommended modules vanish, gameplay continues unaffected

### Recommended Modules (All Optional)
- **Lancer Initiative:** Popcorn/elective action order initiative
- **Party Resources:** GM Fate Points tracking
- **Dice So Nice:** 3D dice animations (graceful degradation)
- **PopOut!:** Multi-window sheet support

---

## License

This is a personal project for private use. Foundry VTT and Fate are properties of their respective owners.

**Fate Core** is licensed under Creative Commons Attribution 3.0 Unported (CC BY 3.0)
**Foundry VTT** is © Foundry Gaming LLC
**The Fate Core Font** is © Evil Hat Productions, LLC and is used with permission. The Four Actions icons were designed by Jeremy Keller.

This system implementation is provided as-is for personal use.

---

**For complete specifications and implementation details, read [`DESIGN.md`](DESIGN.md).**
