const micBtn = document.getElementById('micBtn');
const status = document.getElementById('status');
const transcript = document.getElementById('transcript');
const result = document.getElementById('result');
const durationSection = document.getElementById('durationSection');
const durBtns = document.querySelectorAll('.dur-btn');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;

let listening = false;
let lastTranscript = '';

micBtn.addEventListener('click', () => {
  if (!listening) {
    recognition.start();
    micBtn.textContent = '🔴 Listening...';
    micBtn.classList.add('listening');
    status.textContent = 'Listening... speak now!';
    listening = true;
  } else {
    recognition.stop();
    micBtn.textContent = '🎤 Start Listening';
    micBtn.classList.remove('listening');
    status.textContent = 'Click the button and speak...';
    listening = false;
  }
});

recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  lastTranscript = text;
  transcript.textContent = `You said: "${text}"`;
  status.textContent = 'Now select duration:';
  durationSection.style.display = 'block';
};

recognition.onend = () => {
  micBtn.textContent = '🎤 Start Listening';
  micBtn.classList.remove('listening');
  listening = false;
};

recognition.onerror = (event) => {
  status.textContent = `Error: ${event.error}`;
  micBtn.textContent = '🎤 Start Listening';
  micBtn.classList.remove('listening');
  listening = false;
};

durBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes);
    durationSection.style.display = 'none';
    status.textContent = 'Creating event...';
    sendToBackend(lastTranscript, minutes);
  });
});

document.getElementById('customBtn').addEventListener('click', () => {
  const val = parseInt(document.getElementById('customMinutes').value);
  if (!val || val < 1) {
    status.textContent = 'Please enter a valid number of minutes!';
    return;
  }
  durationSection.style.display = 'none';
  status.textContent = 'Creating event...';
  sendToBackend(lastTranscript, val);
});

async function sendToBackend(text, durationMinutes) {
  try {
    const response = await fetch('/api/parse-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text, durationMinutes })
    });

    const data = await response.json();

    if (data.success) {
      result.className = 'success';
      result.textContent = `✅ Event created: ${data.event.summary} on ${data.event.date} at ${data.event.time}`;
      durationSection.style.display = 'none';
      status.textContent = 'Click the button and speak...';
      transcript.textContent = '';
    } else {
      result.className = 'error';
      result.textContent = `❌ ${data.message}`;
    }
  } catch (err) {
    result.className = 'error';
    result.textContent = '❌ Could not connect to server';
  }
}