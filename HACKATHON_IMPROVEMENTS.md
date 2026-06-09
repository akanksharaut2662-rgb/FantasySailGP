# Hackathon Win Improvements

Ordered by impact-to-effort ratio.

---

## P0 — Highest ROI

### 1. Auto-demo / kiosk mode
- [ ] "Watch Demo" button on landing page and /app
- [ ] Auto-selects Halifax Race 1, steps through each screen with timed delays
- [ ] Ends on Results page with count-up animation playing
- [ ] Judge sees full product in 30s without touching anything

### 2. "Why this pick" explainability
- [ ] Add one contextual line per AI recommendation card in OptimizerPanel
- [ ] Surface precomputed reasons: wind history %, VMG rank, position trend
- [ ] Makes Ridge Regression look interpretable, not like a black box

### 3. Feature importance chart on /model
- [ ] Horizontal bar chart of model feature weights
- [ ] Shows which signals drove the model: wind speed, direction, team history
- [ ] Turns "we ran regression" into "we understood the data"

---

## P1 — High impact, 2-3 hours each

### 4. "Next Race" prediction window on landing page
- [ ] Section showing upcoming race with live countdown timer
- [ ] Pre-race AI picks shown as "locked" until race starts
- [ ] Answers judge question: "what does this do on race day?"
- [ ] Can use mocked/hardcoded next race data

### 5. Live wind data badge
- [ ] Fetch current conditions from OpenMeteo API (free, no key)
- [ ] Show "Live conditions" badge on landing page or race selector
- [ ] Makes the app feel real-time, not just retrospective

---

## P2 — Nice to have

### 6. Shareable result URL
- [ ] Encode race + team picks into URL params
- [ ] `/app?race=Halifax_Race_1&picks=AUS,NZL,GBR`
- [ ] Shows product thinking, makes demo shareable

### 7. Landing page copy audit
- [ ] Add SailGP context for non-sailing judges
- [ ] "F50 catamarans reaching 100 km/h", "10 national teams"
- [ ] Every heading should work without SailGP domain knowledge

---

## Progress

| # | Feature | Status |
|---|---------|--------|
| 1 | Auto-demo mode | [x] Done |
| 2 | "Why this pick" explainability | [x] Done |
| 3 | Feature importance chart | [x] Done |
| 4 | Next Race prediction window | [x] Done |
| 5 | Live wind badge | [x] Done |
| 6 | Shareable result URL | [ ] Not started |
| 7 | Copy audit | [ ] Not started |
