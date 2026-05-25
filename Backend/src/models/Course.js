import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    field: 'thumbnail_url'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0,
  },
  studentsEnrolled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'students_enrolled'
  },
  category: {
    type: DataTypes.STRING,
  },
  duration: {
    type: DataTypes.STRING,
  }
}, {
  underscored: true,
  tableName: 'Courses'
});

export default Course;
