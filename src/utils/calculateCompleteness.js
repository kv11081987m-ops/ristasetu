/**
 * Calculates the profile completeness score for a user.
 * 
 * Weights:
 * - Photo: 25%
 * - Name: 15%
 * - Gender: 10%
 * - About: 20%
 * - Occupation: 15%
 * - Location: 15%
 * 
 * @param {Object} user - The user profile object
 * @returns {number} The completeness score (0-100)
 */
export const calculateCompleteness = (user) => {
  if (!user) return 0;

  let score = 0;

  // Photo (25%)
  if (user.photoUrl && user.photoUrl.trim() !== '') {
    score += 25;
  }

  // Name (15%)
  if (user.name && user.name.trim() !== '') {
    score += 15;
  }

  // Gender (10%)
  if (user.gender && user.gender.trim() !== '') {
    score += 10;
  }

  // About (20%)
  if (user.aboutMe && user.aboutMe.trim() !== '') {
    score += 20;
  }

  // Occupation / Profession (15%)
  const occupation = user.occupation || user.profession;
  if (occupation && occupation.trim() !== '') {
    score += 15;
  }

  // Location (15%)
  if (user.city && user.city.trim() !== '') {
    score += 15;
  }

  return Math.min(score, 100);
};
