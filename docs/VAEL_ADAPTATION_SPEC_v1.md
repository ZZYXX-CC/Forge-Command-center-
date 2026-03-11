# VAEL_ADAPTATION_SPEC_v1

## Scope
- Route `/` (Morning Brief)
- Route `/p2p` (Trading P2P)

## Adaptation Policy
- DS-only adaptation.
- No new components.
- Use existing FORGE X NUVUE components/tokens only.

## Required UI States
- loading
- empty
- error
- stale
- retry
- disabled

## Mapping Notes
- Preserve existing page layouts and card structure.
- State rendering must be compositional with existing primitives.
- Freshness state must use existing freshness/status badges.
- Retry action must use existing button/action components.
- Disabled state must use existing muted/blocked visual language from DS tokens.
