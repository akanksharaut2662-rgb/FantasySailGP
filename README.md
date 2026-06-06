# FantasySailGP

## Overview

SailGP Fantasy Predictor is a fan-engagement platform that combines fantasy sports with machine learning-powered race recommendations.

Before a race, fans receive team recommendations based on forecasted wind conditions and historical race performance. Fans then build a fantasy lineup by selecting up to **three SailGP teams**. Once race results are available, the platform calculates fantasy points based on real race telemetry and displays leaderboard rankings.

For the hackathon prototype, the recommendation model is trained using **Halifax race data** and evaluated using **Bermuda race data**, allowing us to demonstrate a realistic prediction workflow using historical events.

---

## Problem Statement

SailGP races generate massive amounts of telemetry and performance data, but new and casual fans often struggle to understand:

* Which teams are likely to perform well
* How weather conditions affect race outcomes
* Which teams to support before a race begins

As a result, fans remain passive spectators rather than active participants.

Our solution transforms fans into participants through a fantasy-style experience powered by predictive analytics.

---

## Solution

SailGP Fantasy Predictor provides:

### AI-Powered Team Recommendations

Using historical race performance and environmental conditions, the system predicts which teams are most likely to perform well under upcoming wind conditions.

Example:

* Australia — Predicted Score: 85
* Great Britain — Predicted Score: 80
* Canada — Predicted Score: 72

---

### Fantasy Team Builder

Users can select up to **three teams** for their fantasy lineup.

Example:

* Australia
* Canada
* Spain

---

### Fantasy Scoring Engine

Points are calculated from actual race telemetry, including:

* Finishing Position
* Boat Speed
* Overtakes
* Penalties
* Race Status

Sample scoring rules:

| Event         | Points |
| ------------- | ------ |
| 1st Place     | +50    |
| Podium Finish | +25    |
| Fastest Boat  | +10    |
| Overtake      | +5     |
| Penalty       | -10    |

---

### Leaderboard

Users can compare their fantasy score against other participants and evaluate how well the recommendation engine performed.

---

## Dataset

### Training Dataset

Halifax Race Data

Used for:

* Model Training
* Feature Engineering
* Recommendation Generation

Approximate training records:

* 6 races
* 10 teams
* ~60 team-race observations

---

### Testing Dataset

Bermuda Race Data

Used for:

* Model Evaluation
* Fantasy Simulation
* Demonstration of predictive performance

Approximate testing records:

* 8 races
* 12 teams
* ~96 team-race observations

---

## Features Used

### Environmental Features

* Average Wind Speed (`avg_tws_km_h`)
* Average Wind Direction (`avg_twd_deg`)

### Team Feature

* Team Identity

This allows the model to learn patterns such as:

> Certain teams consistently perform better under specific wind conditions.

---

## System Architecture

```text
Race Metadata
(Wind Conditions)
        |
        v
Recommendation Engine
(Machine Learning Model)
        |
        v
Fantasy Team Builder
(Select Up To 3 Teams)
        |
        v
Fantasy Scoring Engine
(Telemetry-Based Scoring)
        |
        v
Leaderboard
```

## Technology Stack

### Frontend

* React
* HTML/CSS
* JavaScript

### Backend

* FastAPI (Python)

### Machine Learning

* Scikit-Learn
* Pandas
* NumPy

### Data Storage

* SQLite

---

## How the Demo Works

Because live race results are unavailable during judging, historical race data is used to simulate the real-world workflow.

### Step 1

Train the recommendation model using Halifax race data.

### Step 2

Provide Bermuda race wind conditions to the model.

### Step 3

Generate recommended teams.

### Step 4

User selects up to three teams.

### Step 5

Reveal the historical Bermuda race outcome.

### Step 6

Calculate fantasy points using actual telemetry data.

### Step 7

Display leaderboard rankings.

This mirrors how the system would operate during a live SailGP event while allowing judges to see the complete experience in a single demonstration.

---

## Future Enhancements

* Live SailGP race integration
* Real-time telemetry ingestion
* User accounts and persistent leaderboards
* Weekly fantasy competitions
* Friend leagues
* AI explanations for recommendations
* Mobile application support

---

## Team Vision

Our goal is to increase fan engagement by transforming SailGP spectators into active participants.

By combining fantasy gaming with machine learning-driven recommendations, we create a more interactive race experience while helping fans better understand the impact of weather conditions and team performance.
