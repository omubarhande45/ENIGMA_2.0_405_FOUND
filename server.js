const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data store (replace with database in production)
let userProfile = {
  id: 1,
  name: 'Rahul Sharma',
  age: 28,
  gender: 'Male',
  height: 175,
  city: 'Nagpur, Maharashtra',
  wearable: 'Mi Band 6',
  conditions: ['Allergic Rhinitis']
};

let lungTestHistory = [];
let breathingExerciseHistory = [];
let settings = {
  aqiAlerts: true,
  spo2Alerts: true,
  dailyReport: true,
  outdoorWindows: false,
  doctorReminders: true
};

// ===== LUNG CAPACITY API =====

// Calculate predicted lung capacity based on age, gender, height
function calculatePredictedLungCapacity(age, gender, height) {
  let fev1, fvc, pef;
  if (gender === 'Male' || gender === 'male') {
    fev1 = 0.043 * height - 0.029 * age - 2.49;
    fvc = 0.053 * height - 0.037 * age - 3.15;
    pef = 0.060 * height - 0.030 * age - 3.30;
  } else {
    fev1 = 0.032 * height - 0.025 * age - 1.26;
    fvc = 0.040 * height - 0.029 * age - 2.40;
    pef = 0.048 * height - 0.025 * age - 1.80;
  }
  return {
    fev1: Math.max(2.0, fev1),
    fvc: Math.max(2.5, fvc),
    pef: Math.max(4.0, pef)
  };
}

// Assess lung function status
function assessLungFunctionStatus(measured, predicted) {
  const fev1Percent = (measured.fev1 / predicted.fev1) * 100;
  const fvcPercent = (measured.fvc / predicted.fvc) * 100;
  const ratio = (measured.fev1 / measured.fvc) * 100;
  
  let status = 'normal';
  let statusClass = 'good';
  if (fev1Percent < 50) {
    status = 'abnormal';
    statusClass = 'danger';
  } else if (fev1Percent < 80) {
    status = 'mild';
    statusClass = 'warning';
  }
  
  let pattern = 'normal';
  if (ratio < 70) pattern = 'obstructive';
  else if (fvcPercent < 80 && fev1Percent < 80) pattern = 'restrictive';
  
  return {
    fev1Percent: fev1Percent.toFixed(0),
    fvcPercent: fvcPercent.toFixed(0),
    ratio: ratio.toFixed(1),
    status,
    statusClass,
    pattern
  };
}

// API Routes

// Get user profile
app.get('/api/user', (req, res) => {
  res.json(userProfile);
});

// Update user profile
app.put('/api/user', (req, res) => {
  userProfile = { ...userProfile, ...req.body };
  res.json(userProfile);
});

// Get predicted lung capacity
app.get('/api/lung-capacity/predicted', (req, res) => {
  const predicted = calculatePredictedLungCapacity(
    userProfile.age,
    userProfile.gender,
    userProfile.height
  );
  res.json(predicted);
});

// Get current lung metrics (simulated)
app.get('/api/lung-capacity/current', (req, res) => {
  const predicted = calculatePredictedLungCapacity(
    userProfile.age,
    userProfile.gender,
    userProfile.height
  );
  
  // Simulate current readings with some variation
  const variation = 0.9 + Math.random() * 0.2;
  const measured = {
    fev1: parseFloat((predicted.fev1 * variation).toFixed(2)),
    fvc: parseFloat((predicted.fvc * variation).toFixed(2)),
    pef: parseFloat((predicted.pef * variation).toFixed(1))
  };
  
  const assessment = assessLungFunctionStatus(measured, predicted);
  
  res.json({
    measured,
    predicted,
    assessment,
    timestamp: new Date().toISOString()
  });
});

// Save lung test result
app.post('/api/lung-capacity/test', (req, res) => {
  const { fev1, fvc, pef } = req.body;
  
  const predicted = calculatePredictedLungCapacity(
    userProfile.age,
    userProfile.gender,
    userProfile.height
  );
  
  const measured = { fev1, fvc, pef };
  const assessment = assessLungFunctionStatus(measured, predicted);
  
  const result = {
    id: lungTestHistory.length + 1,
    ...measured,
    assessment,
    timestamp: new Date().toISOString()
  };
  
  lungTestHistory.push(result);
  res.json(result);
});

// Get lung test history
app.get('/api/lung-capacity/history', (req, res) => {
  res.json(lungTestHistory);
});

// Save breathing exercise session
app.post('/api/breathing/exercise', (req, res) => {
  const { exerciseType, duration, cycles } = req.body;
  
  const session = {
    id: breathingExerciseHistory.length + 1,
    exerciseType,
    duration,
    cycles,
    timestamp: new Date().toISOString()
  };
  
  breathingExerciseHistory.push(session);
  res.json(session);
});

// Get breathing exercise history
app.get('/api/breathing/history', (req, res) => {
  res.json(breathingExerciseHistory);
});

// Get settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

// Update settings
app.put('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Get AQI data (simulated)
app.get('/api/aqi', (req, res) => {
  const baseAQI = 143;
  const variation = Math.round((Math.random() - 0.5) * 20);
  const aqi = baseAQI + variation;
  
  let status, statusColor;
  if (aqi <= 50) { status = 'Good'; statusColor = '#00e400'; }
  else if (aqi <= 100) { status = 'Moderate'; statusColor = '#ffff00'; }
  else if (aqi <= 150) { status = 'Unhealthy for Sensitive Groups'; statusColor = '#ff7e00'; }
  else if (aqi <= 200) { status = 'Unhealthy'; statusColor = '#ff0000'; }
  else if (aqi <= 300) { status = 'Very Unhealthy'; statusColor = '#8f3f97'; }
  else { status = 'Hazardous'; statusColor = '#7e0023'; }
  
  res.json({
    aqi,
    status,
    statusColor,
    location: userProfile.city,
    pm25: Math.round(aqi * 0.36),
    pm10: Math.round(aqi * 0.66),
    timestamp: new Date().toISOString()
  });
});

// Get health recommendations based on current data
app.get('/api/recommendations', (req, res) => {
  const predicted = calculatePredictedLungCapacity(
    userProfile.age,
    userProfile.gender,
    userProfile.height
  );
  
  const variation = 0.9 + Math.random() * 0.2;
  const measured = {
    fev1: parseFloat((predicted.fev1 * variation).toFixed(2)),
    fvc: parseFloat((predicted.fvc * variation).toFixed(2)),
    pef: parseFloat((predicted.pef * variation).toFixed(1))
  };
  
  const assessment = assessLungFunctionStatus(measured, predicted);
  
  const recommendations = [];
  
  if (assessment.status === 'normal') {
    recommendations.push({
      emoji: '✅',
      title: 'Lung Function Normal',
      text: 'Your lung function is within normal range. Keep up the good work!',
      tags: ['Healthy', 'Maintenance']
    });
  } else if (assessment.status === 'mild') {
    recommendations.push({
      emoji: '⚠️',
      title: 'Mild Lung Function Reduction',
      text: 'Consider consulting a doctor for further evaluation.',
      tags: ['Medical', 'Attention']
    });
  }
  
  recommendations.push({
    emoji: '🧘',
    title: 'Breathing Exercises',
    text: 'Regular breathing exercises can help improve lung capacity.',
    tags: ['Recommended', 'Exercise']
  });
  
  recommendations.push({
    emoji: '😷',
    title: 'Air Quality Awareness',
    text: 'Monitor AQI and use protection in polluted environments.',
    tags: ['Prevention', 'Outdoor']
  });
  
  res.json({
    lungHealth: {
      measured,
      predicted,
      assessment
    },
    recommendations,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PulmoSense API server running on http://localhost:${PORT}`);
});
