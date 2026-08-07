import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Message from './Message.js';
import User from './User.js';

const MessageStatus = sequelize.define('MessageStatus', {
  message_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: Message,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('delivered', 'read'),
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'message_status',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

export default MessageStatus;
