# ⚡ Tempo — Daily Habit Tracker & Focus Chamber

<p align="center">
  <img src="https://img.shields.io/badge/Android-35%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Kotlin-2.0-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white" alt="Kotlin" />
  <img src="https://img.shields.io/badge/Jetpack%20Compose-Latest-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white" alt="Compose" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge" alt="License" />
</p>

---

## 📲 Download & Install the Android APK

### 1. 📦 Direct Hosted Repository Download (Never 404)
The APK binary is committed directly in this repository:

| Repository | Direct Raw Download Link |
|---|---|
| **Tempo-Habit** | [📥 Download tempo-android-release.apk](https://github.com/gianrufin/Tempo-Habit/raw/main/apk/tempo-android-release.apk) |

---

### 2. ⚡ Instant In-App Download
In the live web application, click the **"Get APK"** button in the top bar to download the package directly to your device.

---

### 3. ⚙️ GitHub Actions CI Releases

| Resource | Link | Description |
|---|---|---|
| **GitHub Actions Workflow** | [⚙️ Actions Build Runs](https://github.com/gianrufin/Tempo-Habit/actions) | View automated build status & triggers |
| **GitHub Releases Hub** | [📦 Releases & Tags](https://github.com/gianrufin/Tempo-Habit/releases) | Official GitHub release assets |
| **GitHub Repository** | [📂 Codebase Root](https://github.com/gianrufin/Tempo-Habit) | Repository files and commits |

---

## ✨ Key Features

### 🌅 Chronological Ascending Habit Sequencing
- Habits and routines are dynamically sorted in **ascending order from Morning to Evening** (`Morning (8:00 AM)` &rarr; `Afternoon (1:00 PM)` &rarr; `Evening (6:00 PM)` &rarr; `Night (9:30 PM)` &rarr; `Anytime`).
- Scheduled reminder timestamps automatically position your tasks throughout the day.

### 🔄 In-App OTA Update Engine
- **Direct GitHub Releases Sync**: Check for new application versions in **Settings &gt; Android & GitHub Updates**.
- **In-App Package Downloader & Installer**: Downloads the APK package in real-time with download speed indicators and triggers direct installation without leaving the app.

### ⏱️ Focus Chamber & Sound Synthesizer
- Multi-mode focus timer: **Pomodoro** (Focus / Short Break / Long Break), **Countdown Timer**, and **Stopwatch**.
- Synthetic audio chime engine (Golden Hour, Aura Ping, Crystal Fizz, Deep Zen) with volume modulation.

### 📊 Streak Analytics & Matrix Heatmaps
- Interactive 52-week streak heatmap with completion velocity and consistency metrics.
- Habit-level and daily mood correlation breakdowns.

---

## 🛠️ Tech Stack & Architecture

- **Mobile Shell**: Native Android container with hardware-accelerated WebView rendering (`MainActivity.kt`).
- **Frontend App**: React 18, TypeScript, Tailwind CSS, Lucide icons, Motion animations.
- **Synthesizer Engine**: Web Audio API oscillator synthesis.
- **Persistence**: LocalStorage with schema validation and export/import backup engine.
- **CI / CD**: Automated GitHub Actions APK build workflow (`.github/workflows/build-debug-apk.yml`).

---

## 🚀 Building & Running Locally

### Web Development
\`\`\`bash
npm install
npm run dev
\`\`\`

### Android APK Build
\`\`\`bash
# Build web bundle into Android assets
npm run build

# Build Android APK using Gradle
./gradlew assembleDebug
\`\`\`
