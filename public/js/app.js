// ===== API CONFIGURATION =====
const API_BASE = 'http://localhost:3000/api';

// ===== NAVIGATION =====
function navigate(page, el){
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-'+page).classList.add('active');
  el.classList.add('active');
  const titles = {dashboard:'Dashboard',map:'AQI Map',timeline:'Exposure Timeline',public:'Public Health',ai:'AI Assistant',settings:'Settings'};
  document.getElementById('page-title-display').textContent = titles[page] || page;
  document.getElementById('breadcrumb-current').textContent = titles[page] || page;
}

// ===== API HELPERS =====
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    return null;
  }
}

// ===== ONBOARDING =====
let currentStep = 1;
async function nextStep(){
  if(currentStep < 3){
    document.getElementById('step-'+currentStep).classList.remove('active');
    currentStep++;
    document.getElementById('step-'+currentStep).classList.add('active');
    updateProgress();
    if(currentStep===3) document.getElementById('modal-next-btn').textContent = 'Launch Dashboard ✓';
  } else {
    document.getElementById('onboarding').classList.add('hidden');
    startAnimations();
    // Fetch initial data from API
    await loadDashboardData();
  }
}
function prevStep(){
  if(currentStep > 1){
    document.getElementById('step-'+currentStep).classList.remove('active');
    currentStep--;
    document.getElementById('step-'+currentStep).classList.add('active');
    updateProgress();
    document.getElementById('modal-next-btn').textContent = 'Get Started →';
  }
}
function updateProgress(){
  [1,2,3].forEach(i=>{
    const d = document.getElementById('pd'+i);
    d.classList.toggle('active', i<=currentStep);
  });
}

// ===== DASHBOARD DATA =====
async function loadDashboardData() {
  try {
    // Load AQI data
    const aqiData = await fetchAPI('/aqi');
    if (aqiData) {
      document.getElementById('aqi-display').textContent = aqiData.aqi;
      document.getElementById('kpi-aqi').textContent = aqiData.aqi;
    }
    
    // Load lung capacity data
    const lungData = await fetchAPI('/lung-capacity/current');
    if (lungData) {
      updateLungDisplay(lungData);
    }
    
    // Load recommendations
    const recs = await fetchAPI('/recommendations');
    if (recs) {
      updateRecommendations(recs.recommendations);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function updateLungDisplay(data) {
  const { measured, predicted, assessment } = data;
  
  const fev1El = document.getElementById('metric-fev1');
  if (fev1El) {
    fev1El.textContent = measured.fev1.toFixed(2) + ' L';
    fev1El.className = 'lung-metric-value ' + assessment.statusClass;
  }
  
  const fvcEl = document.getElementById('metric-fvc');
  if (fvcEl) {
    fvcEl.textContent = measured.fvc.toFixed(2) + ' L';
    fvcEl.className = 'lung-metric-value ' + assessment.statusClass;
  }
  
  const ratioEl = document.getElementById('metric-ratio');
  if (ratioEl) {
    ratioEl.textContent = assessment.ratio + '%';
    ratioEl.className = 'lung-metric-value ' + assessment.statusClass;
  }
  
  const pefEl = document.getElementById('metric-pef');
  if (pefEl) {
    pefEl.textContent = measured.pef.toFixed(1) + ' L/s';
    pefEl.className = 'lung-metric-value good';
  }
  
  const statusEl = document.getElementById('lung-status');
  if (statusEl) {
    statusEl.textContent = assessment.status === 'normal' ? 'Normal' : assessment.status === 'mild' ? 'Mild Impairment' : 'Abnormal';
    statusEl.className = 'lung-metric-status ' + assessment.statusClass;
  }
  
  // Update predicted values
  const predFev1 = document.getElementById('pred-fev1');
  if (predFev1) predFev1.textContent = predicted.fev1.toFixed(2) + ' L';
  
  const predFvc = document.getElementById('pred-fvc');
  if (predFvc) predFvc.textContent = predicted.fvc.toFixed(2) + ' L';
  
  const predPef = document.getElementById('pred-pef');
  if (predPef) predPef.textContent = predicted.pef.toFixed(1) + ' L/s';
}

function updateRecommendations(recommendations) {
  // Update AI recommendations section if needed
  console.log('Recommendations loaded:', recommendations);
}

// ===== ANIMATIONS =====
function startAnimations(){
  let v = 0;
  const el = document.getElementById('lhi-animated');
  const iv = setInterval(()=>{ v+=2; el.textContent=v; if(v>=82) clearInterval(iv); }, 20);

  setTimeout(()=>{
    document.getElementById('risk1').style.width='34%';
    document.getElementById('risk2').style.width='12%';
    document.getElementById('risk3').style.width='22%';
  }, 400);

  setTimeout(()=>{
    document.querySelectorAll('.poll-fill').forEach(el=>{
      el.style.width = el.dataset.w + '%';
    });
  }, 600);

  drawChart();

  // Live AQI updates from API
  setInterval(async () => {
    const aqiData = await fetchAPI('/aqi');
    if (aqiData) {
      document.getElementById('aqi-display').textContent = aqiData.aqi;
      document.getElementById('kpi-aqi').textContent = aqiData.aqi;
    }
  }, 10000); // Update every 10 seconds

  // Live wearable simulation
  setInterval(()=>{
    const spo2 = (97.5 + Math.random()*1.2).toFixed(1);
    document.getElementById('spo2-live').textContent = spo2 + '%';
    const hr = Math.round(70 + Math.random()*6);
    document.getElementById('hr-live').textContent = hr;
    const rr = Math.round(15 + Math.random()*3);
    document.getElementById('rr-live').textContent = rr + '/m';
  }, 3500);
}

// ===== CHART =====
const aqiDataPts = [45,42,48,52,58,55,45,78,95,88,102,118,134,141,189,143,130,110,90,78,82,75,68,55];

function drawChart(){
  const svg = document.getElementById('main-chart');
  const w = 800, h = 140;
  const maxV = 220;
  const pts = aqiDataPts.map((v,i)=>({
    x: 25 + i*(w-40)/23,
    y: h - 10 - (v/maxV)*(h-20)
  }));

  const areaPath = `M${pts[0].x},${h-5} ${pts.map(p=>`L${p.x},${p.y}`).join(' ')} L${pts[pts.length-1].x},${h-5} Z`;

  const aqiLine = document.getElementById('aqi-line');
  if(aqiLine) aqiLine.setAttribute('d','M'+pts.map(p=>`${p.x},${p.y}`).join(' L'));
  const aqiArea = document.getElementById('aqi-area');
  if(aqiArea) aqiArea.setAttribute('d', areaPath);

  const spo2Pts = aqiDataPts.map((v,i)=>{
    const spo = 99 - (v/200)*4;
    return { x: 25 + i*(w-40)/23, y: h - 10 - ((spo-90)/10)*(h-20) };
  });
  const spo2Line = 'M'+spo2Pts.map(p=>`${p.x},${p.y}`).join(' L');
  
  const spo2LineEl = document.getElementById('spo2-line');
  if(spo2LineEl) spo2LineEl.setAttribute('d', spo2Line);
  
  const spo2AreaEl = document.getElementById('spo2-area');
  if(spo2AreaEl) spo2AreaEl.setAttribute('d', `M${spo2Pts[0].x},${h-5} ${spo2Pts.map(p=>`L${p.x},${p.y}`).join(' ')} L${spo2Pts[spo2Pts.length-1].x},${h-5} Z`);

  const currentDot = document.getElementById('current-dot');
  if(currentDot && pts[15]) {
    currentDot.setAttribute('cx', pts[15].x);
    currentDot.setAttribute('cy', pts[15].y);
  }
}

// ===== NOTIFICATIONS =====
function toggleNotif(){
  document.getElementById('notif-panel').classList.toggle('open');
}

// ===== AI CHAT =====
const aiResponses = {
  "health risk today": "Based on today's data from the server:<br><br>🔴 <strong>AQI</strong> — Checked from live API<br>📉 Your SpO₂ readings are being monitored<br>⚠️ AI Risk Score is calculated based on your lung health data",
  "go for a run": "❌ <strong>Not recommended right now.</strong><br><br>Current AQI data shows elevated pollution levels. During exercise, you breathe 10-20× more air per minute.<br><br>✅ <strong>Best window:</strong> Check back later for cleaner air conditions.",
  "inhaler": "Based on your profile and wearable data:<br><br>• Your lung health data is stored on the server<br>• Regular monitoring helps track your condition<br>• Consult your doctor for personalized advice"
};

function sendSuggestion(el){
  const text = el.textContent.replace(/^[^\s]*\s/, '');
  document.getElementById('chat-input').value = text;
  sendMessage();
}

async function sendMessage(){
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;

  const msgs = document.getElementById('chat-msgs');

  const userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.innerHTML = '<div class="msg-bubble">'+text+'</div><div class="msg-time">'+new Date().toLocaleTimeString()+'</div>';
  msgs.appendChild(userMsg);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  const typing = document.createElement('div');
  typing.className = 'msg bot';
  typing.innerHTML = '<div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  // Get AI recommendations from API
  const recData = await fetchAPI('/recommendations');
  let response = "I've analyzed your health data from the server. Your lung function readings are within the normal range. Is there something specific about your lung health you'd like me to explain?";
  
  const lowerText = text.toLowerCase();
  for(const [key, val] of Object.entries(aiResponses)){
    if(lowerText.includes(key.split(' ')[0]) || lowerText.includes(key)){
      response = val; break;
    }
  }

  setTimeout(()=>{
    typing.remove();
    const botMsg = document.createElement('div');
    botMsg.className = 'msg bot';
    botMsg.innerHTML = '<div class="msg-bubble">'+response.replace(/\n/g,'<br>')+'</div><div class="msg-time">PulmoSense AI · '+new Date().toLocaleTimeString()+'</div>';
    msgs.appendChild(botMsg);
    msgs.scrollTop = msgs.scrollHeight;
  }, 1200 + Math.random()*800);
}

// ===== SETTINGS TABS =====
function setSettingsTab(el){
  document.querySelectorAll('.settings-nav-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
}

// ===== CHART MODE =====
function setChartMode(mode, btn){ drawChart(); }

// ===== LUNG CAPACITY FUNCTIONS =====

function drawSpirometryChart() {
  var svg = document.getElementById('spirometry-svg');
  if (!svg) return;
  var width = svg.viewBox.baseVal.width || 500;
  var height = svg.viewBox.baseVal.height || 180;
  var padding = { top: 20, right: 30, bottom: 30, left: 40 };
  var timePoints = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
  var normalCurve = timePoints.map(function(t) { return 4.5 * (1 - Math.exp(-t / 0.9)); });
  var patientCurve = timePoints.map(function(t) { return 4.18 * (1 - Math.exp(-t / 1.1)); });
  var maxVolume = 5;
  var xScale = function(t) { return padding.left + (t / 6) * (width - padding.left - padding.right); };
  var yScale = function(v) { return height - padding.bottom - (v / maxVolume) * (height - padding.top - padding.bottom); };
  var normalPath = 'M ' + xScale(0) + ' ' + yScale(0);
  var patientPath = 'M ' + xScale(0) + ' ' + yScale(0);
  timePoints.forEach(function(t, i) { normalPath += ' L ' + xScale(t) + ' ' + yScale(normalCurve[i]); patientPath += ' L ' + xScale(t) + ' ' + yScale(patientCurve[i]); });
  var normalLine = document.getElementById('spirometry-normal-line');
  var patientLine = document.getElementById('spirometry-patient-line');
  if (normalLine) normalLine.setAttribute('d', normalPath);
  if (patientLine) patientLine.setAttribute('d', patientPath);
  var normalArea = 'M ' + xScale(0) + ' ' + yScale(0);
  var patientArea = 'M ' + xScale(0) + ' ' + yScale(0);
  timePoints.forEach(function(t, i) { normalArea += ' L ' + xScale(t) + ' ' + yScale(normalCurve[i]); patientArea += ' L ' + xScale(t) + ' ' + yScale(patientCurve[i]); });
  normalArea += ' L ' + xScale(6) + ' ' + yScale(0) + ' Z';
  patientArea += ' L ' + xScale(6) + ' ' + yScale(0) + ' Z';
  var normalAreaEl = document.getElementById('spirometry-normal-area');
  var patientAreaEl = document.getElementById('spirometry-patient-area');
  if (normalAreaEl) normalAreaEl.setAttribute('d', normalArea);
  if (patientAreaEl) patientAreaEl.setAttribute('d', patientArea);
  var fev1Dot = document.getElementById('spirometry-fev1-dot');
  if (fev1Dot) { fev1Dot.setAttribute('cx', xScale(1)); fev1Dot.setAttribute('cy', yScale(patientCurve[2])); }
  var peakDot = document.getElementById('spirometry-peak-dot');
  if (peakDot) { var peakIdx = patientCurve.indexOf(Math.max.apply(Math, patientCurve)); peakDot.setAttribute('cx', xScale(timePoints[peakIdx])); peakDot.setAttribute('cy', yScale(patientCurve[peakIdx])); }
}

// ===== LUNG CAPACITY TEST =====
var lungTestState = { isRunning: false, currentVolume: 0, maxVolume: 0, elapsedTime: 0, intervalId: null, testData: [] };

function openLungTest() { document.getElementById('lung-test-modal').classList.remove('hidden'); initLungTest(); }
function closeLungTest() { document.getElementById('lung-test-modal').classList.add('hidden'); resetLungTest(); }

function initLungTest() {
  lungTestState.isRunning = false;
  lungTestState.currentVolume = 0;
  lungTestState.maxVolume = 0;
  lungTestState.elapsedTime = 0;
  lungTestState.testData = [];
  updateLungTestDisplay();
  document.getElementById('lung-test-start-btn').disabled = false;
  document.getElementById('lung-test-stop-btn').disabled = true;
  document.getElementById('lung-test-reset-btn').disabled = true;
  document.getElementById('lung-test-results').style.display = 'none';
}

async function startLungTest() {
  if (lungTestState.isRunning) return;
  lungTestState.isRunning = true;
  document.getElementById('lung-test-start-btn').disabled = true;
  document.getElementById('lung-test-stop-btn').disabled = false;
  
  // Get predicted values from API
  const predictedData = await fetchAPI('/lung-capacity/predicted');
  const predicted = predictedData || { fvc: 4.2, fev1: 3.6 };
  
  var targetVolume = predicted.fvc * 0.9 + (Math.random() * 0.3);
  
  lungTestState.intervalId = setInterval(function() {
    lungTestState.elapsedTime += 0.1;
    var t = lungTestState.elapsedTime;
    if (t < 2) lungTestState.currentVolume = targetVolume * (1 - Math.exp(-t * 2));
    else if (t < 4) lungTestState.currentVolume = targetVolume;
    else lungTestState.currentVolume = targetVolume * Math.exp(-(t - 4) * 1.5);
    lungTestState.testData.push({ time: lungTestState.elapsedTime, volume: lungTestState.currentVolume });
    if (lungTestState.currentVolume > lungTestState.maxVolume) lungTestState.maxVolume = lungTestState.currentVolume;
    if (lungTestState.elapsedTime >= 6) { stopLungTest(); calculateTestResults(); }
    updateLungTestDisplay();
  }, 100);
}

function stopLungTest() {
  lungTestState.isRunning = false;
  if (lungTestState.intervalId) { clearInterval(lungTestState.intervalId); lungTestState.intervalId = null; }
  document.getElementById('lung-test-start-btn').disabled = true;
  document.getElementById('lung-test-stop-btn').disabled = true;
  document.getElementById('lung-test-reset-btn').disabled = false;
}

function resetLungTest() { initLungTest(); }

function updateLungTestDisplay() {
  var volumeEl = document.getElementById('lung-test-volume-display');
  var timerEl = document.getElementById('lung-test-timer-display');
  var barEl = document.getElementById('lung-test-volume-bar');
  if (volumeEl) volumeEl.textContent = lungTestState.currentVolume.toFixed(2);
  if (timerEl) { timerEl.textContent = lungTestState.elapsedTime.toFixed(1) + 's'; timerEl.className = lungTestState.isRunning ? 'lung-test-timer running' : 'lung-test-timer'; }
  var percentage = (lungTestState.currentVolume / 4.5) * 100;
  if (barEl) barEl.style.height = Math.min(100, percentage) + '%';
}

async function calculateTestResults() {
  if (lungTestState.testData.length === 0) return;
  
  var fev1 = 0;
  for (var i = 0; i < lungTestState.testData.length; i++) { 
    if (lungTestState.testData[i].time >= 1) { 
      fev1 = lungTestState.testData[i].volume; 
      break; 
    } 
  }
  var fvc = lungTestState.maxVolume;
  var pef = 0;
  for (var j = 1; j < lungTestState.testData.length; j++) { 
    var dt = lungTestState.testData[j].time - lungTestState.testData[j-1].time; 
    if (dt > 0) { 
      var flow = (lungTestState.testData[j].volume - lungTestState.testData[j-1].volume) / dt; 
      if (flow > pef) pef = flow; 
    } 
  }
  var ratio = (fev1 / fvc) * 100;
  
  // Save to API
  const result = await fetchAPI('/lung-capacity/test', {
    method: 'POST',
    body: JSON.stringify({ fev1, fvc, pef })
  });
  console.log('Test saved:', result);
  
  document.getElementById('test-result-fev1').textContent = fev1.toFixed(2) + ' L';
  document.getElementById('test-result-fev1').className = 'lung-test-result-value good';
  document.getElementById('test-result-fvc').textContent = fvc.toFixed(2) + ' L';
  document.getElementById('test-result-fvc').className = 'lung-test-result-value good';
  document.getElementById('test-result-ratio').textContent = ratio.toFixed(1) + '%';
  document.getElementById('test-result-ratio').className = 'lung-test-result-value ' + (ratio < 70 ? 'danger' : 'good');
  document.getElementById('test-result-pef').textContent = Math.max(0, pef).toFixed(1) + ' L/s';
  document.getElementById('test-result-pef').className = 'lung-test-result-value good';
  
  document.getElementById('lung-test-results').style.display = 'block';
}

// ===== MODERN LUNG CAPACITY FEATURES =====

function switchLungTab(tabName, btn) {
  document.querySelectorAll('.lung-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.lung-tab-content').forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('lung-tab-' + tabName).classList.add('active');
  
  if (tabName === 'spirometry') {
    setTimeout(function() { drawSpirometryChart(); }, 100);
  } else if (tabName === 'history') {
    loadHistoryData();
  }
}

async function loadHistoryData() {
  const history = await fetchAPI('/lung-capacity/history');
  if (history && history.length > 0) {
    drawHistoryChart(history);
  }
}

function drawHistoryChart(history) {
  var fev1Line = document.getElementById('history-fev1-line');
  var fvcLine = document.getElementById('history-fvc-line');
  if (!fev1Line || !fvcLine) return;
  
  var width = 540;
  var height = 130;
  var padding = 40;
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  var fev1Data = history.slice(-7).map(h => h.fev1);
  var fvcData = history.slice(-7).map(h => h.fvc);
  
  // Pad if not enough data
  while (fev1Data.length < 7) fev1Data.unshift(fev1Data[0] || 3.2);
  while (fvcData.length < 7) fvcData.unshift(fvcData[0] || 4.0);
  
  var maxVal = 4.5;
  var minVal = 2.5;
  
  var xScale = function(i) { return padding + (i / (months.length - 1)) * (width - padding); };
  var yScale = function(v) { return height - padding - ((v - minVal) / (maxVal - minVal)) * (height - 2 * padding); };
  
  var fev1Path = 'M ' + xScale(0) + ' ' + yScale(fev1Data[0]);
  var fvcPath = 'M ' + xScale(0) + ' ' + yScale(fvcData[0]);
  
  fev1Data.forEach(function(v, i) { if (i > 0) fev1Path += ' L ' + xScale(i) + ' ' + yScale(v); });
  fvcData.forEach(function(v, i) { if (i > 0) fvcPath += ' L ' + xScale(i) + ' ' + yScale(v); });
  
  fev1Line.setAttribute('d', fev1Path);
  fvcLine.setAttribute('d', fvcPath);
}

// Breathing Exercises
var breathingState = { isRunning: false, isPaused: false, currentExercise: '4-7-8', cycle: 1, maxCycles: 5, timer: 0, intervalId: null, voiceEnabled: true };
var breathingPatterns = {
  '4-7-8': { inhale: 4, hold: 7, exhale: 8, description: '<strong>4-7-8 Breathing:</strong> Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds.' },
  'box': { inhale: 4, hold: 4, exhale: 4, holdAfter: 4, description: '<strong>Box Breathing:</strong> Inhale 4s, hold 4s, exhale 4s, hold 4s.' },
  'diaphragm': { inhale: 4, hold: 2, exhale: 6, description: '<strong>Diaphragm Breathing:</strong> Deep belly breaths to strengthen diaphragm.' }
};

function openBreathingExercises() { document.getElementById('breathing-exercises-modal').classList.remove('hidden'); initBreathingExercise(); }
function closeBreathingExercises() { document.getElementById('breathing-exercises-modal').classList.add('hidden'); stopBreathingExercise(); }

function initBreathingExercise() {
  breathingState.isRunning = false;
  breathingState.isPaused = false;
  breathingState.cycle = 1;
  breathingState.timer = 0;
  if (breathingState.intervalId) { clearInterval(breathingState.intervalId); breathingState.intervalId = null; }
  updateBreathingDisplay();
  document.getElementById('breathing-start-btn').disabled = false;
  document.getElementById('breathing-pause-btn').disabled = true;
  document.getElementById('breathing-stop-btn').disabled = true;
}

function selectBreathingExercise(exercise, btn) {
  document.querySelectorAll('.breathing-exercise-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  breathingState.currentExercise = exercise;
  document.getElementById('breathing-description').innerHTML = breathingPatterns[exercise].description;
  initBreathingExercise();
}

function startBreathingExercise() {
  if (breathingState.isRunning) return;
  breathingState.isRunning = true;
  breathingState.isPaused = false;
  document.getElementById('breathing-start-btn').disabled = true;
  document.getElementById('breathing-pause-btn').disabled = false;
  document.getElementById('breathing-stop-btn').disabled = false;
  
  var currentPhase = 'inhale';
  var phaseTimer = 0;
  
  breathingState.intervalId = setInterval(function() {
    breathingState.timer += 0.1;
    phaseTimer += 0.1;
    
    var circle = document.getElementById('breathing-circle');
    var instruction = document.getElementById('breathing-instruction');
    var pattern = breathingPatterns[breathingState.currentExercise];
    
    if (currentPhase === 'inhale') {
      if (phaseTimer >= pattern.inhale) {
        currentPhase = 'hold';
        phaseTimer = 0;
        speak('Hold');
      }
      var progress = phaseTimer / pattern.inhale;
      circle.style.transform = 'scale(' + (1 + progress * 0.3) + ')';
      instruction.textContent = 'Breathe In';
    } else if (currentPhase === 'hold') {
      var holdTime = pattern.hold || pattern.holdAfter;
      if (phaseTimer >= holdTime) {
        currentPhase = 'exhale';
        phaseTimer = 0;
        speak('Breathe out');
      }
      instruction.textContent = 'Hold';
    } else if (currentPhase === 'exhale') {
      if (phaseTimer >= pattern.exhale) {
        if (breathingState.cycle >= breathingState.maxCycles) {
          stopBreathingExercise();
          saveBreathingSession();
          speak('Exercise complete');
          return;
        }
        breathingState.cycle++;
        currentPhase = 'inhale';
        phaseTimer = 0;
        speak('Breathe in');
      }
      var progress = phaseTimer / pattern.exhale;
      circle.style.transform = 'scale(' + (1.3 - progress * 0.3) + ')';
      instruction.textContent = 'Breathe Out';
    }
    
    updateBreathingDisplay();
  }, 100);
}

async function saveBreathingSession() {
  await fetchAPI('/breathing/exercise', {
    method: 'POST',
    body: JSON.stringify({
      exerciseType: breathingState.currentExercise,
      duration: breathingState.timer,
      cycles: breathingState.maxCycles
    })
  });
}

function pauseBreathingExercise() {
  if (breathingState.isPaused) {
    breathingState.isPaused = false;
    document.getElementById('breathing-pause-btn').textContent = '⏸ Pause';
    startBreathingExercise();
  } else {
    breathingState.isPaused = true;
    if (breathingState.intervalId) { clearInterval(breathingState.intervalId); breathingState.intervalId = null; }
    document.getElementById('breathing-pause-btn').textContent = '▶ Resume';
  }
}

function stopBreathingExercise() {
  breathingState.isRunning = false;
  breathingState.isPaused = false;
  if (breathingState.intervalId) { clearInterval(breathingState.intervalId); breathingState.intervalId = null; }
  document.getElementById('breathing-start-btn').disabled = false;
  document.getElementById('breathing-pause-btn').disabled = true;
  document.getElementById('breathing-stop-btn').disabled = true;
  document.getElementById('breathing-pause-btn').textContent = '⏸ Pause';
  document.getElementById('breathing-circle').style.transform = 'scale(1)';
  document.getElementById('breathing-instruction').textContent = 'Ready';
}

function updateBreathingDisplay() {
  var minutes = Math.floor(breathingState.timer / 60);
  var seconds = Math.floor(breathingState.timer % 60);
  document.getElementById('breathing-timer').textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  document.getElementById('breathing-cycle').textContent = 'Cycle ' + breathingState.cycle + '/' + breathingState.maxCycles;
}

function toggleBreathingVoice() {
  breathingState.voiceEnabled = !breathingState.voiceEnabled;
  document.getElementById('breathing-voice-toggle').classList.toggle('on', breathingState.voiceEnabled);
}

function speak(text) {
  if (!breathingState.voiceEnabled || !window.speechSynthesis) return;
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// AI Recommendations
async function getAIRecommendation() {
  document.getElementById('ai-recommendation-modal').classList.remove('hidden');
  
  const data = await fetchAPI('/lung-capacity/current');
  if (!data) {
    document.getElementById('ai-recommendation-body').innerHTML = '<p>Error loading data from server</p>';
    return;
  }
  
  const { measured, predicted, assessment } = data;
  
  var html = '<div class="ai-recommendation-section">';
  html += '<div class="ai-recommendation-score">';
  html += '<div class="ai-score-label">Overall Lung Health</div>';
  html += '<div class="ai-score-value ' + assessment.statusClass + '">' + assessment.fev1Percent + '%</div>';
  html += '<div class="ai-score-status">' + (assessment.status === 'normal' ? 'Healthy' : 'Needs Attention') + '</div>';
  html += '</div>';
  
  html += '<div class="ai-recommendation-metrics">';
  html += '<div class="ai-metric"><span>FEV1</span><span>' + measured.fev1.toFixed(2) + 'L / ' + predicted.fev1.toFixed(2) + 'L</span></div>';
  html += '<div class="ai-metric"><span>FVC</span><span>' + measured.fvc.toFixed(2) + 'L / ' + predicted.fvc.toFixed(2) + 'L</span></div>';
  html += '<div class="ai-metric"><span>FEV1/FVC</span><span>' + assessment.ratio + '%</span></div>';
  html += '</div>';
  
  html += '<div class="ai-recommendation-tips">';
  html += '<div class="ai-tip-title">🤖 AI Recommendations</div>';
  if (assessment.status === 'normal') {
    html += '<div class="ai-tip">✓ Your lung function is within normal range. Keep up the good work!</div>';
    html += '<div class="ai-tip">💪 Continue regular breathing exercises to maintain lung health.</div>';
  } else if (assessment.status === 'mild') {
    html += '<div class="ai-tip">⚠️ Your lung function shows mild reduction. Consider consulting a doctor.</div>';
    html += '<div class="ai-tip">🧘 Practice breathing exercises daily to improve capacity.</div>';
  } else {
    html += '<div class="ai-tip">🔴 Significant lung function reduction detected. Please consult a pulmonologist.</div>';
  }
  html += '</div>';
  html += '</div>';
  
  document.getElementById('ai-recommendation-body').innerHTML = html;
}

function closeAIRecommendation() {
  document.getElementById('ai-recommendation-modal').classList.add('hidden');
}

// Export Report
async function exportLungReport() {
  const data = await fetchAPI('/lung-capacity/current');
  if (!data) {
    alert('Error fetching data from server');
    return;
  }
  
  const { measured, predicted, assessment } = data;
  var date = new Date().toLocaleDateString();
  
  var report = 'PULMOSENSE LUNG HEALTH REPORT\n';
  report += 'Generated: ' + date + '\n\n';
  report += 'MEASURED VALUES:\n';
  report += '- FEV1: ' + measured.fev1.toFixed(2) + ' L\n';
  report += '- FVC: ' + measured.fvc.toFixed(2) + ' L\n';
  report += '- FEV1/FVC: ' + assessment.ratio + '%\n';
  report += '- PEF: ' + measured.pef.toFixed(1) + ' L/s\n\n';
  report += 'PREDICTED VALUES:\n';
  report += '- FEV1: ' + predicted.fev1.toFixed(2) + ' L\n';
  report += '- FVC: ' + predicted.fvc.toFixed(2) + ' L\n';
  report += '- PEF: ' + predicted.pef.toFixed(1) + ' L/s\n\n';
  report += 'ASSESSMENT: ' + assessment.status.toUpperCase() + ' (' + assessment.fev1Percent + '% of predicted)\n\n';
  report += 'Generated by PulmoSense v2 - Lung Health Intelligence\n';
  
  var blob = new Blob([report], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'PulmoSense_Lung_Report_' + date.replace(/\//g, '-') + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    drawSpirometryChart();
  }, 300);
});
