# AuraSense
## Junction 2025 Aava-Pfizer Migraine Prediction App

[Open application](https://junction2025-bice.vercel.app/)

> **Note:** The live application showcases AuraSense's capabilities using a curated dataset of pre-uploaded scenarios. To demonstrate the full range of prediction patterns and explanations, the interface presents a rotating carousel of different risk states that automatically cycles every ~10 seconds. This allows visitors to experience how the AI agent responds to various combinations of triggers and personal patterns without requiring manual data input.

> For the best experience install app from Safari share -> add to home screen or use Chrome on Andorid

## AuraSense — Personal AI Agent for Migraine Prediction

AuraSense is a fully private, on-device AI agent designed to predict migraines before symptoms appear. Instead of logging data after the fact, it identifies meaningful patterns, explains why risk changes, and guides users with actionable steps — all without sending any personal information to the cloud.

## The Problem

Migraines are caused by many overlapping factors: sleep patterns, stress levels, light exposure, food, weather, hormones, and lifestyle.
What triggers one person may have zero effect on another. Despite this, most migraine apps today fail to help users predict anything.

Current tools only log symptoms. They treat all users the same, show charts without explanations, and never reveal what might happen next. Without a real forecast, people can only react when pain has already started.

## What We Built

AuraSense is not a static model — it is a personal AI agent that adapts to each individual.

### Personal AI Agent

It behaves like a dedicated assistant, learning unique combinations of triggers and personal patterns that shape each user’s migraine profile.

### Predicts in Advance

The agent forecasts migraine risk before the first symptoms appear, giving users time to prepare, adjust behavior, or prevent an attack entirely.

### Runs Locally, Fully Private

All computation happens directly on the user’s device using pure JavaScript.
No servers. No cloud. No TensorFlow.
Personal health data never leaves the device — users keep complete control and privacy.

## Architecture

AuraSense uses an interpretable decision tree built on 12 personalized parameters.

```
Inputs → Decision Tree → Risk & Suggested Actions
```

Because the system is entirely local and transparent, users can clearly understand why predictions are made and what factors influence them.

## Daily Inputs

AuraSense combines multiple data sources to build a complete picture of migraine risk:

### Automatic inputs:
* Wearable data (sleep, stress, HRV)
* Phone usage and screen patterns
* Weather and geolocation
* Calendar context
* Connected health data apps (Apple Health, etc.)

### Manual inputs:
Simple one-tap logging for food triggers, sensory overload, caffeine, alcohol, exercise, or low-FPS gaming.

All of this is compared against the user’s personal history, revealing context-dependent patterns invisible to generic models.

## Prediction Result

AuraSense presents clear outcomes:

MIGRAINE RISK — HIGH⚠️

MIGRAINE RISK — MODERATE

But the agent doesn’t stop at a number — it suggests concrete actions: hydration, reduced light exposure, breaks, rest planning, or medication reminders (if enabled).

## Why This Risk?

Every prediction is explained. The agent highlights the factors contributing to the current state, such as:
* low sleep,
* high stress,
* bright light exposure,
* prodrome signals,
* environmental or behavioral changes.

Both High Risk and Moderate Risk views include a transparent list of key drivers so users always understand why something is happening.

## Risk History & Trends

AuraSense tracks long-term trends, showing how risk evolves over days and weeks. It is aware of context, patterns, and personal cycles — enabling deeper insight than simple charts.

## Not a Model. An Agent.

AuraSense contains several layers:

### Decision Layer

Chooses how to act: when to warn, what to recommend, and how strongly to respond.

### Explanation Layer

Shows precisely why risk changed and which signals influenced the outcome.

### Context Layer

Understands the user’s environment — calendar events, weather, routines — and adapts predictions accordingly.

### Local & Private Architecture

Everything runs on-device. No data leaves the user’s phone. Privacy is absolute.

AuraSense transforms migraine management from passive tracking into proactive personal guidance. It forecasts, explains, and acts — helping users stay one step ahead of their migraines with complete privacy and clarity.
