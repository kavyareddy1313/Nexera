import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';
import Room from './Room.js';

const RoomMember = sequelize.define('RoomMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.UUID,
    references: { model: Room, key: 'id' },
  },
  user_id: {
    type: DataTypes.UUID,
    references: { model: User, key: 'id' },
  },
}, {
  underscored: true,
  tableName: 'RoomMembers',
});

RoomMember.belongsTo(Room, { foreignKey: 'room_id' });
RoomMember.belongsTo(User, { foreignKey: 'user_id' });
Room.hasMany(RoomMember, { foreignKey: 'room_id' });
User.hasMany(RoomMember, { foreignKey: 'user_id' });

export default RoomMember;
