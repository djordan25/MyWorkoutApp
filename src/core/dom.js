export const $ = (q, r = document) => r.querySelector(q);
export const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));
export const raf = (fn) => requestAnimationFrame(fn);
