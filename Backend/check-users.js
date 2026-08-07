import { sequelize } from './src/config/db.js';
import User from './src/models/User.js';

async function check() {
  await sequelize.authenticate();
  const count = await User.count();
  console.log('Total users in Sequelize Users table:', count);
  await sequelize.close();
}
check();
