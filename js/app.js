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

// ===== ONBOARDING =====
let currentStep = 1;
function nextStep(){
  if(currentStep < 3){
    document.getElementById('step-'+currentStep).classList.remove('active');
    currentStep++;
    document.getElementById('step-'+currentStep).classList.add('active');
    updateProgress();
    if(currentStep===3) document.getElementById('modal-next-btn').textContent = 'Launch Dashboard ✓';
  } else {
    document.getElementById('onboarding').classList.add('hidden');
    startAnimations();
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

// ===== ANIMATIONS =====
function startAnimations(){
  // LHI counter
  let v = 0;
  const el = document.getElementById('lhi-animated');
  const iv = setInterval(()=>{ v+=2; el.textContent=v; if(v>=82) clearInterval(iv); }, 20);

  // Risk bars
  setTimeout(()=>{
    document.getElementById('risk1').style.width='34%';
    document.getElementById('risk2').style.width='12%';
    document.getElementById('risk3').style.width='22%';
  }, 400);

  // Poll bars
  setTimeout(()=>{
    document.querySelectorAll('.poll-fill').forEach(el=>{
      el.style.width = el.dataset.w + '%';
    });
  }, 600);

  // Draw chart
  drawChart();

  // Live AQI flicker
  setInterval(()=>{
    const base = 143;
    const v = Math.round(base + (Math.random()-0.5)*8);
    document.getElementById('aqi-display').textContent = v;
    document.getElementById('kpi-aqi').textContent = v;
  }, 4000);

  // Wearable live data simulation
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

  // Set d attribute for path elements (points is for polyline, not path)
  const aqiLine = document.getElementById('aqi-line');
  if(aqiLine) aqiLine.setAttribute('d','M'+pts.map(p=>`${p.x},${p.y}`).join(' L'));
  const aqiArea = document.getElementById('aqi-area');
  if(aqiArea) aqiArea.setAttribute('d', areaPath);

  // SpO2 (inverted correlation)
  const spo2Pts = aqiDataPts.map((v,i)=>{
    const spo = 99 - (v/200)*4;
    return { x: 25 + i*(w-40)/23, y: h - 10 - ((spo-90)/10)*(h-20) };
  });
  const spo2Line = 'M'+spo2Pts.map(p=>`${p.x},${p.y}`).join(' L');
  
  const spo2LineEl = document.getElementById('spo2-line');
  if(spo2LineEl) spo2LineEl.setAttribute('d', spo2Line);
  
  const spo2AreaEl = document.getElementById('spo2-area');
  if(spo2AreaEl) spo2AreaEl.setAttribute('d', `M${spo2Pts[0].x},${h-5} ${spo2Pts.map(p=>`L${p.x},${p.y}`).join(' ')} L${spo2Pts[spo2Pts.length-1].x},${h-5} Z`);

  // Current marker (index 15)
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
  "health risk today": "Based on today's data:<br><br>🔴 <strong>AQI 143</strong> — Unhealthy for Sensitive Groups<br>📉 Your SpO₂ dipped to 94.8% at 2 PM<br>⚠️ AI Risk Score: 34% respiratory event risk<br><br>My recommendation: Avoid outdoor exposure for the next 4 hours. Activate your HEPA purifier and stay hydrated.",
  "go for a run": "❌ <strong>Not recommended right now.</strong><br><br>Current AQI is 143 with PM2.5 at 52 µg/m³. During exercise, you breathe 10-20× more air per minute, greatly increasing particle intake.<br><br>✅ <strong>Best window today:</strong> 6:00–7:30 PM when AQI is forecast to drop below 85. I'll send you a notification!",
  "inhaler": "Based on your wearable data:<br><br>• Respiratory rate: 16/min (slightly elevated)<br>• SpO₂: 97.4% (recovering)<br>• Last dip: 94.8% at 2 PM<br><br>If you have a preventer inhaler, using it now is reasonable given today's exposure. If symptoms worsen or SpO₂ drops below 93%, please seek medical attention.",
  "cleanest area": "📍 <strong>Cleanest zones near you right now:</strong><br><br>🟢 Ambazari Garden — AQI 45 (3.2 km away)<br>🟢 Dharampeth — AQI 52 (1.8 km)<br>🟡 Ramdaspeth — AQI 78 (1.1 km)<br><br>Ambazari Garden is your best option if you need to go outside today.",
  "weekly exposure": "📊 <strong>Your 7-Day Exposure Summary:</strong><br><br>• Avg daily AQI exposure: 94<br>• Peak exposure day: Today (189 max)<br>• Total hours outdoors: 24.5h<br>• Days exceeding 50% limit: 3<br>• Your lung health trend: ↓ -4 pts<br><br><strong>Recommendation:</strong> Take 2 low-pollution days this week to allow lung recovery."
};

function sendSuggestion(el){
  const text = el.textContent.replace(/^[^\s]*\s/, '');
  document.getElementById('chat-input').value = text;
  sendMessage();
}

function sendMessage(){
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;

  const msgs = document.getElementById('chat-msgs');

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.innerHTML = '<div class="msg-bubble">'+text+'</div><div class="msg-time">'+new Date().toLocaleTimeString()+'</div>';
  msgs.appendChild(userMsg);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'msg bot';
  typing.innerHTML = '<div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  // Find response
  let response = "I've analyzed your real-time health data and current AQI conditions. Based on today's readings (AQI 143, SpO₂ 97.4%), I recommend staying indoors and monitoring your symptoms. Is there something specific about your lung health you'd like me to explain?";
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

// Auto-start if closing modal immediately (demo mode)
setTimeout(()=>{
  if(document.getElementById('onboarding') && !document.getElementById('onboarding').classList.contains('hidden')){
    // leave open
  }
}, 100);
