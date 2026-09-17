# Prepwise

### Autonomous Local-First AI Technical Interviewer

Prepwise is a voice-first, privacy-focused technical mock interview platform that generates interview questions from a candidate's real resume and public GitHub projects.

It combines local LLM reasoning through Ollama, local speech-to-text using Whisper.cpp, GitHub repository analysis, resume parsing, adaptive interview state management, deterministic interview progression, completion-scaled scoring, and MongoDB-based interview auditing.

> **Prepwise — Prepare by defending what you built.**

---

## 📌 Why Prepwise?

Traditional interview preparation often focuses heavily on abstract coding problems.

Real technical interviews frequently ask candidates to explain and defend the engineering decisions behind projects they have actually built:

* Why did you choose this architecture?
* Why did you use this framework?
* What happens if this service fails?
* How would you scale this system?
* What trade-offs did you make?
* How would you debug this production issue?
* What would you change if you rebuilt the project?

Prepwise is designed around these questions.

### Core Flow

```text
Resume + GitHub Projects
          ↓
Candidate Profile
          ↓
Adaptive Technical Interview
          ↓
Voice-based Interaction
          ↓
Technical Evaluation
          ↓
Scorecard
```

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Candidate       │
                    │ Resume + GitHub URL  │
                    └──────────┬───────────┘
                               │
                               ▼
              ┌─────────────────────────────────┐
              │       Candidate Ingestion       │
              │                                 │
              │ PDF Parser + GitHub REST API   │
              └───────────────┬─────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ ICandidateProfile │
                    └─────────┬─────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │            Interview Engine              │
        │                                          │
        │      8-Stage Deterministic FSM          │
        │                                          │
        │ Intro → Resume → GitHub → Mechanics     │
        │ → Edge Cases → Problem Solving          │
        │ → Behavioral → Evaluation               │
        └────────────────────┬─────────────────────┘
                             │
               ┌─────────────┴──────────────┐
               │                            │
               ▼                            ▼
      ┌─────────────────┐         ┌──────────────────┐
      │ Whisper.cpp     │         │ Ollama           │
      │ Local STT       │         │ Local LLM        │
      │                 │         │ Qwen2.5:3b       │
      └────────┬────────┘         └────────┬─────────┘
               │                           │
               └─────────────┬─────────────┘
                             ▼
                 ┌─────────────────────────┐
                 │ Completion-Scaled       │
                 │ Evaluation Rubric       │
                 └────────────┬────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │     MongoDB      │
                    │ Interview Audit  │
                    │ & Scorecard      │
                    └──────────────────┘
```

---

# ✨ Core Features

## 1. Resume-Based Interview Generation

Prepwise extracts technical information from candidate resumes, including:

* Programming languages
* Frameworks
* Libraries
* Databases
* Cloud technologies
* Development tools
* Project experience

The extracted profile becomes part of the interview context.

---

## 2. GitHub Project Analysis

Public GitHub repositories can be analyzed to understand:

* Repository structure
* Primary programming languages
* Project architecture
* Commit information
* Repository statistics
* Technologies used

This allows the interviewer to ask questions based on projects the candidate actually worked on.

---

## 3. Eight-Stage Deterministic Interview FSM

The interview follows a controlled state machine:

```text
1. Introduction
        ↓
2. Resume Review
        ↓
3. GitHub Architecture
        ↓
4. Technical Mechanics
        ↓
5. Project Edge Cases
        ↓
6. Problem Solving
        ↓
7. Behavioral & Trade-offs
        ↓
8. Wrap-up & Evaluation
```

The FSM keeps the interview structured and prevents random progression between unrelated topics.

---

## 4. Anti-Boomerang Topic Blacklisting

Prepwise maintains topic information across interview turns.

For example, if a candidate says:

> "I haven't worked with TypeScript."

That topic can be blacklisted so the interviewer does not repeatedly return to the same unsupported technology.

This keeps the interview focused on the candidate's actual experience.

---

## 5. Local Speech Recognition

Candidate responses are recorded using the browser's `MediaRecorder` API and processed locally through Whisper.cpp.

```text
Microphone
    ↓
MediaRecorder
    ↓
WebM Audio
    ↓
Backend
    ↓
Whisper.cpp
    ↓
Transcript
```

This reduces dependence on third-party speech-to-text APIs.

---

## 6. Audio Recovery

Short, empty, or unintelligible audio responses are handled gracefully.

Instead of treating an empty transcription as a client failure, the system can return a conversational clarification such as:

```text
"I didn't catch that. Could you explain that again?"
```

This keeps the interview session active.

---

## 7. Anti-Inflation Scoring

Prepwise evaluates candidates across five dimensions:

| Evaluation Vector  | Weight |
| ------------------ | -----: |
| Technical Accuracy |    40% |
| Problem Solving    |    20% |
| Communication      |    20% |
| Confidence         |    10% |
| Depth              |    10% |

The raw score is adjusted according to interview completion:

```text
Completion-Scaled Score

Raw Score × (Completed Stages / 8)
```

This prevents incomplete interviews from receiving the same evaluation as fully completed sessions.

---

## 8. Dynamic Seniority Calibration

The evaluation engine uses:

* Final difficulty level
* Completion-scaled score
* Interview performance

to determine an appropriate seniority classification:

```text
Entry-Level
Junior
Mid-Level
Senior
```

---

# 🛠️ Technology Stack

| Layer             | Technology         |
| ----------------- | ------------------ |
| Frontend          | Next.js 16         |
| Routing           | Next.js App Router |
| Styling           | Tailwind CSS       |
| Icons             | Lucide React       |
| Browser Audio     | MediaRecorder API  |
| Backend Runtime   | Bun                |
| Backend Framework | Express.js         |
| File Uploads      | Multer             |
| Database          | MongoDB            |
| ODM               | Mongoose           |
| Speech-to-Text    | Whisper.cpp        |
| Local LLM         | Ollama             |
| LLM Model         | Qwen2.5:3b         |
| Repository Data   | GitHub REST API    |
| Authentication    | JWT                |

---

# 📂 Project Structure

```text
Prepwise/
│
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── upload/
│   │   │   ├── interview/
│   │   │   └── scoreboard/
│   │   │
│   │   └── hooks/
│   │       └── audio/media recorder hooks
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── candidate/
│   │   │   └── interview/
│   │   │
│   │   ├── models/
│   │   │   ├── User
│   │   │   └── Interview
│   │   │
│   │   ├── routes/
│   │   │   ├── candidate
│   │   │   └── interview
│   │   │
│   │   ├── services/
│   │   │   ├── FSM
│   │   │   ├── Whisper STT
│   │   │   ├── Ollama LLM
│   │   │   └── Profile Ingestion
│   │   │
│   │   └── utils/
│   │
│   └── package.json
│
├── .gitignore
├── README.md
└── LICENSE
```

---

# 🚀 Getting Started

## Prerequisites

You will need:

1. Bun
2. MongoDB
3. Ollama
4. Qwen2.5:3b
5. Whisper.cpp

---

## 1. Install Bun

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify:

```bash
bun --version
```

---

## 2. Setup MongoDB

You can use either:

* Local MongoDB
* MongoDB Atlas

Default local database:

```text
mongodb://localhost:27017/prepwise
```

---

## 3. Setup Ollama

Install Ollama and download the required model:

```bash
ollama pull qwen2.5:3b
```

Start Ollama:

```bash
ollama serve
```

Verify:

```bash
ollama list
```

---

## 4. Setup Whisper.cpp

Compile or install Whisper.cpp locally.

You will need:

```text
/path/to/whisper.cpp/main
```

and:

```text
/path/to/whisper.cpp/models/ggml-base.en.bin
```

---

# ⚙️ Environment Configuration

Create:

```text
server/.env
```

Example:

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017/prepwise

JWT_SECRET=replace_with_a_secure_random_secret

OLLAMA_BASE_URL=http://localhost:11434

WHISPER_PATH=/path/to/whisper.cpp/main

WHISPER_MODEL_PATH=/path/to/whisper.cpp/models/ggml-base.en.bin
```

### ⚠️ Security

Never commit:

```text
.env
API keys
JWT secrets
GitHub tokens
Candidate resumes
Interview audio
Local AI models
Database credentials
```

Make sure these are included in `.gitignore`.

---

# 📦 Installation

## Backend

```bash
cd server
bun install
bun run dev
```

Backend:

```text
http://localhost:5000
```

---

## Frontend

Open another terminal:

```bash
cd client
bun install
bun run dev
```

Frontend:

```text
http://localhost:3000
```

Open the frontend in your browser to start an interview.

---

# 🔄 Interview Flow

```text
Candidate
    │
    ▼
Upload Resume
    │
    ▼
Provide GitHub Repository
    │
    ▼
Candidate Profile Generated
    │
    ▼
Interview Begins
    │
    ├── Resume Questions
    │
    ├── GitHub Architecture
    │
    ├── Technical Deep Dive
    │
    ├── Edge Cases
    │
    ├── Problem Solving
    │
    └── Behavioral Trade-offs
    │
    ▼
Evaluation
    │
    ▼
Scorecard
```

---

# 🧠 Local AI Pipeline

Prepwise is designed around a local-first AI pipeline:

```text
Candidate Audio
      │
      ▼
Whisper.cpp
      │
      ▼
Transcript
      │
      ▼
Interview FSM
      │
      ▼
Ollama / Qwen2.5:3b
      │
      ▼
Next Question / Evaluation
```

The architecture minimizes dependency on external AI inference services.

---

# 🔐 Privacy & Security

Candidate data can contain sensitive professional information.

Recommended production practices:

* Keep `.env` files out of Git
* Never commit API keys
* Never commit JWT secrets
* Never commit uploaded resumes
* Never commit recorded audio
* Never commit local LLM model files
* Protect MongoDB credentials
* Use HTTPS in production
* Restrict GitHub token permissions
* Validate uploaded files
* Sanitize API inputs
* Protect authenticated endpoints
* Add rate limiting for production deployments

> **Local-first does not mean every operation is offline.** GitHub API requests are still external network requests when repository information is retrieved.

---

# 🧪 Development

### Backend

```bash
cd server
bun install
bun run dev
```

### Frontend

```bash
cd client
bun install
bun run dev
```

### Frontend production build

```bash
cd client
bun run build
```

---

# 🐛 Troubleshooting

## Ollama connection error

Check:

```bash
ollama serve
```

Then:

```bash
ollama list
```

Make sure `qwen2.5:3b` is installed.

---

## Whisper transcription failure

Check:

```env
WHISPER_PATH=/path/to/whisper.cpp/main
WHISPER_MODEL_PATH=/path/to/whisper.cpp/models/ggml-base.en.bin
```

Make sure both paths point to valid files.

---

## MongoDB connection error

Verify that MongoDB is running and check:

```env
MONGODB_URI=mongodb://localhost:27017/prepwise
```

---

## Microphone does not work

Check:

* Browser microphone permissions
* Browser console errors
* `MediaRecorder` support
* `localhost` or HTTPS availability
* Operating-system microphone permissions

---

## GitHub repository cannot be analyzed

Check:

* Repository URL
* Repository visibility
* GitHub API response
* API rate limits
* Authentication configuration, if applicable

---

# 🗺️ Roadmap

* [ ] Multi-model LLM support
* [ ] Improved GitHub code analysis
* [ ] Streaming speech recognition
* [ ] Real-time interruption handling
* [ ] More advanced difficulty adaptation
* [ ] Detailed interviewer feedback
* [ ] Candidate performance history
* [ ] Interview analytics dashboard
* [ ] System-design whiteboard mode
* [ ] Docker deployment
* [ ] Production deployment configuration
* [ ] Automated test coverage
* [ ] CI/CD pipeline

---

# 🤝 Contributing

Contributions are welcome.

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes and commit:

```bash
git add .
git commit -m "feat: describe your change"
```

Push the branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request on GitHub.

---

# 📄 License

This project is available under the MIT License.

See the `LICENSE` file for details.

---

# ⭐ Project Vision

Prepwise aims to make technical interview preparation more realistic by shifting the focus from generic questions toward defending the engineering decisions behind projects a candidate actually built.

```text
Real Resume
     +
Real Projects
     +
Real Voice
     +
Local AI
     ↓
Realistic Technical Interview
```

## Prepwise

**Prepare by defending what you built.**
