import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import Favorite from '../../models/Favorite.js';

/**
 * Controller to toggle (add/remove) a repository favorite in MongoDB for the authenticated user.
 */
export const toggleFavorite = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const {
    repositoryId,
    name,
    fullName,
    owner,
    githubUrl,
    language,
    stars,
    forks,
    isPrivate,
  } = req.body || {};

  if (!repositoryId && !fullName) {
    throw new ApiError(400, 'Repository ID or full name is required');
  }

  const targetRepoId = String(repositoryId || fullName);
  const targetRepoName = name || (fullName ? fullName.split('/')[1] : 'repository');
  const targetFullName = fullName || `${owner || 'owner'}/${targetRepoName}`;

  // Check if repository is already favorited by this user
  const existingFavorite = await Favorite.findOne({
    user: userId,
    $or: [{ repositoryId: targetRepoId }, { fullName: targetFullName }],
  });

  if (existingFavorite) {
    // Remove from favorites
    await Favorite.findByIdAndDelete(existingFavorite._id);
    console.log(`[Favorite] Removed favorite for user ${userId}: ${targetFullName}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isFavorite: false,
          repositoryId: targetRepoId,
          repositoryName: targetRepoName,
          fullName: targetFullName,
        },
        `Removed ${targetRepoName} from Favorites`
      )
    );
  } else {
    // Add to favorites
    const newFavorite = await Favorite.create({
      user: userId,
      repositoryId: targetRepoId,
      name: targetRepoName,
      fullName: targetFullName,
      owner: owner || targetFullName.split('/')[0] || 'owner',
      githubUrl: githubUrl || `https://github.com/${targetFullName}`,
      language: language || 'TypeScript',
      stars: stars || 0,
      forks: forks || 0,
      isPrivate: Boolean(isPrivate),
    });

    console.log(`[Favorite] Added favorite for user ${userId}: ${targetFullName}`);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          isFavorite: true,
          repositoryId: targetRepoId,
          repositoryName: targetRepoName,
          fullName: targetFullName,
          favorite: newFavorite,
        },
        `Added ${targetRepoName} to Favorites`
      )
    );
  }
});

/**
 * Controller to fetch all favorited repositories for the authenticated user.
 */
export const getUserFavorites = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const favorites = await Favorite.find({ user: userId }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      favorites,
      'User favorites fetched successfully'
    )
  );
});

export default {
  toggleFavorite,
  getUserFavorites,
};
