import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CourseModule = sequelize.define('CourseModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'course_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index',
  },
  learningObjectives: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
    field: 'learning_objectives',
  },
}, {
  underscored: true,
  tableName: 'course_modules',
  timestamps: true,
});

export default CourseModule;
