import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const AiDocument = sequelize.define('AiDocument', {
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
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileType: {
    type: DataTypes.STRING,
    field: 'file_type'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    field: 'file_size'
  },
  fileUrl: {
    type: DataTypes.STRING,
    field: 'file_url',
    allowNull: true
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_favorite'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  workspaceId: {
    type: DataTypes.STRING,
    field: 'workspace_id',
    allowNull: true
  }
}, {
  tableName: 'AiDocuments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AiDocument;
