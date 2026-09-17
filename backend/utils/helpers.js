const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const calculatePercentage = (present, total) => {
  if (!total || total === 0) return 0;
  return parseFloat(((present / total) * 100).toFixed(1));
};

const calculateRequiredClasses = (present, total, targetMinPercent = 75) => {
  if (total === 0) return 0;
  const currentPercent = (present / total) * 100;
  if (currentPercent >= targetMinPercent) return 0;

  // (present + X) / (total + X) >= target / 100
  // 100*present + 100*X >= target*total + target*X
  // X * (100 - target) >= target*total - 100*present
  // X = ceil((target*total - 100*present) / (100 - target))
  const target = targetMinPercent;
  const needed = Math.ceil((target * total - 100 * present) / (100 - target));
  return needed > 0 ? needed : 0;
};

module.exports = {
  generateToken,
  calculatePercentage,
  calculateRequiredClasses
};
