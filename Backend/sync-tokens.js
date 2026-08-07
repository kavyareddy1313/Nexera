import { sequelize } from './src/config/db.js';
import RefreshToken from './src/models/RefreshToken.js';
import PasswordResetToken from './src/models/PasswordResetToken.js';
import User from './src/models/User.js';

// Setup associations if needed (RefreshToken has userId, so User needs to be imported)
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connection OK');
    await RefreshToken.sync({ alter: true });
    await PasswordResetToken.sync({ alter: true });
    console.log('Tokens synced successfully!');
  } catch (error) {
    console.error('Error syncing:', error);
  } finally {
    await sequelize.close();
  }
}
sync();
