import { Sequelize } from 'sequelize';
import { env } from './env.js';
import { logger } from '../middleware/requestLogger.js';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    connectTimeout: 60000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database Connection: Verified (via Sequelize)');

    if (env.NODE_ENV === 'development') {
      try {
        await sequelize.sync();
        logger.info('✅ Database Schema: Synced');
      } catch (syncErr) {
        logger.warn(`⚠️ Database Schema Sync warning: ${syncErr.message}`);
      }

      // Manual migrations (must run even if sync throws enum warnings)
      try {
        await sequelize.query(`
          ALTER TABLE course_generation_jobs 
          ADD COLUMN IF NOT EXISTS intermediate_state JSONB DEFAULT '{"lessonsData": {}, "quizzesData": {}, "resourcesData": {}}'::jsonb;
        `);
        logger.info('✅ Manual Migrations: Applied');
      } catch (migErr) {
        logger.error(`❌ Manual Migration Failed: ${migErr.message}`);
      }
    }
  } catch (error) {
    logger.error(`❌ Database Connection: Failed | Error: ${error.message}`);
    if (error.original) {
      logger.error(`Original Error: ${error.original.message}`);
    }
  }
};

