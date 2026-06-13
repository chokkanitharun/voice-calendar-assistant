const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { getAuthUrl, handleCallback, setTokens, createCalendarEvent, parseEventFromTranscript } = require('./calendar');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let savedTokens = null;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await handleCallback(code);
    savedTokens = tokens;
    res.redirect('/?auth=success');
  } catch (err) {
    res.redirect('/?auth=error');
  }
});

app.post('/api/parse-event', async (req, res) => {
  const { transcript, durationMinutes } = req.body;

  if (!transcript) {
    return res.json({ success: false, message: 'No transcript received' });
  }

  try {
    const eventData = await parseEventFromTranscript(transcript);
    eventData.durationMinutes = durationMinutes || 60;

    if (savedTokens) {
      setTokens(savedTokens);
      const createdEvent = await createCalendarEvent(eventData);
      res.json({ success: true, event: eventData, calendarLink: createdEvent.htmlLink });
    } else {
      res.json({ success: true, event: eventData, message: 'Parsed but not saved — please login with Google first' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Failed to parse event' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});