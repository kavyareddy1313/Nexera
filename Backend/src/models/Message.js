import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Conversation from './Conversation.js';
import User from './User.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Conversation,
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'voice', 'document', 'sticker', 'location', 'contact', 'poll', 'system', 'deleted'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  reply_to_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  forwarded_from: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deleted_for: {
    type: DataTypes.ENUM('none', 'me', 'everyone'),
    defaultValue: 'none',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  temp_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  search_vector: {
    type: DataTypes.TSVECTOR,
    allowNull: true,
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Message;
