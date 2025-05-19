const schedule = require("node-schedule");
const {
  addNotificationToCertificates,
} = require("./../db/queries/notificationsQueries");

const scheduleCertificationNotifications = () => {
  schedule.scheduleJob("0 1 * * *", async () => {
    try {
      const result = await addNotificationToCertificates();
      console.log(`Scheduled job executed. Notifications added: ${result}`);
    } catch (error) {
      console.error("Error in certification notification job:", error);
    }
  });
};

module.exports = { scheduleCertificationNotifications };
