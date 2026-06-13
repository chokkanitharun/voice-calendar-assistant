const micBtn = document.getElementById('micBtn');
const status = document.getElementById('status');
const transcript = document.getElementById('transcript');
const result = document.getElementById('result');
const durationSection = document.getElementById('durationSection');
const durBtns = document.querySelectorAll('.dur-btn');
const viewEventsBtn = document.getElementById('viewEventsBtn');
const eventsSection = document.getElementById('eventsSection');
const eventsList = document.getElementById('eventsList');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;

let listening = false;
let lastTranscript = '';
let eventsVisible = false;

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

viewEventsBtn.addEventListener('click', async () => {
  if (eventsVisible) {
    eventsSection.style.display = 'none';
    viewEventsBtn.textContent = '📅 My Events';
    eventsVisible = false;
    return;
  }

  viewEventsBtn.textContent = '⏳ Loading...';

  try {
    const response = await fetch('/api/events');
    const data = await response.json();

    if (data.success && data.events.length > 0) {
      eventsList.innerHTML = '';
      data.events.forEach(event => {
        const start = event.start.dateTime || event.start.date;
        const date = new Date(start);
        const formatted = date.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
          <div class="event-name">📌 ${event.summary}</div>
          <div class="event-time">🕐 ${formatted}</div>
          ${event.description ? `<div class="event-desc">${event.description}</div>` : ''}
        `;
        eventsList.appendChild(card);
      });

      eventsSection.style.display = 'block';
      eventsVisible = true;
      viewEventsBtn.textContent = '❌ Hide Events';
    } else if (data.success && data.events.length === 0) {
      eventsList.innerHTML = '<p class="no-events">No upcoming events found!</p>';
      eventsSection.style.display = 'block';
      eventsVisible = true;
      viewEventsBtn.textContent = '❌ Hide Events';
    } else {
      result.className = 'error';
      result.textContent = `❌ ${data.message} — please login at /auth first`;
      viewEventsBtn.textContent = '📅 My Events';
    }
  } catch (err) {
    result.className = 'error';
    result.textContent = '❌ Could not fetch events';
    viewEventsBtn.textContent = '📅 My Events';
  }
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

      // Refresh events list if visible
      if (eventsVisible) {
        viewEventsBtn.click();
        viewEventsBtn.click();
      }
    } else {
      result.className = 'error';
      result.textContent = `❌ ${data.message}`;
    }
  } catch (err) {
    result.className = 'error';
    result.textContent = '❌ Could not connect to server';
  }
}