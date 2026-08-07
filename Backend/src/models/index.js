import User from './User.js';
import Conversation from './Conversation.js';
import ConversationMember from './ConversationMember.js';
import Message from './Message.js';
import MessageStatus from './MessageStatus.js';
import MessageReaction from './MessageReaction.js';
import Status from './Status.js';
import StatusView from './StatusView.js';
import Course from './Course.js';
import CourseEnrollment from './CourseEnrollment.js';
import RefreshToken from './RefreshToken.js';
import PasswordResetToken from './PasswordResetToken.js';
import AiDocument from './AiDocument.js';
import CourseGenerationJob from './CourseGenerationJob.js';
import CourseModule from './CourseModule.js';
import CourseLesson from './CourseLesson.js';
import CourseQuiz from './CourseQuiz.js';

// --- Associations ---

// User <-> AiDocument
User.hasMany(AiDocument, { foreignKey: 'user_id', as: 'ai_documents' });
AiDocument.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Conversation <-> User (Creator)
User.hasMany(Conversation, { foreignKey: 'created_by', as: 'created_conversations' });
Conversation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Conversation <-> ConversationMember
Conversation.hasMany(ConversationMember, { foreignKey: 'conversation_id', as: 'members' });
ConversationMember.belongsTo(Conversation, { foreignKey: 'conversation_id' });

// User <-> ConversationMember
User.hasMany(ConversationMember, { foreignKey: 'user_id', as: 'memberships' });
ConversationMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Conversation <-> Message
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });

// Message (Last Message) <-> Conversation
Conversation.belongsTo(Message, { foreignKey: 'last_message_id', as: 'last_message' });

// User <-> Message (Sender)
User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Message <-> Message (Reply To)
Message.hasMany(Message, { foreignKey: 'reply_to_id', as: 'replies' });
Message.belongsTo(Message, { foreignKey: 'reply_to_id', as: 'reply_to' });

// Message <-> MessageStatus
Message.hasMany(MessageStatus, { foreignKey: 'message_id', as: 'status' });
MessageStatus.belongsTo(Message, { foreignKey: 'message_id' });
User.hasMany(MessageStatus, { foreignKey: 'user_id' });
MessageStatus.belongsTo(User, { foreignKey: 'user_id' });

// Message <-> MessageReaction
Message.hasMany(MessageReaction, { foreignKey: 'message_id', as: 'reactions' });
MessageReaction.belongsTo(Message, { foreignKey: 'message_id' });
User.hasMany(MessageReaction, { foreignKey: 'user_id' });
MessageReaction.belongsTo(User, { foreignKey: 'user_id' });

// Status <-> User
User.hasMany(Status, { foreignKey: 'user_id', as: 'statuses' });
Status.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Status <-> StatusView
Status.hasMany(StatusView, { foreignKey: 'status_id', as: 'views' });
StatusView.belongsTo(Status, { foreignKey: 'status_id' });
User.hasMany(StatusView, { foreignKey: 'viewer_id' });
StatusView.belongsTo(User, { foreignKey: 'viewer_id', as: 'viewer' });

// Course <-> User (Instructor)
User.hasMany(Course, { foreignKey: 'instructor_id', as: 'instructed_courses' });
Course.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Course <-> CourseEnrollment <-> User (Student)
User.belongsToMany(Course, { through: CourseEnrollment, foreignKey: 'user_id', as: 'enrolled_courses' });
Course.belongsToMany(User, { through: CourseEnrollment, foreignKey: 'course_id', as: 'students' });
CourseEnrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CourseEnrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Auth Tokens
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PasswordResetToken, { foreignKey: 'user_id' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- AI Course Generator Associations ---

// CourseGenerationJob <-> User (Instructor)
User.hasMany(CourseGenerationJob, { foreignKey: 'instructor_id', as: 'generation_jobs' });
CourseGenerationJob.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// CourseGenerationJob <-> Course (one-to-one: job produces one course)
CourseGenerationJob.hasOne(Course, { foreignKey: 'generation_job_id', as: 'course' });
Course.belongsTo(CourseGenerationJob, { foreignKey: 'generation_job_id', as: 'generation_job' });

// Course <-> CourseModule
Course.hasMany(CourseModule, { foreignKey: 'course_id', as: 'modules', onDelete: 'CASCADE' });
CourseModule.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// CourseModule <-> CourseLesson
CourseModule.hasMany(CourseLesson, { foreignKey: 'module_id', as: 'lessons', onDelete: 'CASCADE' });
CourseLesson.belongsTo(CourseModule, { foreignKey: 'module_id', as: 'module' });

// CourseLesson <-> CourseQuiz
CourseLesson.hasMany(CourseQuiz, { foreignKey: 'lesson_id', as: 'quizzes', onDelete: 'CASCADE' });
CourseQuiz.belongsTo(CourseLesson, { foreignKey: 'lesson_id', as: 'lesson' });

export {
  User,
  Conversation,
  ConversationMember,
  Message,
  MessageStatus,
  MessageReaction,
  Status,
  StatusView,
  Course,
  CourseEnrollment,
  RefreshToken,
  PasswordResetToken,
  AiDocument,
  CourseGenerationJob,
  CourseModule,
  CourseLesson,
  CourseQuiz
};
