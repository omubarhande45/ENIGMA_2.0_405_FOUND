// ================= API CONFIG =================
// Using local API server (no external API keys needed)
// The server provides simulated AQI data

// ================= GLOBAL LIVE DATA =================
let userLat = null;
let userLon = null;

let liveAQI = 143;
let livePM25 = 52;
let livePM10 = 94;
let liveTemp = 24;
let liveHumidity = 58;
let liveWind = 12;


// ===== NAVIGATION =====
function navigate(page, el){
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-'+page).classList.add('active');
  el.classList.add('active');

  const titles = {
    dashboard:'Dashboard',
    map:'AQI Map',
    timeline:'Exposure Timeline',
    public:'Public Health',
    ai:'AI Assistant',
    settings:'Settings'
  };

  document.getElementById('page-title-display').textContent = titles[page] || page;
  document.getElementById('breadcrumb-current').textContent = titles[page] || page;
}


// ===== LOCATION =====
async function getUserLocation(){
  return new Promise((resolve)=>{
    // Use default location (Nagpur, India) for demo
    userLat = 21.1458;
    userLon = 79.0882;
    resolve();
  });
}


// ===== FETCH AQI FROM LOCAL SERVER =====
async function fetchAQI(){
  try{
    const res = await fetch('/api/aqi');
    const data = await res.json();

    liveAQI = data.aqi;
    livePM25 = data.pm25;
    livePM10 = data.pm10;

    document.getElementById('aqi-display').textContent = liveAQI;
    document.getElementById('kpi-aqi').textContent = liveAQI;

  }catch(e){
    console.log("AQI fetch error", e);
    // Use defaults if API fails
    document.getElementById('aqi-display').textContent = liveAQI;
    document.getElementById('kpi-aqi').textContent = liveAQI;
  }
}


// ===== FETCH WEATHER (Using defaults for demo) =====
async function fetchWeather(){
  // Using default values for demo - in production would use OpenWeatherMap API
  liveTemp = 24;
  liveHumidity = 58;
  liveWind = 12;
}


// ===== LIVE MONITORING =====
async function startLiveMonitoring(){
  await getUserLocation();
  await fetchAQI();
  await fetchWeather();

  // refresh every 30 seconds
  setInterval(async ()=>{
    await fetchAQI();
  }, 30000);
}


// ===== AI ASSISTANT (Using local responses) =====
const aiResponses = {
  "risk": "Based on current AQI of 143 (Unhealthy for Sensitive Groups), your personal risk is moderate. PM2.5 at 52 µg/m³ is 3.5× WHO limits. If you have asthma or allergic rhinitis, consider wearing an N95 mask outdoors.",
  "run": "Not recommended right now. AQI is 143 (USG). Wait until evening when AQI is forecast to drop to ~80. Best exercise window: 6-7:30 AM or after 6 PM.",
  "inhaler": "Use your inhaler if you experience shortness of breath, wheezing, or chest tightness. With current conditions (PM2.5: 52 µg/m³), proactive use may be beneficial. Consult your doctor for personalized advice.",
  "cleanest": "Ambazari Garden area has the best air quality (AQI: 45). It's a green zone about 3km from your current location. Dharampeth (AQI: 52) is another clean option.",
  "weekly": "Your weekly exposure summary: Peak AQI was 189 on Thursday near construction zone. Average weekly AQI: 94. You've used 68% of your daily exposure limit. Lung health index improved +5 this week.",
  "default": "Based on current AQI of 143, I recommend: 1) Wear N95 mask outdoors, 2) Keep windows closed, 3) Use air purifier indoors, 4) Stay hydrated, 5) Avoid outdoor exercise until AQI drops below 100."
};

function getAIResponse(userText) {
  const text = userText.toLowerCase();
  
  if (text.includes("risk") || text.includes("health")) {
    return aiResponses.risk;
  } else if (text.includes("run") || text.includes("exercise") || text.includes("outdoor")) {
    return aiResponses.run;
  } else if (text.includes("inhaler") || text.includes("medication")) {
    return aiResponses.inhaler;
  } else if (text.includes("cleanest") || text.includes("clean") || text.includes("area")) {
    return aiResponses.cleanest;
  } else if (text.includes("weekly") || text.includes("summary") || text.includes("week")) {
    return aiResponses.weekly;
  } else {
    return aiResponses.default;
  }
}

async function askGemini(userText){
  // Using local AI responses instead of external API
  // This provides demo functionality without requiring API keys
  return getAIResponse(userText);
}


// ===== AI CHAT =====
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

  // USER MESSAGE
  const userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.innerHTML =
    '<div class="msg-bubble">'+text+'</div>'+
    '<div class="msg-time">'+new Date().toLocaleTimeString()+'</div>';

  msgs.appendChild(userMsg);
  input.value='';
  msgs.scrollTop = msgs.scrollHeight;

  // TYPING
  const typing = document.createElement('div');
  typing.className='msg bot';
  typing.innerHTML=
    '<div class="msg-bubble"><div class="typing-indicator">'+
    '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>'+
    '</div></div>';

  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  // ASK GEMINI
  const aiReply = await askGemini(text);

  typing.remove();

  const botMsg = document.createElement('div');
  botMsg.className='msg bot';
  botMsg.innerHTML =
    '<div class="msg-bubble">'+aiReply.replace(/\n/g,'<br>')+'</div>'+
    '<div class="msg-time">PulmoSense AI · '+new Date().toLocaleTimeString()+'</div>';

  msgs.appendChild(botMsg);
  msgs.scrollTop = msgs.scrollHeight;
}


// ===== SETTINGS TABS =====
function setSettingsTab(el){
  document.querySelectorAll('.settings-nav-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
}

// ===== ONBOARDING =====
let currentStep = 1;

function nextStep(){
  if(currentStep < 3){
    document.getElementById('step-'+currentStep).classList.remove('active');
    currentStep++;
    document.getElementById('step-'+currentStep).classList.add('active');
    updateProgress();

    if(currentStep===3)
      document.getElementById('modal-next-btn').textContent='Launch Dashboard ✓';

  } else {
    document.getElementById('onboarding').classList.add('hidden');
  }
}

function prevStep(){
  if(currentStep > 1){
    document.getElementById('step-'+currentStep).classList.remove('active');
    currentStep--;
    document.getElementById('step-'+currentStep).classList.add('active');
    updateProgress();
    document.getElementById('modal-next-btn').textContent='Get Started →';
  }
}

function updateProgress(){
  [1,2,3].forEach(i=>{
    const d=document.getElementById('pd'+i);
    if(d) d.classList.toggle('active', i<=currentStep);
  });
}


// ===== NOTIFICATIONS =====
function toggleNotif(){
  const panel=document.getElementById('notif-panel');
  if(panel) panel.classList.toggle('open');
}


// ===== START APP =====
window.addEventListener("load", ()=>{
  startLiveMonitoring();
});

// ===== MAKE FUNCTIONS GLOBAL (FOR HTML BUTTONS) =====
window.navigate = navigate;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.sendMessage = sendMessage;
window.sendSuggestion = sendSuggestion;
window.toggleNotif = toggleNotif;
window.setSettingsTab = setSettingsTab;