# AI Voice Interviewer Platform 🎙️🤖

An enterprise-grade, locally executed AI Voice Interview platform built with Next.js 15, Bun, Express, MongoDB, and Google Gemini 2.5 Flash.

## Architectural Overview

* **Runtime & Package Manager:** Bun (Ultra-fast JavaScript/TypeScript engine)
* **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion, Web Audio API
* **Backend:** Express.js + TypeScript running on Bun
* **Database:** MongoDB Community Edition + Mongoose ODM
* **AI Engine:** Google Gemini 2.5 Flash (Adaptive difficulty & dynamic follow-up state machine)
* **Voice Engine:** Web Speech Synthesis & Browser MediaRecorder API

---

## Local Installation Guide

### Prerequisites
1. **Bun** installed (`curl -fsSL https://bun.sh/install | bash`)
2. **MongoDB Community Server** running on `mongodb://127.0.0.1:27017`
3. **Google Gemini API Key** (Free tier from [aistudio.google.com](https://aistudio.google.com/))

### 1. Backend Setup
```bash
cd server
bun install