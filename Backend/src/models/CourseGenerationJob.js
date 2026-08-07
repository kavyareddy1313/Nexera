import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CourseGenerationJob = sequelize.define('CourseGenerationJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  instructorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'instructor_id',
  },
  inputParams: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'input_params',
    comment: 'Form data: topic, level, moduleCount, lessonCount, language, quizCount, etc.',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'generating', 'draft_ready', 'published', 'failed']],
    },
  },
  currentStage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'current_stage',
    comment: 'outline | content | quiz | resources | assembling',
  },
  progressDetail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'progress_detail',
    comment: 'Human-readable progress message, e.g. "Generating Module 2, Lesson 3..."',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
  },
  generatedOutline: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'generated_outline',
    comment: 'Cached outline JSON from Stage A for retry support',
  },
  intermediateState: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'intermediate_state',
    defaultValue: { lessonsData: {}, quizzesData: {}, resourcesData: {} },
    comment: 'Caches progress of individual lessons/quizzes to avoid regenerating from scratch on failure',
  },
  referenceDocPath: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reference_doc_path',
    comment: 'Path to uploaded reference document for RAG grounding',
  },
  tokenUsage: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'token_usage',
    defaultValue: { totalInputTokens: 0, totalOutputTokens: 0, llmCalls: 0 },
    comment: 'Accumulated token usage stats for this generation job',
  },
}, {
  underscored: true,
  tableName: 'course_generation_jobs',
  timestamps: true,
});

export default CourseGenerationJob;
