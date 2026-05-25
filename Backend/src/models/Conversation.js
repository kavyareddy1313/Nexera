import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('dm', 'group'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  invite_link: {
    type: DataTypes.STRING,
    unique: true,
    // Typically generate random link natively or on create hook
  },
  disappearing_mode: {
    type: DataTypes.ENUM('off', '1d', '7d', '90d'),
    defaultValue: 'off',
  },
  last_message_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  last_activity_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Schema only has created_at and last_activity_at
});

export default Conversation;
