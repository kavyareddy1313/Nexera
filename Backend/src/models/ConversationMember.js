import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Conversation from './Conversation.js';
import User from './User.js';

const ConversationMember = sequelize.define('ConversationMember', {
  conversation_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: Conversation,
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
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
  is_muted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_read_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'conversation_members',
  timestamps: false,
});

export default ConversationMember;
