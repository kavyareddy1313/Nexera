import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';
import Course from './Course.js';

const CourseEnrollment = sequelize.define('CourseEnrollment', {
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
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'course_id'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  paymentId: {
    type: DataTypes.STRING,
    field: 'payment_id'
  }
}, {
  underscored: true,
  tableName: 'CourseEnrollments'
});

export default CourseEnrollment;
