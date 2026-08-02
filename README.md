# 🌿 Evora

**Your AI Health Companion, For Every Phase of You**

Evora is a digital health companion for menstrual health, wellness
tracking, and personalized insights, built for **Girls Hack Day**
(Women's Health & Wellness track).

Most period trackers show you a calendar. Most AI chatbots know nothing
about you. Evora is built on a simple idea: an AI companion is only as
good as the real data behind it. Every insight, every chat response,
and every phase description in Evora is grounded in your actual logged
data, not generic advice, not guesswork.

---

## ✨ Features

### 🩸 Cycle Tracking
- Interactive circular cycle wheel: drag to preview any day's phase
  without leaving the dashboard
- Adaptive period prediction that improves as real cycles are logged,
  instead of relying on a static number from onboarding forever
- Directly editable period-flow calendar (spotting, light, medium, heavy)

### 🤖 AI Companion
- Powered by the Gemini API, with real context injection: your current
  cycle phase, recent symptoms, mood, and short-term chat history are
  fed into every response
- Persistent chat history
- Customizable companion name

### 💡 Daily Insights
- Phase-based nutrition, mindfulness, and movement tips, generated from
  your actual current cycle phase rather than static/mock content
- A daily wellness snapshot summarizing today's sleep, hydration, and
  activity at a glance

### 📊 Insights & Trend Analysis
- Real computed cycle stats (average length, variation, shortest/
  longest) and pattern detection, not AI-generated guesses
- Per-category trend graphs (mood, energy, sleep, hydration, cramps,
  flow) with 7-day and monthly views, rendering as soon as any real data
  exists

### 📝 Log Symptoms
- One unified logging system across the app: mood, cramps, PMS, sleep,
  hydration, energy, and flow
- Customizable categories, so users only track what matters to them

### 📚 Library
- Articles on topics like period-related back pain, sleep, UTIs,
  nutrition, and mood
- Embedded videos alongside written content

### 🔔 Reminders & Notifications
- Period, hydration, and custom reminders with flexible scheduling
  (relative to period, repeating interval, or fixed time)
- A real notifications inbox reflecting what's actually due right now

### 🔒 Privacy by Design
- Row Level Security on every table: your data is yours, enforced at
  the database level, not just the UI
- A real "delete my data" option to start fresh at any time

### 🌗 Light & Dark Themes
Full theme support with a palette designed for warmth, not another
generic SaaS dashboard look.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Forms | react-hook-form |
| Dates | date-fns |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| AI | Google Gemini API (`@google/genai`) |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com) project
- A [Gemini API](https://ai.google.dev) key

### 1. Clone & install
```bash
git clone https://github.com/<your-username>/evora.git
cd evora
npm install
```

### 2. Environment variables
Create a `.env.local` file in the project root:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set up the database
Run the schema migrations in your Supabase SQL editor (see
`/supabase/schema.sql` if included, or set up the following tables:
`profiles`, `cycle_settings`, `period_logs`, `symptom_logs`,
`chat_messages`, `reminders`, `wellness_tips`) with Row Level Security
enabled on each.

### 4. Run locally
```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── lib/              # Supabase client, utility functions
├── pages/            # Route-level pages (Dashboard, Chat, Insights, Library, Account, etc.)
├── components/       # Shared UI components
└── App.tsx
```

---

## 🗺️ Roadmap

- [ ] Expand beyond menstrual health to PCOS, UTI, and menopause support
- [ ] Native mobile app / PWA install support
- [ ] Google OAuth polish
- [ ] Community-sourced safety/wellness content

---

## 🙋 About This Project

Built for **Girls Hack Day**, Delhi, by **Snap Code** (solo team), under
the **Women's Health & Wellness** track, addressing the problem
statement:
"Develop a digital health companion for menstrual health, wellness
tracking, and personalized insights."

---

## 📄 License

This project is currently unlicensed / for hackathon submission
purposes. Update this section if you decide to open-source it.
