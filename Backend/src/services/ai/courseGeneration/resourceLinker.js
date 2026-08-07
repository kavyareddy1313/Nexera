/**
 * Stage E — Resource Linking
 * Finds YouTube videos and optional articles for each lesson.
 * 
 * - If YOUTUBE_API_KEY is set: uses YouTube Data API v3
 * - Otherwise: constructs YouTube search URLs for manual linking in review UI
 */

// In-memory cache for YouTube search results (avoids duplicate API calls)
const youtubeCache = new Map();

/**
 * Search YouTube for a relevant video
 * @param {string} query
 * @param {Object} [options]
 * @returns {Promise<{ videoId: string, title: string } | null>}
 */
async function searchYouTube(query, options = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (youtubeCache.has(cacheKey)) {
    return youtubeCache.get(cacheKey);
  }

  if (!apiKey) {
    // No API key — return a search URL for manual override
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const fallback = {
      videoId: null,
      title: `Search YouTube: "${query}"`,
      searchUrl,
      isManual: true,
    };
    youtubeCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '3',
      order: 'relevance',
      videoDuration: 'medium', // Avoid Shorts
      key: apiKey,
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

    if (!response.ok) {
      console.warn(`[ResourceLinker] YouTube API error: ${response.status}`);
      const fallback = {
        videoId: null,
        title: `Search YouTube: "${query}"`,
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        isManual: true,
      };
      youtubeCache.set(cacheKey, fallback);
      return fallback;
    }

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) {
      youtubeCache.set(cacheKey, null);
      return null;
    }

    const best = items[0];
    const result = {
      videoId: best.id?.videoId || null,
      title: best.snippet?.title || query,
      isManual: false,
    };

    youtubeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`[ResourceLinker] YouTube search failed: ${err.message}`);
    youtubeCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Link resources for a single lesson
 * @param {Object} params
 * @param {string} params.lessonTitle
 * @param {string} params.courseTitle
 * @param {string} params.moduleName
 * @returns {Promise<{ youtubeVideoId: string|null, youtubeVideoTitle: string|null, extraResources: Array }>}
 */
export async function linkResources(params) {
  const { lessonTitle, courseTitle, moduleName } = params;

  // Build a focused search query
  const query = `${lessonTitle} ${courseTitle} tutorial`;

  const youtube = await searchYouTube(query);

  // Build extra resources (article links via YouTube search as placeholder)
  const extraResources = [];

  if (youtube?.isManual) {
    extraResources.push({
      title: `Find videos: ${lessonTitle}`,
      url: youtube.searchUrl,
      type: 'youtube_search',
    });
  }

  return {
    youtubeVideoId: youtube?.videoId || null,
    youtubeVideoTitle: youtube?.title || null,
    extraResources,
  };
}

/**
 * Clear the YouTube cache (useful between generation jobs)
 */
export function clearResourceCache() {
  youtubeCache.clear();
}
