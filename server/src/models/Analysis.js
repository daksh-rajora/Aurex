import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repository: {
      owner: {
        type: String,
        required: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      htmlUrl: {
        type: String,
        default: '',
      },
      defaultBranch: {
        type: String,
        default: 'main',
      },
      description: {
        type: String,
        default: '',
      },
      visibility: {
        type: String,
        default: 'public',
      },
    },
    github: {
      repoId: {
        type: String,
        default: '',
      },
      language: {
        type: String,
        default: '',
      },
      stars: {
        type: Number,
        default: 0,
      },
      forks: {
        type: Number,
        default: 0,
      },
      watchers: {
        type: Number,
        default: 0,
      },
      openIssues: {
        type: Number,
        default: 0,
      },
      topics: {
        type: [String],
        default: [],
      },
    },
    analysis: {
      overallScore: {
        type: Number,
        default: 0,
      },
      codeQuality: {
        type: Number,
        default: 0,
      },
      security: {
        type: Number,
        default: 0,
      },
      performance: {
        type: Number,
        default: 0,
      },
      architecture: {
        type: Number,
        default: 0,
      },
      documentation: {
        type: Number,
        default: 0,
      },
      maintainability: {
        type: Number,
        default: 0,
      },
      bestPractices: {
        type: Number,
        default: 0,
      },
      strengths: {
        type: [String],
        default: [],
      },
      weaknesses: {
        type: [String],
        default: [],
      },
      suggestions: {
        type: [String],
        default: [],
      },
      summary: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
      index: true,
    },
    aiProvider: {
      type: String,
      default: 'Placeholder',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

analysisSchema.index({ user: 1, createdAt: -1 });

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
