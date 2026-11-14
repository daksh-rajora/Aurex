import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Info'],
      default: 'Medium',
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Dependency Vulnerability (SCA)',
        'Exposed Secret',
        'Injection Risk',
        'Insecure Configuration',
        'Authentication Weakness',
        'AI Security Suggestion',
      ],
      default: 'Insecure Configuration',
      index: true,
    },
    origin: {
      type: String,
      enum: ['scanner', 'ai'],
      default: 'scanner',
      index: true,
    },
    scannerType: {
      type: String,
      enum: ['SCA', 'SAST', 'AI'],
      default: 'SAST',
    },
    description: {
      type: String,
      default: '',
    },
    evidence: {
      type: String,
      default: '',
    },
    file: {
      type: String,
      default: '',
      index: true,
    },
    line: {
      type: Number,
      default: null,
    },
    remediation: {
      type: String,
      default: '',
    },
    cve: {
      type: String,
      default: '',
      trim: true,
    },
    references: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['unresolved', 'resolved'],
      default: 'unresolved',
      index: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedScanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityScan',
      default: null,
    },
    resolutionNote: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const securityScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
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
        index: true,
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
    sourceType: {
      type: String,
      enum: ['connected', 'public'],
      default: 'public',
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Scanning', 'Completed', 'Failed'],
      default: 'Pending',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    securityScore: {
      type: Number,
      default: null,
    },
    metrics: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
      totalFindings: { type: Number, default: 0 },
      resolvedFindings: { type: Number, default: 0 },
      unresolvedFindings: { type: Number, default: 0 },
      scannerFindingsCount: { type: Number, default: 0 },
      aiFindingsCount: { type: Number, default: 0 },
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
    scannedFilesCount: {
      type: Number,
      default: 0,
    },
    dependenciesScannedCount: {
      type: Number,
      default: 0,
    },
    aiReview: {
      summary: { type: String, default: '' },
      recommendations: { type: [String], default: [] },
      riskLevel: { type: String, default: 'Low' },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

securityScanSchema.index({ user: 1, createdAt: -1 });
securityScanSchema.index({ 'repository.fullName': 1, createdAt: -1 });
securityScanSchema.index({ user: 1, 'repository.fullName': 1, status: 1 });

const SecurityScan = mongoose.model('SecurityScan', securityScanSchema);

export default SecurityScan;
