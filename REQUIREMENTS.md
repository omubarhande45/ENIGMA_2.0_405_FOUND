# PulmoSense v2.0 - Requirements Document

## 1. Project Overview

**Project Name:** PulmoSense  
**Version:** 2.0  
**Description:** Advanced Lung Health Intelligence Application that combines real-time air quality data with user biometrics to protect respiratory health.  
**Target Users:** Individuals concerned about lung health, asthma patients, and health-conscious users in urban areas.

---

## 2. Tech Stack

### Frontend
- **HTML5** - Main markup
- **CSS3** - Styling (styles.css, lung-capacity.css)
- **JavaScript (ES6+)** - Frontend logic (app.js)
- **Fonts:** Outfit, Space Mono, Lora (Google Fonts)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Middleware:**
  - cors (^2.8.5)
  - body-parser (^1.20.2)

---

## 3. Features

### 3.1 User Onboarding
- Multi-step modal wizard (3 steps)
- Profile setup (age, gender, city, height)
- Medical conditions selection
- Alert preferences configuration

### 3.2 Dashboard
- Real-time AQI display with color-coded status
- Lung Health Index visualization
- Live biometric monitoring (SpO₂, Heart Rate, Respiratory Rate)
- AI Risk Breakdown (Asthma Trigger, COPD Risk, 5yr Lung Damage)
- Pollutant levels (PM2.5, PM10, CO)
- Active alerts system
- 24-hour AQI vs SpO₂ correlation chart

### 3.3 Lung Capacity & Spirometry
- **Spirometry Test:**
  - FEV1 (Forced Expiratory Volume in 1 second)
  - FVC (Forced Vital Capacity)
  - FEV1/FVC Ratio
  - PEF (Peak Expiratory Flow)
  - Predicted values calculation based on age, gender, height
- **History Tab:** Track test results over time
- **Comparison Tab:** Compare personal vs predicted vs population values
- **Achievements Tab:** Gamification with badges and scores
- **Breathing Exercises:**
  - 4-7-8 Relaxation
  - Box Breathing
  - Diaphragm Breathing

### 3.4 AI Assistant
- Chat interface for health queries
- Personalized recommendations based on:
  - Current AQI
  - Lung function data
  - User profile
  - Historical patterns

### 3.5 Settings
- Profile management
- Alert threshold configuration
- Wearable device settings

### 3.6 Notifications Panel
- High AQI alerts
- Safe window opening suggestions
- SpO₂ dip detection alerts

---

## 4. API Endpoints

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get user profile |
| PUT | `/api/user` | Update user profile |

### Lung Capacity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lung-capacity/predicted` | Get predicted lung capacity values |
| GET | `/api/lung-capacity/current` | Get current simulated lung metrics |
| POST | `/api/lung-capacity/test` | Save lung test result |
| GET | `/api/lung-capacity/history` | Get lung test history |

### Breathing Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breathing/exercise` | Save breathing exercise session |
| GET | `/api/breathing/history` | Get breathing exercise history |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update user settings |

### Air Quality
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aqi` | Get current AQI data (simulated) |

### AI Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get AI health recommendations |

---

## 5. Lung Function Assessment

### Predicted Values Calculation
Based on gender and height:

**Male:**
```
FEV1 = 0.043 × height(cm) - 0.029 × age - 2.49
FVC = 0.053 × height(cm) - 0.037 × age - 3.15
PEF = 0.060 × height(cm) - 0.030 × age - 3.30
```

**Female:**
```
FEV1 = 0.032 × height(cm) - 0.025 × age - 1.26
FVC = 0.040 × height(cm) - 0.029 × age - 2.40
PEF = 0.048 × height(cm) - 0.025 × age - 1.80
```

### Assessment Status
| FEV1 % of Predicted | Status | Class |
|---------------------|--------|-------|
| ≥80% | Normal | good |
| 50-79% | Mild Impairment | warning |
| <50% | Abnormal | danger |

### Pattern Detection
| FEV1/FVC Ratio | Pattern |
|----------------|---------|
| <70% | Obstructive |
| <80% (both) | Restrictive |
| ≥70% | Normal |

---

## 6. AQI Categories

| AQI Range | Status | Color |
|-----------|--------|-------|
| 0-50 | Good | #00e400 |
| 51-100 | Moderate | #ffff00 |
| 101-150 | Unhealthy for Sensitive Groups | #ff7e00 |
| 151-200 | Unhealthy | #ff0000 |
| 201-300 | Very Unhealthy | #8f3f97 |
| 301+ | Hazardous | #7e0023 |

---

## 7. Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
```
bash
npm install
```

### Running the Application
```
bash
# Development
npm run dev

# Production
npm start
```

### Default Server
- URL: http://localhost:3000

---

## 8. Dependencies

```
express: ^4.18.2
cors: ^2.8.5
body-parser: ^1.20.2
```

---

## 9. Project Structure

```
/
├── index.html          # Main HTML file
├── server.js           # Express server
├── package.json        # Node dependencies
├── REQUIREMENTS.md     # This file
├── css/
│   ├── styles.css      # Main styles
│   └── lung-capacity.css # Lung capacity specific styles
└── js/
    └── app.js          # Frontend JavaScript
```

---

## 10. Data Storage

- **Current Implementation:** In-memory storage (JavaScript objects)
- **Recommended for Production:**
  - MongoDB for user data and history
  - Redis for real-time AQI caching
  - External AQI API (e.g., IQAir, OpenWeatherMap)

---

## 11. Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 12. Future Enhancements

- [ ] Real AQI API integration
- [ ] User authentication
- [ ] Mobile app (React Native)
- [ ] Wearable device integration
- [ ] Push notifications
- [ ] Email reports
- [ ] Doctor consultation booking
- [ ] Multi-language support

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** PulmoSense Development Team
