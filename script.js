// ================= API KEYS =================
const OPENWEATHER_API_KEY = "";
const GEMINI_API_KEY = "";


// ================= GLOBAL LIVE DATA =================
let userLat = null;
let userLon = null;

let liveAQI = 0;
let livePM25 = 0;
let livePM10 = 0;
let liveTemp = 0;
let liveHumidity = 0;
let liveWind = 0;


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
  return new Promise((resolve, reject)=>{
    navigator.geolocation.getCurrentPosition(
      pos=>{
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        resolve();
      },
      err=>{
        alert("Please allow location permission for AQI monitoring.");
        reject(err);
      }
    );
  });
}


// ===== FETCH AQI =====
async function fetchAQI(){
  try{
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${userLat}&lon=${userLon}&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    const comp = data.list[0].components;
    const aqi = data.list[0].main.aqi;

    // Convert 1-5 scale to 0-500 approx
    const aqiMap = {1:40, 2:80, 3:120, 4:180, 5:250};

    liveAQI = aqiMap[aqi];
    livePM25 = comp.pm2_5;
    livePM10 = comp.pm10;

    document.getElementById('aqi-display').textContent = liveAQI;
    document.getElementById('kpi-aqi').textContent = liveAQI;

  }catch(e){
    console.log("AQI fetch error", e);
  }
}


// ===== FETCH WEATHER =====
async function fetchWeather(){
  try{
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${userLat}&lon=${userLon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();

    liveTemp = data.main.temp;
    liveHumidity = data.main.humidity;
    liveWind = data.wind.speed;

  }catch(e){
    console.log("Weather fetch error", e);
  }
}


// ===== LIVE MONITORING =====
async function startLiveMonitoring(){
  await getUserLocation();
  await fetchAQI();
  await fetchWeather();

  // refresh every 5 min
  setInterval(async ()=>{
    await fetchAQI();
    await fetchWeather();
  }, 300000);
}


// ===== AI GEMINI =====
async function askGemini(userText){

  const prompt = `
You are PulmoSense AI — a respiratory health assistant.

Current conditions:
AQI: ${liveAQI}
PM2.5: ${livePM25} µg/m³
PM10: ${livePM10} µg/m³
Temperature: ${liveTemp}°C
Humidity: ${liveHumidity}%
Wind: ${liveWind} m/s

User question:
${userText}

Give short, clear health advice.
Include:
• Outdoor safety
• Mask advice
• Hydration advice
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        contents:[{
          parts:[{ text: prompt }]
        }]
      })
    }
  );

  const data = await response.json();

  try{
    return data.candidates[0].content.parts[0].text;
  }catch{
    return "AI is temporarily busy. Please try again.";
  }
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