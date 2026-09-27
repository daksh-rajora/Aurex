import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repositoryId: {
      type: String,
      required: true,
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
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    githubUrl: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'TypeScript',
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate favorite records for the same repository per user
favoriteSchema.index({ user: 1, repositoryId: 1 }, { unique: true });
favoriteSchema.index({ user: 1, fullName: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
