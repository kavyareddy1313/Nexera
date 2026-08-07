import { sequelize } from './src/config/db.js';
import { CourseGenerationJob, Course } from './src/models/index.js';

async function test() {
  try {
    await sequelize.authenticate();
    const job = await CourseGenerationJob.findByPk('6e64d0b3-e495-4d85-bfed-c86afece1e32');
    console.log("Job:", job ? "Found" : "Not Found");
    if (job) {
       console.log("Job status:", job.status);
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await sequelize.close();
  }
}

test();
