const micBtn = document.getElementById('micBtn');
const status = document.getElementById('status');
const transcript = document.getElementById('transcript');
const result = document.getElementById('result');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;

let listening = false;

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
  transcript.textContent = `You said: "${text}"`;
  status.textContent = 'Processing...';
  sendToBackend(text);
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

async function sendToBackend(text) {
  try {
    const response = await fetch('/api/parse-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text })
    });

    const data = await response.json();

    if (data.success) {
      result.className = 'success';
      result.textContent = `✅ Event created: ${data.event.summary} on ${data.event.date}`;
    } else {
      result.className = 'error';
      result.textContent = `❌ ${data.message}`;
    }
  } catch (err) {
    result.className = 'error';
    result.textContent = '❌ Could not connect to server';
  }
}