import { sequelize } from './src/config/db.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    await sequelize.query(`
      ALTER TABLE course_generation_jobs 
      ADD COLUMN IF NOT EXISTS intermediate_state JSONB DEFAULT '{"lessonsData": {}, "quizzesData": {}, "resourcesData": {}}';
    `);

    console.log("Migration successful: added intermediate_state");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
