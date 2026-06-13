require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

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

module.exports = { parseEventFromTranscript };