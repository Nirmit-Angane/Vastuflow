#!/usr/bin/env python3
"""
state_manager.py
Deterministic state machine for the product architecture agent.
All state transitions go through this script — never direct JSON edits.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

STATE_FILE = Path(__file__).parent / "state.json"

VALID_PHASES = [
    "idle",
    "exploration",   # Generating design directions
    "preview",       # Directions generated, awaiting selection
    "approved",      # Direction selected, awaiting implementation start
    "implementation",# Building the product
    "optimization",  # Post-build polish
    "complete",      # Delivered
]

VALID_TRANSITIONS = {
    "idle":           ["exploration"],
    "exploration":    ["preview"],
    "preview":        ["approved", "exploration"],  # Can go back if rejected
    "approved":       ["implementation"],
    "implementation": ["optimization"],
    "optimization":   ["complete"],
    "complete":       ["exploration"],  # Can restart for new product
}


def load() -> dict:
    """Load state from disk."""
    if not STATE_FILE.exists():
        print(f"ERROR: state.json not found at {STATE_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(STATE_FILE) as f:
        return json.load(f)


def save(state: dict) -> None:
    """Save state to disk with timestamp."""
    state["_updated"] = datetime.now(timezone.utc).isoformat()
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)
    print(f"✓ State saved: phase={state['phase']}, product={state['product_input']['name']}")


def transition(target_phase: str) -> dict:
    """Move to a new phase, enforcing valid transitions."""
    state = load()
    current = state["phase"]

    if target_phase not in VALID_TRANSITIONS.get(current, []):
        allowed = VALID_TRANSITIONS.get(current, [])
        print(f"ERROR: Cannot transition {current} → {target_phase}", file=sys.stderr)
        print(f"  Allowed transitions from '{current}': {allowed}", file=sys.stderr)
        sys.exit(1)

    state["phase_history"].append({
        "from": current,
        "to": target_phase,
        "at": datetime.now(timezone.utc).isoformat()
    })
    state["phase"] = target_phase
    save(state)
    return state


def set_product(name: str, product_type: str, core_problem: str, 
                target_audience: str, emotional_words: list[str]) -> dict:
    """Initialize a new product build."""
    state = load()
    state["product_input"] = {
        "name": name,
        "type": product_type,
        "core_problem": core_problem,
        "target_audience": target_audience,
        "emotional_words": emotional_words[:3]
    }
    state["_product"] = name
    # Reset downstream state
    state["design_directions"] = []
    state["selected_direction"] = None
    state["positioning_brief"] = {k: None for k in state["positioning_brief"]}
    state["approval_gates"] = {k: False for k in state["approval_gates"] 
                                if not k.endswith("_at")}
    state["approval_gates"].update({k: None for k in state["approval_gates"] 
                                    if k.endswith("_at")})
    save(state)
    return state


def add_design_direction(direction: dict) -> dict:
    """Add a generated design direction."""
    state = load()
    required = ["id", "name", "colors", "typography", "layout_archetype", 
                "interaction_philosophy", "emotional_fit", "audience_fit"]
    missing = [k for k in required if k not in direction]
    if missing:
        print(f"ERROR: Design direction missing required fields: {missing}", file=sys.stderr)
        sys.exit(1)
    state["design_directions"].append(direction)
    save(state)
    return state


def approve_direction(direction_id: int, source: str = "generated") -> dict:
    """Record design direction approval (gate: preview → approved)."""
    state = load()
    directions = state["design_directions"]
    
    if direction_id < 1 or direction_id > len(directions):
        print(f"ERROR: Direction {direction_id} doesn't exist. Available: 1-{len(directions)}", 
              file=sys.stderr)
        sys.exit(1)
    
    state["selected_direction"] = directions[direction_id - 1]
    state["selection_source"] = source  # "generated" or "reference"
    state["approval_gates"]["design_approved"] = True
    state["approval_gates"]["design_approved_at"] = datetime.now(timezone.utc).isoformat()
    save(state)
    return transition("approved")


def record_error(error: str, layer: str, fix_applied: str = None) -> dict:
    """Log an error with layer attribution for self-anneal tracking."""
    state = load()
    state["errors"].append({
        "error": error,
        "layer": layer,  # "layer_1", "layer_2", "layer_3"
        "fix_applied": fix_applied,
        "at": datetime.now(timezone.utc).isoformat()
    })
    save(state)
    return state


def record_learning(learning: str) -> dict:
    """Log a learning for directive improvement."""
    state = load()
    state["learnings"].append({
        "learning": learning,
        "phase": state["phase"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    save(state)
    return state


def status() -> None:
    """Print current state summary."""
    state = load()
    product = state["product_input"]["name"] or "none"
    phase = state["phase"]
    directions = len(state["design_directions"])
    selected = state["selected_direction"]["name"] if state["selected_direction"] else "none"
    approved = state["approval_gates"]["design_approved"]
    errors = len(state["errors"])
    
    print(f"""
╔══════════════════════════════════════╗
║         AGENT STATE SUMMARY          ║
╠══════════════════════════════════════╣
║  Product:     {product:<24}║
║  Phase:       {phase:<24}║
║  Directions:  {directions:<24}║
║  Selected:    {selected:<24}║
║  Approved:    {str(approved):<24}║
║  Errors:      {errors:<24}║
╚══════════════════════════════════════╝
""")


def reset() -> dict:
    """Reset state to idle (preserves learnings)."""
    state = load()
    learnings = state.get("learnings", [])
    
    with open(STATE_FILE) as f:
        template = json.load(f)
    
    # Only preserve learnings across resets
    template["learnings"] = learnings
    template["phase"] = "idle"
    save(template)
    print("State reset to idle. Learnings preserved.")
    return template


# CLI interface
if __name__ == "__main__":
    commands = {
        "status":     lambda: status(),
        "reset":      lambda: reset(),
        "transition": lambda: transition(sys.argv[2]),
    }
    
    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        print(f"Usage: state_manager.py <command>")
        print(f"Commands: {', '.join(commands.keys())}")
        sys.exit(1)
    
    commands[sys.argv[1]]()
