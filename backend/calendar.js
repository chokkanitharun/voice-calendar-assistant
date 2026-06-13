require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar']
  });
}

async function handleCallback(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

function setTokens(tokens) {
  oauth2Client.setCredentials(tokens);
}

async function createCalendarEvent(eventData) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const startDateTime = new Date(`${eventData.date}T${eventData.time}:00+05:30`);
  const endDateTime = new Date(startDateTime.getTime() + (eventData.durationMinutes || 60) * 60 * 1000);

  const event = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Asia/Kolkata'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Asia/Kolkata'
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });

  return response.data;
}

async function parseEventFromTranscript(transcript) {
  const { Mistral } = await import('@mistralai/mistralai');

  const client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
  });

  const today = new Date().toDateString();

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'user',
        content: `Today is ${today}. Extract calendar event details from this voice transcript and return ONLY a JSON object with no extra text:
        
Transcript: "${transcript}"

Return this exact format:
{
  "summary": "event title",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "description": "any extra details"
}

If you can't find a date, use today's date. If no time mentioned, use "09:00".`
      }
    ]
  });

  const text = response.choices[0].message.content;
  console.log('Mistral raw response:', text);

  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return parsed;
}

module.exports = { getAuthUrl, handleCallback, setTokens, createCalendarEvent, parseEventFromTranscript };
module.exports = { getAuthUrl, handleCallback, setTokens, createCalendarEvent, parseEventFromTranscript, oauth2Client };