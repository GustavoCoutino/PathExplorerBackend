const schedule = require("node-schedule");
const {
  addNotificationToCertificates,
} = require("./../db/queries/notificationsQueries");

const scheduleCertificationNotifications = () => {
  schedule.scheduleJob("0 1 * * *", async () => {
    try {
      await addNotificationToCertificates();
    } catch (error) {
      console.error("Error in certification notification job:", error);
    }
  });
};

module.exports = { scheduleCertificationNotifications };
