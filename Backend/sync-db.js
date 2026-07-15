import { sequelize } from './src/config/db.js';
import User from './src/models/User.js';

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connection OK');
    await sequelize.sync({ alter: true });
    console.log('Schema synced successfully!');
  } catch (error) {
    console.error('Error syncing:', error);
  } finally {
    await sequelize.close();
  }
}
sync();
