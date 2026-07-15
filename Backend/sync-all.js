import { sequelize } from './src/config/db.js';
import './src/models/index.js';

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connection OK');
    await sequelize.sync({ alter: true });
    console.log('All schemas synced successfully!');
  } catch (error) {
    console.error('Error syncing schemas:', error);
  } finally {
    await sequelize.close();
  }
}
sync();
