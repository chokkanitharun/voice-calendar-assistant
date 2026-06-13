const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { parseEventFromTranscript } = require('./calendar');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.post('/api/parse-event', async (req, res) => {
  const { transcript } = req.body;

  if (!transcript) {
    return res.json({ success: false, message: 'No transcript received' });
  }

  try {
    const event = await parseEventFromTranscript(transcript);
    res.json({ success: true, event });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Failed to parse event' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});