# ✨ AXL

### AI-Powered Personal Beauty Intelligence

AXL is an intelligent beauty analysis platform designed to help users understand their appearance through AI-powered facial analysis, personalized insights, and a dedicated personal profile.

> 🧠 **Understand your features. Discover your potential. Build your profile.**

---

## 🚀 Overview

AXL combines artificial intelligence, visual analysis, and personalized user data into one modern beauty intelligence experience.

The platform is built around a simple idea:

**Your appearance is more than a single image — it is a collection of features, preferences, and personal characteristics that can be understood intelligently.**

---

## ✨ Features

- 🧠 **AI-Powered Analysis**  
  Analyze facial characteristics and generate personalized insights.

- 👤 **Personal Profile**  
  Maintain a dedicated profile containing personal appearance information and preferences.

- 📸 **Image Upload & Analysis**  
  Upload images and process them through the analysis pipeline.

- 📊 **Detailed Results**  
  View structured analysis results and personalized information.

- 💾 **Saved History**  
  Securely store and access previous analysis data.

- ☁️ **Supabase Integration**  
  User accounts, profile data, analysis history, and portfolio information are backed by Supabase.

- 🔐 **Google Authentication**  
  Secure account authentication through Google Sign-In.

- 📱 **Modern Responsive UI**  
  Designed for a clean and immersive experience across devices.

---

## 🧬 Core Experience

### 1. 🔐 Sign In

Users authenticate securely using Google Sign-In.

### 2. 🎂 Onboarding

Users complete their initial profile information, including date of birth and personal details.

### 3. 👤 Build Your Profile

Create and maintain a personalized AXL profile with appearance information, preferences, and portfolio content.

### 4. 📸 Upload

Upload an image for AI-powered analysis.

### 5. 🧠 Analyze

AXL processes the uploaded information and generates structured insights.

### 6. 📊 Explore Results

Review the generated analysis and detailed results.

### 7. 💾 Save & Revisit

Authenticated users can retain their profile and analysis history for future access.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| ⚡ Next.js | Web application framework |
| ⚛️ React | User interface |
| 📘 TypeScript | Type-safe development |
| 🎨 Tailwind CSS | Styling and responsive UI |
| 🗄️ Supabase | Authentication, database & storage |
| 🔑 Google OAuth | User authentication |
| 🤖 AI APIs | Intelligent analysis |
| 📦 npm | Package management |

---

## 🏗️ Architecture

AXL follows a modular application architecture designed to keep the platform scalable and maintainable.

```text
AXL
│
├── 🖥️ App
│   ├── Landing
│   ├── Sign In
│   ├── Onboarding
│   ├── Profile
│   ├── Upload
│   ├── Analysis
│   └── Results
│
├── 🧩 Components
│   ├── Landing UI
│   ├── Profile UI
│   ├── Analysis UI
│   └── Onboarding UI
│
├── 🧠 Context
│   ├── Authentication
│   ├── Profile
│   └── Portfolio
│
├── 🗄️ Supabase
│   ├── Database
│   ├── Authentication
│   └── Storage
│
└── ⚙️ Utilities & Services
    ├── File handling
    ├── Reports
    ├── Rate limiting
    └── Data management
