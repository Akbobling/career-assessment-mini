const CATEGORIES = [
  "管理型",
  "技术型",
  "办事型",
  "服务型",
  "生产型",
  "加工型",
  "军队型"
];

const FULL_CATEGORIES = [
  "第一大类：管理型",
  "第二大类：技术型",
  "第三大类：办事型",
  "第四大类：服务型",
  "第五大类：生产型",
  "第六大类：加工型",
  "第七大类：军队型"
];

function calculateVariance(arr) {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / arr.length;
}

function computeResult(answers, answerTimes, categories, fullCategories, itemsPerCategory) {
  const labels = categories || CATEGORIES;
  const fullLabels = fullCategories || FULL_CATEGORIES;
  const maxPerGroup = itemsPerCategory || 6;

  const groupScores = {};
  const groupValues = {};
  const groupTimes = {};

  labels.forEach((_, i) => {
    groupScores[i] = 0;
    groupValues[i] = [];
    groupTimes[i] = 0;
  });

  Object.keys(answers).forEach(key => {
    const parts = key.split('-');
    const groupIndex = parseInt(parts[0]) - 1;
    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= labels.length) {
      console.error(`Invalid answer key format: ${key}`);
      return;
    }
    const value = answers[key];
    groupScores[groupIndex] += value;
    groupValues[groupIndex].push(value);
    if (answerTimes && answerTimes[key]) {
      groupTimes[groupIndex] += answerTimes[key];
    }
  });

  const maxScore = Math.max(...Object.values(groupScores));

  const topCandidates = Object.keys(groupScores)
    .filter(i => groupScores[i] === maxScore)
    .map(Number);

  let topIndex;
  if (topCandidates.length === 1) {
    topIndex = topCandidates[0];
  } else {
    const minVariance = Math.min(...topCandidates.map(i => calculateVariance(groupValues[i])));
    const varianceCandidates = topCandidates.filter(i => calculateVariance(groupValues[i]) === minVariance);

    if (varianceCandidates.length === 1) {
      topIndex = varianceCandidates[0];
    } else {
      const minTime = Math.min(...varianceCandidates.map(i => groupTimes[i]));
      const timeCandidates = varianceCandidates.filter(i => groupTimes[i] === minTime);
      topIndex = timeCandidates[0];
    }
  }

  const maxPossible = maxPerGroup * 5;
  const chartData = labels.map((label, i) => ({
    label: label,
    fullLabel: fullLabels[i],
    score: groupScores[i],
    maxScore: maxPossible,
    percent: maxScore > 0 ? Math.round((groupScores[i] / maxPossible) * 100) : 0,
    variance: calculateVariance(groupValues[i]).toFixed(2),
    isTop: i === topIndex
  }));

  return {
    topCategory: fullLabels[topIndex],
    topIndex,
    chartData
  };
}

module.exports = { computeResult, CATEGORIES, FULL_CATEGORIES };
