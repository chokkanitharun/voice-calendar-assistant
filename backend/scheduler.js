require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cron = require('node-cron');
const { makeReminderCall } = require('./twilio');

const scheduledEvents = [];

function scheduleReminder(eventData) {
  const eventDateTime = new Date(`${eventData.date}T${eventData.time}:00+05:30`);
  const reminderTime = new Date(eventDateTime.getTime() - 10 * 60 * 1000); // 10 mins before

  const now = new Date();
  if (reminderTime <= now) {
    console.log('Event time already passed, skipping reminder');
    return;
  }

  const minutes = reminderTime.getMinutes();
  const hours = reminderTime.getHours();
  const day = reminderTime.getDate();
  const month = reminderTime.getMonth() + 1;

  const cronExpression = `${minutes} ${hours} ${day} ${month} *`;

  console.log(`Scheduling reminder for: ${reminderTime}`);

  cron.schedule(cronExpression, () => {
    console.log(`Making reminder call for: ${eventData.summary}`);
    makeReminderCall(eventData.summary, eventData.time);
  });

  scheduledEvents.push({
    summary: eventData.summary,
    date: eventData.date,
    time: eventData.time,
    reminderTime: reminderTime.toISOString()
  });
}

module.exports = { scheduleReminder };