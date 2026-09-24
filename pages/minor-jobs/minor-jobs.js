const {
  getRecommendedBanks,
  getOtherBankGroups
} = require('../../utils/minor-banks.js');

Page({
  data: {
    mediumTopCategory: '',
    majorOrder: 0,
    topIndex: 0,
    recommendedBanks: [],
    otherGroups: [],
    completedMap: {},
    progressKey: '',
    dialogVisible: false,
    currentBank: null
  },

  onLoad() {
    const mediumResult = wx.getStorageSync('mediumQuizResult');
    if (!mediumResult) {
      wx.showToast({ title: '请先完成中类测评', icon: 'none', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({
      mediumTopCategory: mediumResult.topCategory,
      majorOrder: mediumResult.majorOrder || 0,
      topIndex: mediumResult.topIndex || 0
    });
  },

  onShow() {
    const { majorOrder, topIndex } = this.data;
    if (!majorOrder) return;

    const recommendedBanks = getRecommendedBanks(majorOrder, topIndex);
    const otherGroups = getOtherBankGroups(majorOrder, topIndex);
    const completedMap = wx.getStorageSync('minorQuizResults') || {};
    const progressCache = wx.getStorageSync('quizProgressCache');
    const progressKey = (progressCache && progressCache.quizType === 'minor')
      ? `${progressCache.majorOrder}-${progressCache.mediumCode}-${progressCache.minorCode}`
      : '';

    recommendedBanks.forEach(b => {
      b.completed = !!completedMap[b.key];
      b.hasProgress = progressKey === b.key;
    });
    otherGroups.forEach(group => {
      group.banks.forEach(b => {
        b.completed = !!completedMap[b.key];
        b.hasProgress = progressKey === b.key;
      });
    });

    this.setData({ recommendedBanks, otherGroups, completedMap, progressKey });
  },

  onBankTap(e) {
    const key = e.currentTarget.dataset.key;
    const bank = this._findBank(key);
    if (!bank) return;

    if (bank.hasProgress) {
      this.setData({ dialogVisible: true, currentBank: bank });
    } else {
      this._startQuiz(bank, false);
    }
  },

  onDialogConfirm() {
    const bank = this.data.currentBank;
    this.setData({ dialogVisible: false, currentBank: null });
    if (bank) this._startQuiz(bank, true);
  },

  onDialogCancel() {
    const bank = this.data.currentBank;
    this.setData({ dialogVisible: false, currentBank: null });
    if (bank) this._startQuiz(bank, false);
  },

  viewResult(e) {
    const key = e.currentTarget.dataset.key;
    wx.navigateTo({
      url: `/pages/result/result?from=storage&type=minor&bank=${key}`
    });
  },

  _findBank(key) {
    const all = [...this.data.recommendedBanks];
    this.data.otherGroups.forEach(g => all.push(...g.banks));
    return all.find(b => b.key === key) || null;
  },

  _startQuiz(bank, loadCache) {
    wx.navigateTo({
      url: `/pages/quiz/quiz?type=minor&majorOrder=${bank.major}&mediumCode=${bank.mediumCode}&minorCode=${bank.minorCode}${loadCache ? '&loadCache=1' : ''}`
    });
  }
});
