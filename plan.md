# Apex AI implementation plan

## Product and design direction

Apex AI is positioned as a quiet-luxury climate systems brand for design-conscious homeowners and specialist contractors. The design movement is editorial architectural minimalism: monochromatic black surfaces, electric-blue highlights, cool neutral typography and restrained motion. The layout uses asymmetrical editorial bands and a technical field-log cadence rather than generic centered cards. Signature motifs are the A monogram, engineering labels and blue measurement lines. Motion is deliberate and slow: hotspot emphasis, fan rotation and soft GSAP focus shifts reinforce precision. Manrope carries the UI; Playfair Display carries the high-end editorial voice.

## Structure

- `app/page.tsx`: single-page marketing experience, procedural Three.js condenser viewer, hotspot controls, calculator and concierge UI.
- `app/globals.css`: responsive visual system, luxury palette, typography, layout and motion styling.
- `app/api/concierge/route.ts`: server-side Groq relay with strict one-field-at-a-time intake persona.
- `app/template.tsx`: shared page-transition wrapper used by the home route.

## Service boundary

Secrets are environment-only. The API route degrades gracefully to offline copy when Groq is unavailable. Cal.com and SendGrid are reserved for server-side booking and confirmation wiring after production account configuration; no client secret is exposed.
