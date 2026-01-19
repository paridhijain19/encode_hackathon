# 🪷 Saathi - Elder Care & Connection Agent

A meaningful web application that bridges the gap between elderly parents living alone and their adult children who live far away. Saathi helps elderly parents live independently while keeping their children connected, informed, and at peace.

## 🌟 Features

### For Elderly Parents (Simple, Voice-First Interface)

- **🎤 Voice-Based Budget Management** - Just speak to record expenses: "आज 500 रुपये सब्जी में लगे"
- **🎯 Activity Discovery** - Find local yoga classes, bhajan groups, walking clubs, and senior events
- **💊 Gentle Health Reminders** - Medicine schedules, doctor appointments, and wellness tips
- **📞 One-Tap Family Calls** - Simple large buttons to connect with children instantly
- **📸 Easy Photo Sharing** - Take and share photos with family in one tap

### For Adult Children (Peace of Mind Dashboard)

- **📱 Live Activity Feed** - See daily activities: "Mom attended painting class today"
- **💰 Spending Insights** - Track how parents use the money you send
- **🔔 Smart Alerts** - Get notified only when there's something to worry about
- **👥 Family Coordination** - Coordinate with siblings on calls, visits, and responsibilities
- **📊 Health Monitoring** - Track medicine adherence, vitals, and doctor appointments

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hackathon
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
   - `http://localhost:5173` - Landing Page
   - `http://localhost:5173/parent` - Parent Portal
   - `http://localhost:5173/family` - Family Dashboard

## 📁 Project Structure

```
hackathon/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Beautiful landing page
│   │   ├── LandingPage.css      # Landing page styles
│   │   ├── ParentPortal.jsx     # Elder-friendly interface
│   │   ├── ParentPortal.css     # Parent portal styles
│   │   ├── FamilyDashboard.jsx  # Detailed dashboard for children
│   │   └── FamilyDashboard.css  # Dashboard styles
│   ├── components/              # Reusable components
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global design system
├── index.html                   # HTML template
├── package.json                 # Dependencies
└── vite.config.js               # Vite configuration
```

## 🎨 Design Principles

### For Elderly Users
- **Large Text** - Elder-friendly typography (1.375rem base)
- **High Contrast** - Clear, accessible color combinations
- **Simple Navigation** - Bottom navigation with large touch targets
- **Voice-First** - Primary interaction through voice commands
- **Hindi/English** - Bilingual interface with Devanagari script support

### For Adult Children
- **Modern Dashboard** - Professional, data-rich interface
- **Real-time Updates** - Activity feed and smart alerts
- **Actionable Insights** - Clear metrics and recommendations
- **Responsive Design** - Works on desktop and mobile

## 🛠 Tech Stack

- **React 18** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **CSS Variables** - Design tokens and theming

## 🎯 Key Screens

### Landing Page
- Hero section with value proposition
- Feature showcase for both user types
- Testimonials and social proof
- Privacy and autonomy messaging

### Parent Portal
- Home view with quick actions
- Budget tracking with voice input
- Health reminders and medicine schedule
- Activity discovery and booking
- Family connection (calls, photos, messages)

### Family Dashboard
- Wellness score and mood tracking
- Activity timeline
- Budget insights
- Health monitoring
- Alert management
- Family network coordination

## 🔮 Future Enhancements

- [ ] **Voice Recognition Integration** - Real speech-to-text using Web Speech API
- [ ] **Backend API** - Node.js/Express server with database
- [ ] **Real-time Notifications** - Push notifications for alerts
- [ ] **Location Services** - GPS-based activity discovery
- [ ] **Video Calling** - Integrated WebRTC video calls
- [ ] **Multi-language Support** - Additional regional languages
- [ ] **Offline Mode** - Service worker for offline functionality
- [ ] **Mobile Apps** - React Native iOS/Android apps

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ for Indian families
