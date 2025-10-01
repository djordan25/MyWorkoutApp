/**
 * Device detection utilities
 */

/**
 * Detect if the current device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobile() {
  return window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Detect if device supports touch
 * @returns {boolean} True if touch is supported
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
