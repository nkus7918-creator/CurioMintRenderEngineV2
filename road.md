# 🚀 CurioMint Roadmap

> Last Updated: 2026-07-11

> Version: 1.0

---

# 🎯 Vision

CurioMint is an AI-powered fully automated short-form video production platform.

The goal is to create YouTube Shorts (and later other platforms) with:

- AI generated scripts
- AI narration
- Dynamic subtitles
- Professional Remotion rendering
- Fully automated publishing pipeline

Long-term objective:

> Produce premium-quality videos that are visually comparable to manually edited content while remaining 100% automated.

---

# 🏗 Current Stack

## AI

- OpenAI GPT
- OpenAI TTS
- Whisper Transcription



## Automation

- n8n



## Media

- Pexels
- Cloudinary



## Rendering

- Remotion 4
- Express API
- Docker



## Infrastructure

- Netcup VPS
- Docker Compose
- GitHub

---



# ✅ Phase 0 — Foundation



## Render Engine

- [x] Express API

- [x] Health endpoint

- [x] Render endpoint

- [x] Job Queue

- [x] Worker

- [x] Download endpoint



## Docker

- [x] Dockerfile

- [x] docker-compose

- [x] VPS deployment

- [x] GitHub deployment



## Templates

- [x] Template Registry

- [x] Composition system

- [x] Dynamic Props

---



# ✅ Phase 1 — Subtitle Engine V1



## Typography

- [x] Anton Font

- [x] Outline

- [x] Shadow

- [x] Highlight



## Subtitle

- [x] Hook style

- [x] Fact style

- [x] Dynamic grouping

- [x] Whisper word timestamps

- [x] Timestamp fallback

- [x] Hook single-line logic



## Animation

- [x] Entrance animation

- [x] Background zoom

- [x] Gradient overlay

---



# 🚧 Phase 2 — Subtitle Engine V2



## Subtitle Behaviour

- [ ] Natural subtitle transitions

- [ ] Prevent repeated animation of same line

- [ ] Better easing

- [ ] Separate hook animation

- [ ] Separate fact animation

- [ ] Better subtitle persistence



## Layout

- [ ] Automatic line breaking

- [ ] Responsive subtitle width

- [ ] Long-word handling

- [ ] Mobile readability optimization



## Highlight

- [ ] Premium highlight animation

- [ ] Glow effect

- [ ] Pulse effect

- [ ] Multiple highlighted words



## Timing

- [ ] Whisper timing fine tuning

- [ ] Pause detection improvements

- [ ] Subtitle overlap prevention

---



# 🎬 Phase 3 — Video Engine



## Camera

- [ ] Slow zoom

- [ ] Random pan

- [ ] Ken Burns effect

- [ ] Motion blur feeling



## Overlay

- [ ] Dynamic gradient

- [ ] Adaptive contrast

- [ ] Brightness compensation

- [ ] Dynamic vignette



## Scene

- [ ] Better scene transitions

- [ ] Camera easing

- [ ] Motion improvements

---



# 🤖 Phase 4 — AI Subtitle Engine

Current

GPT

↓

Text

↓

TTS

↓

Whisper

↓

Remotion

Target

GPT

↓

Subtitle Rhythm

↓

TTS

↓

Whisper Timing Correction

↓

Remotion

## AI Rhythm

- [ ] Emphasis groups

- [ ] Emotion tags

- [ ] Pause prediction

- [ ] Subtitle rhythm generation

Target example

```json

{

  "hook": "...",

  "highlight": "...",

  "subtitleGroups": [

    {

      "text": "THE HUMAN",

      "emotion": "impact"

    },

    {

      "text": "BODY IS",

      "emotion": "normal"

    },

    {

      "text": "AMAZING",

      "emotion": "strong"

    }

  ]

}

```

Goal

Remotion should not decide subtitle grouping.

GPT should.

---



# 🎥 Phase 5 — AI Video Intelligence

GPT will generate visual directions.

Example

```json

{

  "camera": "slowZoom",

  "overlay": "dark",

  "subtitleAnimation": "impact",

  "highlightColor": "#FFD400"

}

```

Features

- [ ] Camera direction

- [ ] Scene mood

- [ ] Overlay intensity

- [ ] Subtitle style

- [ ] Highlight color

- [ ] Transition style

---



# ⚙ Phase 6 — Automation



## n8n

- [ ] Retry system

- [ ] Error recovery

- [ ] Notifications

- [ ] Automatic retries



## Render Engine

- [ ] Queue optimization

- [ ] Parallel rendering

- [ ] Performance improvements



## Upload

- [ ] YouTube upload

- [ ] Thumbnail upload

- [ ] Playlist selection

- [ ] Scheduling

---



# 📊 Phase 7 — Analytics

- [ ] Retention tracking

- [ ] Best hooks

- [ ] Best highlight patterns

- [ ] AI feedback loop

---



# 🌍 Phase 8 — CurioMint Platform

Current

One YouTube Shorts channel

Future

Multiple AI channels

- [ ] Animals

- [ ] Space

- [ ] History

- [ ] Psychology

- [ ] Technology

- [ ] Finance

Single rendering engine.

Multiple brands.

---



# 🛠 Development Rules

Every feature should:

- solve one problem
- have one responsibility
- be testable
- be reversible

---



## Git Strategy

Small commits only.

Example

```

feat: improve subtitle grouping

fix: whisper timing offset

refactor: subtitle engine

perf: optimize rendering

docs: update roadmap

```

---



# 📌 Current Focus

Current Phase

➡ Phase 2 — Subtitle Engine V2

Current Goal

Improve subtitle quality until it reaches premium manual-edit level.

Only after that continue with:

Phase 3

↓

Phase 4

↓

Automation

↓

Analytics

---



# 💡 Future Ideas

(Add ideas here whenever they appear.)







# 🚀 Phase X — Retention Engine

Goal:

Maximize viewer retention before adding new visual effects.

## Script

- [ ] Curiosity gap

- [ ] Story structure

- [ ] Stronger hooks

- [ ] Better payoff

## Audio

- [ ] Hook voice tuning

- [ ] Fact voice tuning

- [ ] Speech pacing

## Visual

- [ ] Scene rhythm

- [ ] Shot frequency

- [ ] Motion timing

## Analytics

- [ ] Retention experiments

- [ ] A/B prompts

- [ ] Winning hook library