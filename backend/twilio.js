require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function makeReminderCall(eventSummary, eventTime) {
  const call = await client.calls.create({
    to: process.env.MY_PHONE_NUMBER,
    from: process.env.TWILIO_PHONE_NUMBER,
    twiml: `<Response>
      <Say voice="alice">
        Hello! This is your Voice Calendar Assistant reminder.
        You have an event coming up: ${eventSummary} at ${eventTime}.
        I repeat, ${eventSummary} at ${eventTime}.
        Have a great day!
      </Say>
    </Response>`
  });

  console.log('Call initiated:', call.sid);
  return call.sid;
}

module.exports = { makeReminderCall };