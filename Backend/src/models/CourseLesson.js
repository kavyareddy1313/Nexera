import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CourseLesson = sequelize.define('CourseLesson', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'module_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index',
  },
  contentMarkdown: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'content_markdown',
    comment: 'AI-generated lesson content in Markdown format',
  },
  keyTakeaways: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
    field: 'key_takeaways',
  },
  youtubeVideoId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'youtube_video_id',
  },
  youtubeVideoTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'youtube_video_title',
  },
  extraResources: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'extra_resources',
    comment: 'Array of { title, url, type } objects',
  },
  generationStatus: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    field: 'generation_status',
    validate: {
      isIn: [['pending', 'generating', 'completed', 'failed']],
    },
  },
}, {
  underscored: true,
  tableName: 'course_lessons',
  timestamps: true,
});

export default CourseLesson;
