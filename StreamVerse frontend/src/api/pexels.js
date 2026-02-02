import axios from "axios";

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || "sdMJksR8agtu7k2o8WsBugeJv55AmmyJbBmlGvtKQw1WAbLZ26vKmgNg";

// Debug log
console.log("Pexels API Key exists:", !!PEXELS_API_KEY, "Length:", PEXELS_API_KEY?.length);

const pexelsApi = axios.create({
  baseURL: "https://api.pexels.com",
  headers: {
    Authorization: PEXELS_API_KEY,
  },
});

// Get popular videos
export const getPopularVideos = async (perPage = 12) => {
  if (!PEXELS_API_KEY) {
    console.warn("Pexels API key not configured");
    return [];
  }
  try {
    console.log("Fetching Pexels videos...");
    const response = await pexelsApi.get("/videos/popular", {
      params: { per_page: perPage },
    });
    console.log("Pexels response:", response.data.videos?.length, "videos");
    return response.data.videos.map(formatVideo);
  } catch (error) {
    console.error("Error fetching Pexels videos:", error);
    return [];
  }
};

// Search videos by query
export const searchVideos = async (query, perPage = 12) => {
  try {
    const response = await pexelsApi.get("/videos/search", {
      params: { query, per_page: perPage },
    });
    return response.data.videos.map(formatVideo);
  } catch (error) {
    console.error("Error searching Pexels videos:", error);
    return [];
  }
};

// Format Pexels video to match your app's video format
const formatVideo = (video) => {
  // Get the best quality video file (HD preferred)
  const videoFile =
    video.video_files.find((f) => f.quality === "hd") ||
    video.video_files.find((f) => f.quality === "sd") ||
    video.video_files[0];

  return {
    _id: `pexels-${video.id}`,
    title: video.user.name + "'s Video",
    description: video.url,
    thumbnail: video.image,
    videoFile: videoFile?.link,
    duration: video.duration,
    views: Math.floor(Math.random() * 10000) + 1000, // Simulated views
    owner: {
      _id: `pexels-user-${video.user.id}`,
      username: video.user.name,
      avatar: video.user.url
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(video.user.name)}&background=random`
        : null,
    },
    createdAt: new Date().toISOString(),
    isPexels: true, // Flag to identify Pexels videos
    pexelsUrl: video.url, // Original Pexels URL for attribution
  };
};

export default { getPopularVideos, searchVideos };
