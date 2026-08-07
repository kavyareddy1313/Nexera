import cron from 'node-cron';
import { Op } from 'sequelize';
import { Message, Status } from '../models/index.js';
import { logger } from '../middleware/requestLogger.js';

export const setupCronJobs = () => {
  // 1. auto-delete-expired messages (every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running cron: auto-delete-expired messages');
      
      const now = new Date();
      
      const [updatedCount] = await Message.update({
        deleted_at: now,
        deleted_for: 'everyone',
        type: 'deleted',
        content: null
      }, {
        where: {
          expires_at: { [Op.lt]: now },
          deleted_at: null
        }
      });
      
      if (updatedCount > 0) {
        logger.info(`Deleted ${updatedCount} expired messages.`);
      }
    } catch (err) {
      logger.error('Cron error (messages): ' + err.message);
    }
  });

  // 2. auto-delete-statuses (every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running cron: auto-delete-statuses');
      const now = new Date();
      
      const deletedCount = await Status.destroy({
        where: {
          expires_at: { [Op.lt]: now }
        }
      });
        
      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} expired statuses.`);
      }
    } catch (err) {
      logger.error('Cron error (statuses): ' + err.message);
    }
  });

  logger.info('✅ Cron jobs initialized (Sequelize)');
};
