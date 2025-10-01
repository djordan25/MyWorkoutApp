export function parseMaxRep(target) {
  const m = /(\d+)\s*to\s*(\d+)/i.exec(target || "");
  return m ? parseInt(m[2], 10) : null;
}

export function getEstMin(r) {
  // If user has set a custom estimate, use that
  if (typeof r.est === "number" && isFinite(r.est) && r.est > 0) return Math.max(1, r.est);
  
  // Special cases
  if (/ab ripper x/i.test(r.exercise)) return 16;
  if (/stretch-it/i.test(r.exercise)) {
    if (/Long Session/i.test(r.focus)) return 40;
    if (/Recovery/i.test(r.exercise)) return 18;
    if (/Mobility/i.test(r.exercise)) return 12;
    return 15;
  }
  if (/reverse hyper/i.test(r.exercise) && /light/i.test(r.exercise)) return r.sets * 1.3;
  if (/reverse hyper/i.test(r.exercise)) return r.sets * 1.6;
  
  // Standard calculation: 4 seconds per max target rep + 1.5 minutes rest between sets + 3 minutes setup/transition
  const maxRep = parseMaxRep(r.target);
  const sets = r.sets || 1;
  
  if (maxRep === null) {
    // Fallback if no valid target format
    return Math.max(1, sets * 2 + 3);
  }
  
  // Time to perform all sets (4 seconds per rep, convert to minutes)
  const workTime = (maxRep * 4 / 60) * sets;
  
  // Rest time between sets (1.5 minutes between each set)
  const restTime = 1.5 * (sets - 1);
  
  // Transition/setup time between exercises (3 minutes)
  const transitionTime = 3;
  
  // Total time
  const total = workTime + restTime + transitionTime;
  
  return Math.max(1, Math.round(total * 10) / 10);
}
