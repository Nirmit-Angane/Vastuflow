# ████████████████████████████████████████████████████████
# ANTIGRAVITY — AUTONOMOUS PRODUCT BUILDER v4.1
# PROJECT: VastuFlow — Smart Vastu Analysis Tool
# SaaS-Grade Client-Side MVP
# 3-Layer: Directive → Orchestration → Execution
# Enforced via AGENT.md · CLAUDE.md · GEMINI.md
# ████████████████████████████████████████████████████████

---

> **Core Law (from AGENT.md):**
> LLMs are probabilistic. Business logic, UI systems, and automation pipelines must be deterministic.
> VastuFlow's geometry engine, zone mapping, and rule scoring are deterministic L3 execution.
> You must never collapse these layers.

---

## ⚡ BOOT SEQUENCE — EXECUTE BEFORE ANYTHING ELSE

```python
# Step 1: Load persistent state
python3 state_manager.py status

# Step 2: Resume if phase != "idle". Never restart mid-flight.

# Step 3: Verify all required files exist
ls AGENT.md
ls PROMPT.md
ls SKILLS/brand-guidelines/SKILL_Brand-guideline.md
ls SKILLS/frontend-design/SKILL_Frontend-design.md
ls SKILLS/skill-creator/SKILL_Skill-creator.md
ls directives/vastuflow-product.md
ls execution/
```

**Required architecture confirmation (every session):**
```
Layer 1 (directives/vastuflow-product.md) — VastuFlow SOP loaded.
Layer 2 (orchestration) — Active. Routing, gating, state management engaged.
Layer 3 (execution/) — Geometry Engine · Vastu Rule Engine · Zone Mapper · Report Generator ready.
Phase: {current_phase}
Skills confirmed: SKILL_Brand-guideline ✓ | SKILL_Frontend-design ✓ | SKILL_Skill-creator ✓
```

> **Missing AGENT.md?** Regenerate exactly. Confirm all 3 layers before proceeding.
> **Missing any skill?** Use `SKILL_Skill-creator` to generate it. Skills are not optional.

---

## LAYER DEFINITIONS (from AGENT.md — enforced)

| Layer | Role | VastuFlow Scope | Inviolable Rule |
|---|---|---|---|
| L1 — Directive | SOPs, product rules, Vastu logic schemas | `directives/vastuflow-product.md` | Never overwritten without permission |
| L2 — Orchestration | YOU. Route. Gate. Prevent duplication. | This prompt | Never skip phase gates |
| L3 — Execution | Geometry math, zone logic, rule scoring, PDF export | `execution/` | No AI reasoning. Pure deterministic logic. |

**VastuFlow rule: All Vastu rule weights, zone scoring, and centroid mathematics live in L3 only. Never in components. Never in L2.**

---

## ⚙ OPERATING PRINCIPLES (from AGENT.md — enforced)

### 1. Tool-Check-First
Before creating any module: inspect `execution/`. Reuse. Extend. Never duplicate geometry logic.

### 2. State-Gated Workflow
Phases: `exploration → preview → approval → implementation → optimization → complete`
You may NOT jump phases. State discipline is mandatory.

### 3. Self-Anneal on Errors
```python
from state_manager import record_error, record_learning
record_error(error="[exact text]", layer="layer_1|2|3", fix_applied="[specific change]")
record_learning("[rule to prevent recurrence]")
```

### 4. Performance Protection (Critical for Canvas)
- Never re-render the entire Konva canvas on state updates
- Use `requestAnimationFrame` for heavy redraws
- Memoize all geometry calculations
- Separate canvas logic from React UI state
- Lighthouse Performance ≥ 90 on landing · Canvas tools must run at 60fps

### 5. No Backend — Ever (MVP Law)
No login. No cloud saving. No database. No Python. Fully client-side.
All state in React. Exportable as `project.vastu.json`.

---

## PRODUCT IDENTITY — LOCKED

```yaml
Product Name:       VastuFlow
Product Type:       Browser-Based SaaS Tool (Client-Side MVP)
Core Problem:       Vastu consultants manually analyze floor plans with rulers and grids —
                    slow, error-prone, and unprofessional in output.
Target Audience:    Vastu consultants and architects in India · Professional practitioners ·
                    Mid-career, detail-oriented, trust precision over speed ·
                    Use tools like AutoCAD references but need something simpler
Emotional Words:    Precise · Sacred · Professional
Visual Metaphor:    A brass compass on handmade paper — ancient geometry meeting
                    modern precision instruments
Tech Stack:         Next.js 14 (App Router) · TypeScript · TailwindCSS ·
                    Konva.js (canvas) · jsPDF or React-PDF · Vercel
No Backend:         True — all state in React, export via JSON + PDF
```

**State it immediately:**
```python
from state_manager import set_product, transition
set_product(
    name="VastuFlow",
    product_type="Browser-Based Tool",
    core_problem="Vastu consultants manually analyze floor plans — slow, error-prone, unprofessional output",
    target_audience="Vastu consultants and architects, professional practitioners",
    emotional_words=["Precise", "Sacred", "Professional"]
)
transition("exploration")
```

---

## TECH STACK — NON-NEGOTIABLE

```
Frontend:      Next.js 14 (App Router) · TypeScript · TailwindCSS
Canvas:        Konva.js — Layer system (Background · Trace · Centroid · Chakra · Zones · Labels · UI)
PDF Export:    jsPDF or React-PDF (evaluate at implementation — choose lighter bundle)
Fonts:         next/font/google ONLY — never @import in CSS
Images:        next/image ONLY — never <img>
Icons:         Inline SVG components ONLY
Animation:     Framer Motion · LazyMotion + domAnimation (never domMax)
State:         React state (client-side only) · Downloadable project.vastu.json
Deployment:    Vercel
Backend:       NONE — MVP law. No Supabase until Phase 2.
```

---

## PHASE 1 — DESIGN EXPLORATION

**State gate:** Must be in `exploration`. Verify: `python3 state_manager.py status`

---

### 1.1 — POSITIONING BRIEF
*Governed by: `SKILL_Brand-guideline`*

**1. Problem Reframe**
"I'm tracing this plan by hand again. My client is waiting. My calculations might be off by 2 degrees and I won't know until I present."

**2. Solution Feeling**
Upload. Trace. Trust the math. Hand the client a printed report that looks like it came from a ₹50,000 consultation.

**3. Audience Psychology Profile**
- Decision style: precision-driven · trust evidence over aesthetics · wary of "tech for tech's sake"
- Core anxieties: Will this be accurate enough to stake my reputation on? Will clients respect the output?
- Trust signals: geometric precision in the UI · classical Vastu terminology used correctly · a report that looks authoritative
- Aesthetic vocabulary: brands they trust — ISRO-grade instruments, temple architecture, premium stationery, traditional Indian textile geometry

**4. Competitive Differentiation**
- Manual analysis (ruler + compass): more trusted but slow, error-prone, no professional PDF output
- AutoCAD plugins: too complex, expensive, not Vastu-specific
- Generic floor plan apps: zero Vastu intelligence, no Brahm Bindu, no Shakti Chakra

VastuFlow wins on: precision + professional output + zero learning curve.

**5. Visual Metaphor**
A brass compass on handmade paper. Ancient geometry meeting modern precision instruments.
Every design decision runs through this test: "Does this feel like a precision instrument that respects tradition?"

**6. Emotional Word Expansion**

| Dimension | Precise | Sacred | Professional |
|---|---|---|---|
| Color temperature | Cool — instrument grey, stone white | Warm — saffron, turmeric gold, terracotta | Neutral — muted earth, parchment |
| Typographic weight | Light to medium — structured, no flourish | Serif with classical geometry | Medium weight sans — legible at all scales |
| Motion style | Crisp, snap-to-grid, mechanical | Slow ceremonial reveals | Controlled, purposeful transitions |
| Layout density | Dense information grid, cockpit-style | Open breathing space around ritual elements | Balanced — tool panel density + canvas spaciousness |

→ Dominant direction: **Precision-instrument meets classical Indian geometry.** Earth tones as base. Gold accent for sacred markers (centroid, chakra). Stone white canvas. Tool panels in structured dark-earth grey. Typography: classical serif display for headers, geometric sans for data.

**7. 10-Second Value Test**
"Upload your floor plan. Get a certified Vastu report in minutes." (9 words)

---

### 1.2 — 4 DESIGN DIRECTIONS
*Governed by: `SKILL_Frontend-design` + `SKILL_Brand-guideline`*

Generate all 4 directions. Every field required.

```
Direction 1: "Brass Instrument"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR SYSTEM:
  base:            #F5F0E8  [warm parchment — the paper under the compass]
  surface:         #EDE6D6  [tool panel backgrounds — aged vellum]
  border:          #C8B89A  [engraved instrument lines]
  text-primary:    #1C1610  [deep ink on paper]
  text-secondary:  #6B5B45  [secondary annotations]
  accent-1:        #B8860B  [dark gold — brass instrument markings]
  accent-2:        #8B4513  [burnt sienna — directional markers]
  signal:          #D4A017  [bright gold — centroid / chakra highlight]

TYPOGRAPHY:
  Display: Cormorant Garamond — carries classical geometric dignity; used in surveying instruments
  Body:    DM Sans — crisp readability for data tables; modern precision without coldness
  Scale:   xs(0.75) sm(0.875) base(1) lg(1.125) xl(1.25) 2xl(1.5) 3xl(1.875) 4xl(2.25)

LAYOUT ARCHETYPE: Cockpit
  Grid: 3-panel — 280px tool left / flex canvas center / 320px analysis right
  Section sequence: Step indicator (top) → Tool panel (left) → Canvas (center) → Live analysis (right)
  Hero composition: Canvas dominates center. Tool panel is instrument-dense. Analysis panel breathes.
  Negative space: Controlled — canvas has generous margin; panels are dense
  Breakpoints: Mobile collapses to stacked single column (canvas first)

INTERACTION PHILOSOPHY: Mechanical
  Duration range: 120ms–300ms
  Primary easing: cubic-bezier(0.4, 0, 0.2, 1)
  Hero entrance: Step indicator slides in top → panels slide in from sides → canvas fades up
  Hover behavior: Button — border brightens to gold · Tool — scale(1.02) + gold border
  Reduced motion: Instant transitions, no motion

DEPTH SYSTEM:
  Shadows: Subtle engraved — inset shadows on panels, drop shadow on canvas frame
  Layering: Flat with z-depth on modal overlays only
  Texture: Fine grain noise overlay (opacity 0.04) on parchment base
  Background: Warm parchment gradient (base → surface, 145deg)

VISUAL METAPHOR FIT: Brass instrument on parchment expressed in every token — warm paper base, gold markings, engraved borders
EMOTIONAL FIT: Precise (mechanical timing, structured grid), Sacred (gold centroid highlight, classical typography), Professional (cockpit layout, authoritative report output)
AUDIENCE FIT: Matches the instrument-grade trust signals consultants need; echoes surveying and temple geometry
BORDER RADIUS: 2px — instrument-grade edges, not digital softness
ANTI-PATTERN ESCAPED: No card-with-purple-gradient. No rounded-2xl bubble UI. No "startup aesthetic."

COPY:
  Headline:        "Analyze Vastu with Instrument Precision"
  Sub-headline:    "Upload your floor plan. Trace the boundary. Get a certified zone analysis and professional PDF report — in minutes."
  Primary CTA:     "Upload Floor Plan"
  Secondary CTA:   "See Sample Report"

UNFORGETTABLE ELEMENT: The golden Brahm Bindu marker pulsing once on centroid calculation — sacred geometry made visible

---

Direction 2: "Temple Stone"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR SYSTEM:
  base:            #F7F3EE  [white marble with warmth]
  surface:         #EDEBE5  [stone panel]
  border:          #D4C9B8  [carved limestone edge]
  text-primary:    #1A1510  [charcoal ink]
  text-secondary:  #7A6E62  [faded inscription]
  accent-1:        #C17F24  [temple gold]
  accent-2:        #A0522D  [terracotta — directional zones]
  signal:          #E8A020  [lit diya gold — active states]

TYPOGRAPHY:
  Display: Playfair Display — classical Indian luxury; seen in premium Vastu books
  Body:    Source Sans 3 — neutral, legible data carrier

LAYOUT ARCHETYPE: Editorial
  Grid: Content-first with sidebar. 320px left tool panel / canvas center / collapsible right
  Section sequence: Prominent step journey bar (top) → Working canvas (70% width) → Compact analysis sidebar
  Hero composition: Step indicator acts as ceremonial progression — large, prominent. Canvas is the altar.
  Negative space: Generous — temple-like breathing room around key sacred elements

INTERACTION PHILOSOPHY: Fluid
  Duration range: 200ms–500ms
  Primary easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
  Hero entrance: Step bar reveals with stagger → canvas rises → sidebar slides
  Hover behavior: Warm gold glow on tool hover · sacred element highlight on chakra interaction
  Reduced motion: Fade-only transitions

...

Direction 3: "Midnight Survey"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR SYSTEM:
  base:            #0F0E0C  [near-black — drafting table at night]
  surface:         #1A1915  [dark panel surface]
  border:          #2E2B24  [subtle separation]
  text-primary:    #F0EAD6  [parchment on black — warm white]
  text-secondary:  #9E9580  [muted annotation]
  accent-1:        #D4A017  [gold compass needle]
  accent-2:        #8B6914  [deep gold secondary]
  signal:          #FFD700  [pure gold — centroid / active zone highlight]

TYPOGRAPHY:
  Display: Cinzel — Roman-geometric authority; used in astronomical and navigational instruments
  Body:    IBM Plex Mono — technical precision; readings and measurements feel scientific

LAYOUT ARCHETYPE: Cockpit (Dark)
  Grid: 260px left / flex canvas / 300px right — tight information architecture
  Section sequence: Dark top bar (step + project name) → Dense tools left → Canvas center → Live readings right
  Hero composition: Canvas glows against dark — like a lit drafting table. Tool panels recede.
  Negative space: Dense. Every pixel earns its place. Professional dark-mode tool.

INTERACTION PHILOSOPHY: Crisp
  Duration range: 80ms–200ms
  Primary easing: cubic-bezier(0.4, 0, 0.6, 1)
  Hero entrance: Dark fade-in from black. Panels slide from edges. Instant-feel.
  Hover behavior: Gold border flash · tool active state glows
  Reduced motion: No animation

DEPTH SYSTEM:
  Shadows: Dramatic — gold glow on centroid · deep shadow on inactive panels
  Layering: Z-depth — canvas layer elevation system mirrors Konva layer stack
  Texture: Subtle geometric grid overlay on canvas background (1px lines, 3% opacity)
  Background: Near-black with faint warm gradient

ANTI-PATTERN ESCAPED: No dark-mode-as-afterthought. No blue-tinted generic dark UI. Dark gold is the identity.

...

Direction 4: "Saffron Manuscript"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR SYSTEM:
  base:            #FBF6EE  [manuscript cream]
  surface:         #F5EDD8  [aged paper]
  border:          #DBC99A  [ink border]
  text-primary:    #1A0F05  [deep manuscript ink]
  text-secondary:  #7D6040  [faded annotation]
  accent-1:        #D4601A  [saffron-terracotta — primary direction markers]
  accent-2:        #8B6914  [ochre — secondary markers]
  signal:          #E8850A  [saffron bright — active / signal]

TYPOGRAPHY:
  Display: Yeseva One — warm serif with Indian editorial dignity
  Body:    Nunito Sans — soft legibility for Vastu terms and data

LAYOUT ARCHETYPE: Asymmetric
  Grid: Variable — step indicator centered top, tool drawer slides in from left,
        canvas fills, analysis appears below canvas on interaction
  Hero composition: Step journey is the primary navigation metaphor — a scroll being unrolled

INTERACTION PHILOSOPHY: Organic
  Duration range: 300ms–700ms
  Primary easing: cubic-bezier(0.34, 1.56, 0.64, 1) — slight spring
  Hero entrance: Title unfolds like a manuscript · steps reveal with stagger
  Hover behavior: Warm saffron wash on tool items

ANTI-PATTERN ESCAPED: Not "Indian-themed = orange everything." Restrained saffron as accent, not theme.
```

**After all 4 directions:**
```python
from state_manager import add_design_direction, transition
add_design_direction({ ...direction_1_dict... })
add_design_direction({ ...direction_2_dict... })
add_design_direction({ ...direction_3_dict... })
add_design_direction({ ...direction_4_dict... })
transition("preview")
```

---

## ████ NANO BANANA — VISUAL PREVIEW GENERATION ████

**Mandatory before selection. Do not skip.**
*Governed by: SKILL_Frontend-design · AGENT.md Visual Generation Governance*

Generate **4 high-fidelity hero preview frames** — one per direction.

**Each frame renders the VastuFlow main workspace above-the-fold:**

```
RENDER SPEC:
  Format:      Single self-contained HTML file
  Dimensions:  1440×900px
  Content:     The 3-panel tool workspace — not a landing page
               Show the WORKING APP STATE, not marketing

EACH FRAME MUST INCLUDE:
  ✓ Exact color tokens (hex-accurate, no approximation)
  ✓ Font pairing loaded via Google Fonts embed
  ✓ Left tool panel: upload button + rotate/crop/scale tools listed
  ✓ Center canvas: floor plan outline (abstract polygon) + Brahm Bindu marker
  ✓ Shakti Chakra overlay (16-sector radial grid, centered on bindu)
  ✓ Right analysis panel: zone table preview with score chips
  ✓ Top step indicator: 10 steps, current step highlighted
  ✓ Canvas layer toggle controls (eye icons per layer)
  ✓ Direction name + number labeled in corner
  ✓ "Download PDF Report" button visible

MUST NOT INCLUDE:
  ✗ Lorem ipsum anywhere
  ✗ Placeholder color boxes — implement the actual color system
  ✗ Random geometric shapes — use a recognizable floor plan outline
  ✗ Pure #FFFFFF or #000000
  ✗ Tokens bleeding between direction frames

VASTUFLOW-SPECIFIC CANVAS ELEMENTS:
  → Brahm Bindu: pulsing gold dot at centroid
  → Shakti Chakra: 16-sector SVG radial overlay, semi-transparent
  → 16 Zone labels: NE · N · NNE · etc. shown on outer ring
  → Trace polygon: clean perimeter outline of floor plan
  → Scale marker: measurement line on canvas edge
```

**Generate:**
```
execution/mockups/
  vastuflow-preview-1-brass-instrument.html
  vastuflow-preview-2-temple-stone.html
  vastuflow-preview-3-midnight-survey.html
  vastuflow-preview-4-saffron-manuscript.html
```

```python
record_learning("Nano Banana: 4 VastuFlow workspace previews generated. Directions 1–4 at 1440×900.")
```

**Present all 4. Label clearly. Await selection. Do not proceed to Phase 2 without it.**

---

## PHASE 2 — APPROVAL GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4 VastuFlow workspace directions generated.
4 Nano Banana visual previews rendered above.

Select direction → 1 / 2 / 3 / 4
Or provide reference → URL / screenshot / Figma / hex codes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```python
from state_manager import approve_direction
approve_direction(N, source="generated")
```

---

## PHASE 3 — IMPLEMENTATION

**State gate:** Must be `approved` or `implementation`.
```python
transition("implementation")
```

**Build order strictly sequential. Check `execution/` before creating anything.**

---

### 3.1 — DESIGN SYSTEM FOUNDATION
*Governed by: `SKILL_Frontend-design`*

```
execution/config/
  tokens.css           → All 8 color tokens · type scale · spacing (4px base) ·
                          border-radius tokens · shadow tokens · motion tokens ·
                          Konva canvas theme variables
  tailwind.config.ts   → theme.extend mapping all tokens. Zero hardcoded values in components.
  fonts.ts             → next/font/google: display + body, subsets, display:swap
```

---

### 3.2 — CANVAS LAYER SYSTEM (Konva.js)
*L3 Execution — deterministic, no AI reasoning*

```
execution/canvas/
  CanvasEngine.ts      → Konva Stage initialization · layer management · zoom/pan
  layers/
    BackgroundLayer.ts → Floor plan image · lock aspect ratio · default zoom
    TraceLayer.ts      → Polygon tracing · click-to-add points · close polygon
    CentroidLayer.ts   → Brahm Bindu marker · pulse animation · draggable override
    ChakraLayer.ts     → Shakti Chakra SVG overlay · 16 sectors · snap rotation
    ZoneLayer.ts       → 16 zone fills · color-coded by score · toggleable labels
    LabelLayer.ts      → Zone names · area values · directional text
    UIControlLayer.ts  → Layer toggle eye icons · canvas-bound controls
  canvasUtils.ts       → requestAnimationFrame manager · memoized render helpers
```

**Canvas rules:**
- Each Konva layer is independently toggleable (from SOP §6)
- Never re-render all layers on single state update
- `requestAnimationFrame` for all heavy redraws
- Canvas logic is L3 — zero React state entanglement

---

### 3.3 — GEOMETRY ENGINE
*L3 Execution — deterministic mathematics only*

```
execution/geometry/
  polygon.ts           → Shoelace formula (area) · centroid calculation · validation
  scale.ts             → pixel_to_meter_ratio calculation · two-point scale tool
  chakra.ts            → 16-sector generator centered on centroid · rotation math
  zoneMapper.ts        → Zone boundary calculation · area overlap detection
  intersectionGuard.ts → Self-intersecting polygon detection · error throwing

Output schemas (exactly as SOP §5):
  Scale:    { "pixel_to_meter_ratio": number }
  Centroid: { "centroid": { "x": number, "y": number } }
  Polygon:  Array<{ "x": number, "y": number }>
  Zone:     { zone_id: string, score: number, status: string, issues: string[] }
```

**Geometry rules:**
- All math is pure TypeScript functions — no React, no side effects
- Every function is independently unit-testable
- Throws typed errors on: invalid scale · self-intersecting polygon · too few points · zero area
- No AI reasoning — deterministic output for same input always

---

### 3.4 — VASTU RULE ENGINE
*L3 Execution — deterministic rule scoring*

```
execution/rules/
  ruleSchema.ts        → Rule type definition:
                          { zone, allowed[], restricted[], weight, remedies[] }
  vastu16Rules.ts      → All 16 zone rule sets (complete Vastu rule database)
  scorer.ts            → Zone scoring: +weight (allowed) / -weight (restricted) / 0 (neutral)
                          Final house score = weighted average
  remedyEngine.ts      → Maps score deviations to classical Vastu remedies
```

**Rule schema (from SOP §9):**
```typescript
interface VastuRule {
  zone: string
  allowed: string[]
  restricted: string[]
  weight: number        // 1–10, 10 = critical zone
  remedies: string[]    // Classical remedy text for deviations
}
```

**Scoring:**
- Positive placement → `+weight`
- Negative placement → `-weight`
- Neutral → `0`
- Final score: weighted average across all 16 zones

---

### 3.5 — COMPONENT ARCHITECTURE
*Governed by: `SKILL_Frontend-design`*

```
execution/components/
  primitives/
    Button.tsx           → 4 variants × 3 sizes · 5 states
    Input.tsx            → Label · error · helper
    Badge.tsx            → Zone status chips: Good / Warning / Critical
    Icon.tsx             → Inline SVG only
    ScoreRing.tsx        → Circular score display (SVG arc)
    DirectionBadge.tsx   → N/NE/E etc. directional indicators

  tool-panels/
    UploadPanel.tsx      → File upload (JPG/PNG/PDF) · format validation
    RotateAlignPanel.tsx → Slider (0.1° precision) · snap-to-90° button · North alignment
    CropPanel.tsx        → Working area selector
    ScalePanel.tsx       → Two-point picker · distance input · ratio display
    TracePanel.tsx       → Point count · polygon close · undo last point
    CentroidPanel.tsx    → Brahm Bindu coordinates · recalculate button
    ChakraPanel.tsx      → Rotation input · snap toggle · sector count display
    ZonePanel.tsx        → 16-zone room assignment dropdowns
    AnalysisPanel.tsx    → Live zone table · score per zone · status chips
    ReportPanel.tsx      → Final score ring · download PDF · download JSON

  canvas/
    KonvaStage.tsx       → Konva Stage wrapper · layer toggle controls
    LayerToggle.tsx      → Eye icon per layer · active state

  report/
    ReportPreview.tsx    → Pre-render report sections (props-driven)
    ZoneTable.tsx        → 16-row table: zone · score · status · issues
    RemedyList.tsx       → Deviation remedies · formatted for PDF

  layouts/
    WorkspaceLayout.tsx  → 3-panel: left tool / center canvas / right analysis
    StepIndicator.tsx    → 10-step progress (SOP §5 steps) · current step highlight
```

---

### 3.6 — WORKFLOW STEPS (SOP §5 — Exact Implementation)

Each step is a gated state transition:

```typescript
type WorkflowStep =
  | "upload"        // Step 1: Upload JPG/PNG/PDF
  | "rotate"        // Step 2: Rotate & align to North
  | "crop"          // Step 3: Crop working area
  | "scale"         // Step 4: Set pixel-to-meter scale
  | "trace"         // Step 5: Trace perimeter polygon
  | "centroid"      // Step 6: Calculate Brahm Bindu
  | "chakra"        // Step 7: Generate Shakti Chakra
  | "zones"         // Step 8: Mark room placements
  | "analysis"      // Step 9: Rule engine scoring
  | "report"        // Step 10: Generate & download report
```

**Step gate rules:**
- User cannot proceed to next step until current step validation passes
- Error handling per step (from SOP §9):
  - Invalid scale input → block Step 4 completion
  - Self-intersecting polygon → block Step 5 completion, show fix guidance
  - Too few trace points (< 3) → block Step 5
  - Zero area detected → block Step 6
  - Rotation overflow → clamp to 0–360°

---

### 3.7 — REPORT GENERATOR
*L3 Execution: deterministic PDF output*

```
execution/report/
  reportBuilder.ts     → Assembles all report sections from analysis state
  pdfExporter.ts       → jsPDF or React-PDF (evaluate bundle size at implementation)
  jsonExporter.ts      → project.vastu.json export (full state snapshot)

Report sections (from SOP §5 Step 10):
  1. Project Overview (address, date, consultant)
  2. House Shape Analysis (polygon, area, orientation)
  3. Brahm Bindu Location (centroid coordinates, deviation if any)
  4. 16 Zone Table (zone · room · score · status · issues)
  5. Deviations Summary (zones below threshold)
  6. Remedies (per deviation, classical Vastu text)
  7. Final Score (weighted average with ring graphic)
  8. Disclaimer (standard Vastu advisory disclaimer)
```

---

### 3.8 — ERROR HANDLING (SOP §9 — Complete Implementation)

```
execution/errors/
  VastuError.ts        → Typed error classes per error domain
  ErrorBoundary.tsx    → React error boundary with recovery UI
  validators.ts        → All validation functions, pure and testable

Errors handled:
  INVALID_SCALE          → "Please enter a valid positive distance"
  SELF_INTERSECTING      → "Polygon edges overlap — click to auto-fix or retrace"
  TOO_FEW_POINTS         → "Add at least 3 points to close the polygon"
  ROTATION_OVERFLOW      → Clamp silently, no error shown
  ZERO_AREA              → "Polygon area is zero — check your trace"
  INVALID_FILE_TYPE      → "Upload JPG, PNG, or PDF only"
  PDF_FILE_TOO_LARGE     → "File exceeds 10MB — resize and try again"
```

---

### 3.9 — PAGE ASSEMBLY

```
app/
  layout.tsx           → Fonts · metadata · OG image · LazyMotion wrapper
  page.tsx             → Landing page:
                          Hero → Value prop → How it works (3 steps) →
                          Sample report preview → "Start Analysis" CTA
  workspace/page.tsx   → Full 3-panel workspace (the tool itself)
  demo/page.tsx        → Pre-loaded sample project:
                          "Sharma Residence, Mumbai" · realistic zone scores ·
                          pre-traced polygon · all 10 steps completed ·
                          One-click reset
```

**Landing page is NOT the tool.** The tool lives at `/workspace`. Landing converts consultants.

---

### 3.10 — DIRECTIVE RECORD

```
directives/vastuflow-product.md     → SOP reference (from the project document)
directives/vastuflow-decisions.md   → Design decision log:
                                       Direction selected · token values ·
                                       Vastu rule weights · component prop schemas ·
                                       PDF library choice rationale · learnings
```

---

## PHASE 4 — CINEMATIC MODE

**Activation check for VastuFlow:**
- Consumer-facing landing page → YES (cinematic applicable)
- The workspace tool → NO (precision over drama)

**If activated (landing page hero only):**
```
execution/mockups/
  frame-start.html     → Empty canvas, waiting for upload
  frame-end.html       → Traced plan with glowing Brahm Bindu + Shakti Chakra visible
```

Continuity rules: Same gold token. Same canvas position. Same layout. Only canvas content changes.

---

## FILE ORGANIZATION

```
VastuFlow/
├── AGENT.md                          → Canonical 3-layer architecture
├── PROMPT.md                         → This document
│
├── SKILLS/
│   ├── brand-guidelines/SKILL_Brand-guideline.md
│   ├── frontend-design/SKILL_Frontend-design.md
│   └── skill-creator/SKILL_Skill-creator.md
│
├── directives/
│   ├── vastuflow-product.md          → L1: VastuFlow SOP (source of truth)
│   └── vastuflow-decisions.md        → L1: Decision log
│
└── execution/                        → L3: All deterministic modules
    ├── config/
    │   ├── tokens.css
    │   ├── tailwind.config.ts
    │   └── fonts.ts
    ├── canvas/                       → Konva layer system
    ├── geometry/                     → Math engine
    ├── rules/                        → Vastu rule engine + scorer
    ├── components/                   → UI components
    ├── report/                       → PDF + JSON export
    ├── errors/                       → Error classes + validators
    └── mockups/                      → Nano Banana preview frames
```

---

## ANTI-PATTERNS TABLE — VASTUFLOW SPECIFIC

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Generic SaaS landing page aesthetic | Precision-instrument meets classical Indian geometry |
| Purple gradient anywhere | Earth tones · gold accent · parchment base |
| Inter / Roboto / Arial | Cormorant Garamond + DM Sans (or approved direction pair) |
| AI reasoning in geometry engine | Pure deterministic TypeScript math only |
| Vastu rules hardcoded in components | L3 `vastu16Rules.ts` only — no exceptions |
| State in canvas layer files | Canvas is L3, state is React — strict separation |
| `<img>` tags | `next/image` always |
| `@import` fonts in CSS | `next/font/google` always |
| Re-rendering all Konva layers on state change | Targeted layer updates only |
| Synchronous heavy canvas operations | `requestAnimationFrame` always |
| Generic PDF output | Branded professional report with score ring + zone table |
| "Get Started" CTA | "Upload Floor Plan" / "Analyze My Plan" / "Start Vastu Analysis" |
| Lorem ipsum in demo | "Sharma Residence, 3BHK, Andheri West, Mumbai" |
| Backend for MVP | Client-side only — React state + JSON export |
| Supabase in Phase 1 | Phase 2 only — MVP law |
| hardcoded Vastu rule weights | `vastu16Rules.ts` with typed schema — configurable |

---

## DEVELOPMENT ROADMAP (from SOP §12)

```
Week 1: Next.js setup · Konva integration · Image upload · Rotate tool
Week 2: Scale tool · Trace tool · Centroid (Shoelace formula)
Week 3: Shakti Chakra generation · 16 zone mapping
Week 4: Vastu rule engine · Report generation · PDF export
Week 5: UI polish · Error handling · Performance · Vercel deployment
```

---

## PRE-DEMO CHECKLIST

```
□ python3 state_manager.py status → phase: "optimization" or "complete"
□ /demo route loads in < 2 seconds (4G throttle)
□ Canvas renders at 60fps (no jank on polygon trace)
□ Brahm Bindu calculates correctly on sample polygon
□ Shakti Chakra snaps to 16 equal sectors
□ All 16 zones generate scores
□ PDF report downloads and renders correctly (not blank)
□ project.vastu.json exports and re-imports correctly
□ All 9 error cases handled (no unhandled exceptions)
□ Zero "undefined" / "null" / "NaN" visible in analysis panel
□ Layer toggle works for all 7 Konva layers
□ Font loaded correctly (no system font fallback)
□ Mobile: workspace degrades gracefully (canvas + collapsed panels)
□ No console errors in production build
□ Lighthouse Performance ≥ 90 on landing page
□ Disclaimer section present in every PDF export
□ Sample demo data: "Sharma Residence" with realistic scores
□ One-click demo reset confirmed (Cmd+Shift+R)
```

---

## SUCCESS CRITERIA

```
□ A Vastu consultant can complete full analysis (upload → PDF) in < 15 minutes first try
□ Brahm Bindu calculation matches manual Shoelace result (testable)
□ 16-zone scores reproducible — same input = same output always
□ PDF report looks professional enough to hand to a client
□ Zero backend dependencies — fully client-side
□ All 9 SOP error cases handled gracefully
□ Lighthouse ≥ 90 / CLS < 0.1 / LCP < 2.5s on landing
□ Canvas runs at 60fps during trace interaction
□ Design direction traceable to "Precise · Sacred · Professional" + brass compass metaphor
□ Nano Banana previews generated (all 4 workspace frames)
□ AGENT.md 3-layer separation intact throughout codebase
□ All Vastu rules in L3 only — never in components or UI
□ Week 5 delivery ready for Vercel deployment
```

---

## BEGIN — EXECUTE IN ORDER

```
1.   python3 state_manager.py status
2.   Confirm 3-layer architecture (one sentence per layer)
3.   Confirm AGENT.md + vastuflow-product.md exist
4.   Confirm all 3 skill files exist
5.   VastuFlow product is pre-loaded — confirm set_product() from above
6.   transition("exploration")
7.   Positioning brief is pre-defined above — confirm or refine
8.   Generate 4 design directions (all fields — no skipping)
9.   Generate 4 Nano Banana workspace preview frames
10.  STOP — present 4 directions + 4 previews — await selection
11.  approve_direction(N)
12.  transition("implementation")
13.  3.1 Design System → 3.2 Canvas Layers → 3.3 Geometry Engine →
     3.4 Rule Engine → 3.5 Components → 3.6 Workflow Steps →
     3.7 Report Generator → 3.8 Error Handling → 3.9 Pages → 3.10 Directives
14.  If landing page needs cinematic → Phase 4 (workspace tool does not)
15.  Run pre-demo checklist
16.  Confirm all success criteria
17.  vercel --prod
```

---

> **Precision over features.**
> **Accuracy over animation.**
> **Professional output over clever engineering.**
>
> *VastuFlow MVP — Week 5 ship target.*
> *Antigravity Product Builder v4.1 — Enforced by AGENT.md.*