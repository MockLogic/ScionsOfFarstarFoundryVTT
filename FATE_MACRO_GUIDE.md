# Fate Roll Macro Guide for Scions of FarStar

This guide explains how to use the enhanced `/fate` command system to create chat macros for your character's skills, capabilities, and stunts.

## Prerequisites

**Players must have an assigned character** in Foundry VTT's user settings to use skill-based `/fate` commands. The GM assigns characters to players through the user configuration.

## Basic Syntax Overview

The `/fate` command (or `/4df`) supports multiple syntax patterns:

### Simple Rolls

```
/fate                    # Basic 4dF roll with no modifier
/fate +2                 # Roll with a +2 modifier
/fate -1                 # Roll with a -1 penalty
/fate +2 Custom note     # Roll with modifier and a note
```

### Skill/Capability Rolls

```
/fate SkillName                                                                   # Roll using a skill/capability
/fate SkillName ActionType                                                        # Roll with an action type icon
/fate SkillName ActionType Stunt+2 [Name] <Description>                           # Roll with +2 stunt bonus
/fate SkillName ActionType Stunt-Swap OtherSkill [Name] <Description>             # Swap skills
/fate SkillName ActionType Stunt-Swap+2 OtherSkill [Name] <Description>           # Swap + bonus
```

**IMPORTANT:** When using `Stunt+2`, `Stunt-Swap`, or `Stunt-Swap+2`, you **MUST** include both:
- `[Stunt Name]` in square brackets
- `<Description>` in angle brackets

If either is missing, the command will be treated as a regular roll without stunt effects.

**Valid Skill Names** (Scion Skills):
- `Academics`
- `Combat`
- `Deception`
- `Engineering`
- `Exploration`
- `Influence`

**Valid Capability Names** (Faction Capabilities):
- `Culture`
- `Industrial`
- `Military`
- `Mobility`
- `Technology`
- `People`

**Valid Action Types** (displays Fate Core action icons):
- `Attack` (red icon)
- `Defend` (blue icon)
- `Overcome` (green icon)
- `Create` (orange icon) - for Create Advantage

## Example Macros for Players

### 1. Basic Skill Rolls

Create simple macros for each of your skills:

**Combat Roll**
```
/fate Combat
```

**Academics Roll**
```
/fate Academics
```

**Engineering Roll**
```
/fate Engineering
```

**Technology Capability Roll** (Faction)
```
/fate Technology
```

### 2. Action-Specific Rolls

Add action types to show the appropriate Fate icon:

**Combat Attack**
```
/fate Combat Attack
```

**Combat Defend**
```
/fate Combat Defend
```

**Deception Create Advantage**
```
/fate Deception Create
```

**Engineering Overcome**
```
/fate Engineering Overcome
```

**Military Attack** (Faction capability)
```
/fate Military Attack
```

### 3. Stunt Bonus Macros (+2)

If you have a stunt that provides a +2 bonus under certain circumstances:

**Example Stunt:** "Superior Training" gives +2 to Combat when Attacking with melee weapons

```
/fate Combat Attack Stunt+2 [Superior Training] <Applies when attacking with melee weapons>
```

**Example Stunt:** "Master Diplomat" gives +2 to Influence when Creating Advantages in formal settings

```
/fate Influence Create Stunt+2 [Master Diplomat] <Applies in formal diplomatic settings>
```

**What this displays:**
- The action icon (Attack/Defend/etc.)
- Your skill name and value
- "+2 stunt bonus" in the description
- The stunt name **[Superior Training]**
- A yellow-highlighted box showing when the stunt applies: **<Applies when attacking with melee weapons>**
- Total calculation: dice + skill + stunt bonus

**Note:** The description is displayed prominently to ensure everyone knows when the stunt should apply. If you omit the `[Name]` or `<Description>`, the stunt bonus will be removed and it will roll as a regular skill check.

### 4. Skill Swap Macros (Stunt-Swap)

If you have a stunt that lets you use one skill instead of another:

**Example Stunt:** "Smartgun Implant" lets you use Technology instead of Combat for Attacks with guns

```
/fate Combat Attack Stunt-Swap Technology [Smartgun Implant] <Applies when attacking with smartgun weapons>
```

**Example Stunt:** "Silver Tongue" lets you use Deception instead of Influence when Creating Advantages through lies

```
/fate Influence Create Stunt-Swap Deception [Silver Tongue] <Applies when creating advantages through deception>
```

**What this displays:**
- The action icon
- "Using Combat (+1) **[Smartgun Implant]** to roll Technology (+3) instead"
- A yellow-highlighted box with the circumstances: **<Applies when attacking with smartgun weapons>**
- Total calculation uses the swapped skill value

**Note:** Both `[Name]` and `<Description>` are required, or the swap won't work and you'll roll the original skill instead.

### 5. Combined Stunt Macros (Swap + Bonus)

If you have a two stunts that both swaps skills AND provides a +2 bonus in the same circimstance:

**Example:** "Smartgun Implant and Targeting Software" (swap Combat for Technology AND add +2)

```
/fate Combat Attack Stunt-Swap+2 Technology [Smartgun Implant and Targeting Software] <Applies when using my smartgun implant and targeting software with guns>
```

**What this displays:**
- The action icon
- "Using Combat (+1) **[Smartgun Implant and Targeting Software]** to roll Technology (+3) instead with +2 stunt bonus"
- A yellow-highlighted box showing: **<Applies when using my smartgun implant and targeting software with guns>**
- Total calculation: dice + swapped skill + 2

**Note:** Both `[Name]` and `<Description>` are required for the swap and bonus to work. The game limits stunt bonuses to +2 maximum per roll, even if multiple stunts apply.

## Creating Macros in Foundry VTT

### Hotbar Macros

1. Open the chat window
2. Type your desired `/fate` command
3. Drag the command from chat to your hotbar
4. Click the hotbar button to execute

### Macro Menu

1. Open the Macro Directory (top right toolbar)
2. Click "Create Macro"
3. Set Type: "Chat"
4. Enter your `/fate` command in the "Command" field
5. Give it a name and icon
6. Save and drag to hotbar

## Advanced Examples

### Complex Scenario Macro

A complete stunt roll with all elements:

```
/fate Combat Attack Stunt-Swap+2 Technology [Smartgun Implant and Targeting Software] <Applies when using my smartgun implant and targeting software with guns>
```

This would show:
- Attack icon (red A)
- Using Combat to roll Technology instead
- +2 stunt bonus
- Stunt name: **[Smartgun Implant and Targeting Software]**
- Yellow-highlighted circumstances box: **<Applies when using my smartgun implant and targeting software with guns>**
```

## Troubleshooting

**"You must have an assigned character"** error:
- Ask your GM to assign your character to your user account in Foundry's user settings

**Skill name not recognized**:
- Check spelling (case-insensitive but must match exactly)
- Verify the skill exists on your character sheet
- Scion skills: Academics, Combat, Deception, Engineering, Exploration, Influence
- Faction capabilities: Culture, Industrial, Military, Mobility, Technology, People

**Stunt bonus or swap not working**:
- **REQUIRED:** You must include both `[Stunt Name]` in square brackets AND `<Description>` in angle brackets
- If either is missing, the command treats it as a regular roll without stunt effects
- Make sure the replacement skill name (for swaps) is spelled correctly
- Both skills must exist on your character

## Speaker Names

- When using **Scion skills**, the chat message will show your Scion's name
- When using **Faction capabilities**, it will show your Faction's name
- The system automatically detects which is appropriate

## Tips for GMs

GMs can use `/fate` commands without an assigned character for simple rolls:

```
/fate +3       # Quick NPC roll
/fate -1       # Environmental penalty roll
```

For NPCs with skills, assign a temporary character or use threat/colony actors.

## Questions?

Refer to the Scions of FarStar system documentation or ask your GM for clarification on stunts and their mechanical effects.

---

**Note:** This enhanced `/fate` system respects your game's +2 stunt bonus cap and accurately displays Faction vs Scion attribution based on the skill/capability used.
