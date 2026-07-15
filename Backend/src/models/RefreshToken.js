import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  tokenHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'token_hash'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  underscored: true,
  tableName: 'RefreshTokens',
  indexes: [
    {
      fields: ['token_hash']
    }
  ]
});

export default RefreshToken;
