# 🍳 SmartChef AI

SmartChef AI is a modern, AI-powered cooking assistant designed to transform the way people cook, discover recipes, and share food experiences. Built with a focus on simplicity, personalization, and community, the platform helps users turn everyday ingredients into delicious meals while connecting them with a social ecosystem of food creators.

---

## 🚀 Overview

SmartChef AI combines artificial intelligence with social interaction to create a complete cooking platform. Users can scan ingredients, generate personalized recipes, follow step-by-step cooking guidance, and share their creations through posts and short-form videos.

The platform is designed especially with Indian users in mind, offering localized recipes, budget-aware grocery suggestions, and region-based recommendations.

---

## ✨ Key Features

### 🧠 AI Recipe Generation

* Generate recipes based on available ingredients
* Supports dietary filters (veg/non-veg, calories, time, budget)
* Focus on Indian and regional cuisines

### 📸 Ingredient Scanner

* Detect ingredients using image upload or camera
* Editable ingredient list for flexibility

### 📍 Location-Based Suggestions

* Discover popular dishes based on your region
* “Trending near you” recommendations

### 🛒 Smart Grocery & Cost Calculator

* Auto-generate missing ingredients
* Estimate costs based on local pricing
* Exportable grocery lists

### 🍲 Cooking Mode

* Step-by-step guided cooking interface
* Timer-based instructions
* Hands-free friendly experience

### 🤝 Social Sharing (Posts & Reels)

* Share recipes via posts (images/videos)
* Create and explore short cooking reels
* Like, comment, save, and follow users

### 🔥 Streaks & Rewards

* Daily cooking streak tracking
* Earn points and unlock achievements
* Gamified experience to encourage consistency

### ⭐ Community Recipes & Ratings

* Explore recipes shared by users
* Ratings, reviews, and trending content
* Discover top creators

---

## 🎯 Vision

SmartChef AI aims to go beyond being just a recipe generator. It is built to become a **smart kitchen companion + social platform**, helping users cook smarter, reduce food waste, and stay inspired through a vibrant food community.

---

## 🛠️ Tech Stack

* **Frontend:** React + Vite, Tailwind CSS, shadcn/ui, Framer Motion
* **Backend:** Node.js + Express (single service serves both the API and the built UI)
* **Search:** Custom TF-IDF retrieval model over 5,999 Indian recipes (`server/model/recipe-model.json`, built via `npm run train`)
* **AI integration:** OpenAI / Moondream vision API for ingredient photo recognition (`/api/recognize`, configured via `server/.env`)

---

## 🚢 Deployment

The project ships as a single deployable Node service. The Express backend serves the API **and** the built frontend, so one container/process handles everything.

### Locally

```bash
npm install
npm run build   # compile the UI into dist/
npm start       # serves http://localhost:3001 (API + UI)
```

### Docker

```bash
docker build -t smart-chef-ai .
docker run -p 3001:3001 --env-file server/.env smart-chef-ai
```

Runtime needs:

| Setting | Required | Purpose |
| --- | --- | --- |
| `PORT` | optional (default `3001`) | HTTP port for the service |
| `OPENAI_API_KEY` | if using photo scan | OpenAI vision recognition |
| `MOONDREAM_API_KEY` | if using photo scan | Moondream vision recognition |
| `VISION_PROVIDER` | optional | `moondream` (default) or `openai` |

`server/.env.example` documents every variable. Set them as environment variables on your host — do not commit secrets.

---

## 📱 Design Philosophy

* Minimal, clean, and intuitive UI
* Soft neutral color palette with modern typography
* Mobile-first and highly responsive
* Smooth animations and micro-interactions

---

## 💡 Future Scope

* Advanced personalization using user taste profiles
* Real-time voice cooking assistant
* Integration with grocery delivery services
* AI-powered nutrition tracking
* Creator monetization features

---

## 🤝 Contributing

Contributions, ideas, and feedback are always welcome!
Feel free to fork the repo and submit a pull request.

---

## 📌 Note

This project is built as a step towards creating a scalable AI + social food platform. It is continuously evolving with new features and improvements.

---
