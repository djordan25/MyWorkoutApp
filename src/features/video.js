import { store } from "../core/storage.js";
import { stateManager } from "../core/stateManager.js";
import { exSlug } from "../routines/ids.js";
import { getExercise } from "../loaders/exerciseLoader.js";

export function getVideoURLByExercise(ex) {
  // First check exercise library
  const slug = exSlug(ex);
  const exercise = getExercise(slug);
  if (exercise && exercise.videoUrl) {
    return exercise.videoUrl;
  }
  
  // Fall back to stored videos (for backward compatibility)
  return store.__videos?.[slug] || "";
}
export function setVideoURLByExercise(ex, url) {
  if (!store.__videos) store.__videos = {};
  store.__videos[exSlug(ex)] = url.trim();
  stateManager.updateStore({ __videos: store.__videos });
}
export function looksLikeDirectVideo(u) {
  try {
    const x = new URL(u);
    if (x.hostname.includes("youtube.com") || x.hostname.includes("youtu.be"))
      return !!(
        x.searchParams.get("v") ||
        x.pathname.includes("/shorts/") ||
        x.pathname.includes("/embed/") ||
        /^[\/][A-Za-z0-9_-]{11}$/.test(x.pathname)
      );
    if (x.hostname.includes("vimeo.com")) return /\d+/.test(x.pathname);
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(u);
  } catch {
    return false;
  }
}
