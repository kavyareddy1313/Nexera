import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CourseQuiz = sequelize.define('CourseQuiz', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lessonId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'lesson_id',
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Array of 4 option strings: ["A", "B", "C", "D"]',
  },
  correctOptionIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'correct_option_index',
    validate: {
      min: 0,
      max: 3,
    },
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Explanation for why the correct answer is correct',
  },
}, {
  underscored: true,
  tableName: 'course_quizzes',
  timestamps: true,
});

export default CourseQuiz;
