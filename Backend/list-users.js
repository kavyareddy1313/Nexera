import { sequelize } from './src/config/db.js';
import User from './src/models/User.js';

async function list() {
  await sequelize.authenticate();
  const users = await User.findAll({ attributes: ['email'] });
  console.log(users.map(u => u.email));
  await sequelize.close();
}
list();
