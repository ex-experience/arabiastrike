# EX™ ARABIA STRIKE — Production V3

Original browser run-and-gun arcade MVP for EX™. This build recreates classic 1990s arcade **techniques and feel** without copying SNK/Metal Slug copyrighted code, sprites, audio, maps, characters, bosses, UI, or level layouts.

## Production V3
- Native logical render: **304×224**
- Fixed simulation: **59.18 Hz**
- Pixel-perfect no-filter scaling
- 4–6 layer pseudo-parallax
- Limited per-entity palette discipline + elite palette swaps
- Procedural 12-step hero movement, squash/stretch landing
- Secondary animation: muzzle flash, shells, dust, smoke
- Destructible props: intact → damaged → critical → destroyed
- Separate player hurtbox logic + i-frames
- Projectile arcs and grenade bounce
- Context-aware enemy FSM: idle, cook, surprise, patrol, shoot, melee, panic, duck
- Optional programmed arcade slowdown during high sprite/particle density
- Optional CRT scanlines / vignette
- EX-HMV vehicle combat
- Giant multi-phase DUNE HARVESTER boss
- Local 2-player keyboard co-op + mobile touch controls
- New bright energetic cover/menu using EX ARABIA STRIKE art
- PWA + cache versioning for GitHub Pages

## Controls
P1: A/D move, W/Space jump, J/F fire, K grenade, E enter/exit vehicle.
P2: arrows, / fire, . grenade, Enter interact.

## IP note
The requested 1:1 reproduction is intentionally not implemented. Production V3 reproduces general arcade engineering concepts and motion principles while keeping original EX assets, names, characters, audio synthesis, enemies, vehicle and stage design.
