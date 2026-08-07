import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  generationJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'generation_job_id',
    comment: 'Links to the AI generation job that created this course (null for manually created)',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  },
  level: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'beginner | intermediate | advanced',
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'English',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'published', 'archived']],
    },
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at',
  },
  instructorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'instructor_id',
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'conversation_id',
  }
}, {
  underscored: true,
  tableName: 'Courses'
});

export default Course;
