/**
 * VideoModal Component
 * Displays exercise videos in a modal with responsive sizing
 */

import { openModal } from "./modal.js";

/**
 * Detect if mobile device
 */
function isMobile() {
  return window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Open video modal with responsive player
 * @param {string} url - Video URL
 * @param {string} exerciseName - Name of the exercise
 */
export function openVideoModal(url, exerciseName) {
  const content = document.createElement("div");
  content.style.width = "100%";
  
  // On mobile, maximize the video player
  if (isMobile()) {
    content.style.maxWidth = "none";
    content.style.margin = "0";
  } else {
    content.style.maxWidth = "900px";
  }
  
  const videoContainer = document.createElement("div");
  videoContainer.style.position = "relative";
  videoContainer.style.paddingBottom = "56.25%"; // 16:9 aspect ratio
  videoContainer.style.height = "0";
  videoContainer.style.overflow = "hidden";
  videoContainer.style.borderRadius = isMobile() ? "0" : "10px";
  videoContainer.style.background = "#000";
  
  // On mobile, make it take full available height while maintaining aspect ratio
  if (isMobile()) {
    const maxHeight = window.innerHeight - 120; // Leave room for modal header/padding
    const maxWidth = window.innerWidth - 32; // Account for modal padding
    const aspectRatio = 16 / 9;
    
    // Calculate dimensions that fit within viewport while maintaining aspect ratio
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    videoContainer.style.width = width + "px";
    videoContainer.style.paddingBottom = "0";
    videoContainer.style.height = height + "px";
    videoContainer.style.margin = "0 auto";
  }
  
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.top = "0";
  iframe.style.left = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
  
  // Convert URL to embed format if needed
  let embedUrl = url;
  if (url.includes("youtube.com/watch")) {
    const videoId = new URL(url).searchParams.get("v");
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes("youtube.com/shorts/")) {
    const videoId = url.split("shorts/")[1].split("?")[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes("vimeo.com/")) {
    const videoId = url.split("vimeo.com/")[1].split("?")[0];
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  }
  
  iframe.src = embedUrl;
  videoContainer.appendChild(iframe);
  content.appendChild(videoContainer);
  
  openModal({ title: exerciseName, content });
}
