import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
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
      description: {
        type: String,
        default: '',
      },
      htmlUrl: {
        type: String,
        default: '',
      },
      defaultBranch: {
        type: String,
        default: 'main',
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
    metadata: {
      languages: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      readme: {
        exists: { type: Boolean, default: false },
        content: { type: String, default: null },
      },
      rootContents: [
        {
          name: { type: String },
          type: { type: String },
          path: { type: String },
        },
      ],
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
      documentation: {
        type: Number,
        default: 0,
      },
      architecture: {
        type: Number,
        default: 0,
      },
      maintainability: {
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
      bestPractices: {
        type: Number,
        default: 0,
      },
      techStack: {
        type: [String],
        default: [],
      },
      architectureReview: {
        type: String,
        default: '',
      },
      codeQualityReview: {
        type: String,
        default: '',
      },
      documentationReview: {
        type: String,
        default: '',
      },
      securityReview: {
        type: String,
        default: '',
      },
      performanceReview: {
        type: String,
        default: '',
      },
      maintainabilityReview: {
        type: String,
        default: '',
      },
      bestPracticesReview: {
        type: String,
        default: '',
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
    aiProvider: {
      type: String,
      default: 'None',
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
      index: true,
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


