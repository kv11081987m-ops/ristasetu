/**
 * Calculates a match percentage between the current user and a target profile.
 * Factors:
 * - Age (30%): Closer age = higher score
 * - Religion (25%): Exact match = full score
 * - Community/Caste (15%): Exact match = full score
 * - City/Location (20%): Same city = full score, Same state = half score
 * - Occupation/Profession (10%): Similar field or any match = score
 */
export const calculateMatchPercentage = (user, profile) => {
  if (!user || !profile) return 0;

  let totalScore = 0;

  // 1. Age (30%)
  const ageDiff = Math.abs(parseInt(user.age) - parseInt(profile.age));
  if (ageDiff === 0) totalScore += 30;
  else if (ageDiff <= 2) totalScore += 25;
  else if (ageDiff <= 5) totalScore += 15;
  else if (ageDiff <= 10) totalScore += 5;

  // 2. Religion (25%)
  if (user.religion?.toLowerCase() === profile.religion?.toLowerCase()) {
    totalScore += 25;
  }

  // 3. Community/Caste (15%)
  const userCaste = (user.caste || user.community || "").toLowerCase();
  const profileCaste = (profile.caste || profile.community || "").toLowerCase();
  if (userCaste === profileCaste && userCaste !== "") {
    totalScore += 15;
  }

  // 4. Location (20%)
  if (user.city?.toLowerCase() === profile.city?.toLowerCase()) {
    totalScore += 20;
  } else if (user.state?.toLowerCase() === profile.state?.toLowerCase()) {
    totalScore += 10;
  }

  // 5. Profession (10%)
  const userOcc = (user.occupation || user.profession || "").toLowerCase();
  const profileOcc = (profile.occupation || profile.profession || "").toLowerCase();
  if (userOcc === profileOcc && userOcc !== "") {
    totalScore += 10;
  } else {
    // Basic keyword matching for common industries
    const industries = ["engineer", "doctor", "teacher", "manager", "business", "developer"];
    const matched = industries.some(ind => userOcc.includes(ind) && profileOcc.includes(ind));
    if (matched) totalScore += 7;
  }

  // Ensure minimum 60% match for "recommended" feel, unless very different
  return Math.max(60, Math.min(100, totalScore + 40)); 
};
