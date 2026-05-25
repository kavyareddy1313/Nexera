import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    defaultValue: 'group',
  },
  avatar_url: {
    type: DataTypes.STRING,
  },
  last_message: {
    type: DataTypes.TEXT,
  },
  last_message_at: {
    type: DataTypes.DATE,
  },
}, {
  underscored: true,
  tableName: 'Rooms'
});

export default Room;
