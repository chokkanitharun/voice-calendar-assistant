const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.post('/api/parse-event', (req, res) => {
  const { transcript } = req.body;

  if (!transcript) {
    return res.json({ success: false, message: 'No transcript received' });
  }

  // For now just echo back — we'll add AI parsing next
  res.json({
    success: true,
    event: {
      summary: transcript,
      date: new Date().toDateString()
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});