import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Message from './Message.js';
import User from './User.js';

const MessageReaction = sequelize.define('MessageReaction', {
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
  emoji: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'message_reactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default MessageReaction;
