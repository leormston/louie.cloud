---
title: "Agile on the Beach 2026: Three Talks That Stuck With Me"
slug: "agile-on-the-beach-2026"
date: "2026-07-05"
author: "Louie Ormston Demi"
category: "Conferences"
excerpt: "Back from Agile on the Beach - three talks on non-blocking code reviews, pair programming with AI, and using ChatGPT to fight spam have been rattling around my head since."
---

# Agile on the Beach 2026: Three Talks That Stuck With Me

![Agile on the Beach 2026](/blog-images/aotb.jpeg)

Welcome to my first blog post! I'm aiming to post one of these a week - a mix of things I've learned, opinions on tooling, and whatever else is on my mind. Let's get into it.

---

I'm back from [Agile on the Beach](https://agileonthebeach.com/) this week. I attended a bunch of talks but three in particular have been rattling around my head since.

## Non-Blocking Continuous Code Reviews (Thierry de Pauw)

Thierry made a compelling case that blocking code reviews actually hurt delivery. They discourage small changes, kill refactoring, and slow everything down.

His alternative: commit to mainline, let your test suite catch bugs, review asynchronously, and stop gating releases on reviews. It requires genuine trust in your team, but the logic is sound - less WIP, shorter lead times, and people who aren't afraid to make small improvements.

## Pair Programming in the Age of AI (Ryan Healey)

The bit that got me was the AI angle. Ryan's argument is that pairing becomes *more* valuable now, not less - two people critically evaluating AI-generated code together is far better than one person accepting suggestions alone.

His team pushes straight to main with no PRs because the pairing *is* the review. Which ties back nicely to Thierry's talk.

## Never Let a Crisis Go to Waste (Kate Sant)

Elsevier got hit by a spam attack on their research papers platform. Firewalls didn't work, CAPTCHAs didn't work, regex had too many false positives.

They ended up using the ChatGPT API with zero-shot prompting to classify submissions - 92% accurate at about $200/month. No fancy prompt engineering needed. Sometimes the simplest approach just works.

---

Loved the conference. Already thinking about what to try bringing back to the team.
