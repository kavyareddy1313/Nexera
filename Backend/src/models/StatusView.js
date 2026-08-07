import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Status from './Status.js';
import User from './User.js';

const StatusView = sequelize.define('StatusView', {
  status_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: Status,
      key: 'id'
    }
  },
  viewer_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  viewed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'status_views',
  timestamps: true,
  createdAt: 'viewed_at',
  updatedAt: false
});

export default StatusView;
