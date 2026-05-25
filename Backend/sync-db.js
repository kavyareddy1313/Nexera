import { sequelize } from './src/config/db.js';
import * as models from './src/models/index.js';

(async () => {
  try {
    await models.Course.sync({ force: true });
    await models.CourseEnrollment.sync({ force: true });
    console.log("Course DB Synced!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
})();
