## Golf Swing AI Analyzer

A web application that allows users to upload short golf swing videos and receive an AI-powered swing analysis — including posture feedback, swing tempo, and improvement suggestions.

---

### Background

The idea for this project was born on the golf range. While practicing, I — Oskar Olofsson — decided to test ChatGPT as a personal golf coach. To my surprise, it delivered insightful feedback and effective drills. But there was a problem: the experience wasn’t built for golfers. The interface was clunky, and the analysis lacked the visual and motion-focused tools that golfers actually need.

That moment sparked an idea — what if AI could become a true golf coach?
Not just text-based advice, but real swing analysis, visual feedback, and actionable insights — all in one simple, golfer-friendly platform.

This project is the result of that vision: bringing advanced AI technology to the driving range, so golfers at any level can get instant, professional-quality feedback from their own swing videos.

---

### Features

**Upload Swing Video** — Upload a short clip of your golf swing (from phone or camera).
**AI-Powered Analysis** — Get instant insights on swing mechanics, rotation, and balance together with fitting drills.
**Fast Results** — Receive detailed feedback in under a minute.
**Secure & Private** — Your video is uploaded securely via HTTPS and temporarily processed by our AI system. Once the analysis is complete, the video file is immediately deleted from our servers — we don’t keep or share it.
**Progress Tracking** — (Optional) Save previous swings to see your improvement over time.

---

### Tech Stack

| Area           | Technology                                     |
| -------------- | ---------------------------------------------- |
| Frontend       | React + Tailwind CSS                           |
| Backend        | Python Flask                                   |
| AI / Analysis  | Python OpenAI API                              |
| Storage        | Firebase Storage                               |
| Authentication | Firebase Auth                                  |
| Deployment     | Render                                         |

---
