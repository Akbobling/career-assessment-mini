const db = wx.cloud.database();

Page({
  data: {
    majorResult: null,
    mediumResult: null,
    dialogVisible: false,
    dialogType: '',
    cachedProgress: null,
    majorEmptyTip: '暂无测评记录，请先完成问卷',
    mediumEmptyTip: ''
  },

  onShow() {
    const majorResult = wx.getStorageSync('majorQuizResult') || null;
    const mediumResult = wx.getStorageSync('mediumQuizResult') || null;
    this.setData({ majorResult, mediumResult });

    this._loadCachedProgress();

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  _loadCachedProgress() {
    const cached = wx.getStorageSync('quizProgressCache') || null;
    this.setData({ cachedProgress: cached });

    const majorEmptyTip = (!this.data.majorResult && cached && cached.quizType === 'major')
      ? '点击上方按钮，可以继续上次未完成的作答'
      : '暂无测评记录，请先完成问卷';

    let mediumEmptyTip = '';
    if (this.data.majorResult && !this.data.mediumResult) {
      mediumEmptyTip = (cached && cached.quizType === 'medium')
        ? '点击上方按钮，可以继续上次未完成的作答'
        : '大类测评已完成，点击上方继续中类测评吧';
    }

    this.setData({ majorEmptyTip, mediumEmptyTip });
  },

  _clearCachedProgress() {
    wx.removeStorageSync('quizProgressCache');
    db.collection('QUIZ_PROGRESS_CACHE').limit(1).get().then(res => {
      if (res.data.length > 0) {
        db.collection('QUIZ_PROGRESS_CACHE').doc(res.data[0]._id).remove();
      }
    }).catch(err => {
      console.error('清除缓存进度失败：', err);
      wx.showToast({ title: '清除进度失败', icon: 'none' });
    });
  },

  goToQuiz() {
    const cachedProgress = wx.getStorageSync('quizProgressCache') || null;
    if (cachedProgress && cachedProgress.quizType === 'major') {
      this.setData({ dialogVisible: true, dialogType: 'loadMajor' });
    } else {
      wx.navigateTo({ url: '/pages/quiz/quiz?type=major' });
    }
  },

  goToMediumQuiz() {
    const majorResult = wx.getStorageSync('majorQuizResult') || null;
    if (!majorResult) {
      wx.showToast({ title: '请先完成大类问卷', icon: 'none', duration: 2000 });
      return;
    }
    const majorOrder = majorResult.topIndex + 1;
    const cachedProgress = wx.getStorageSync('quizProgressCache') || null;
    if (cachedProgress && cachedProgress.quizType === 'medium' && cachedProgress.majorOrder === majorOrder) {
      this.setData({ dialogVisible: true, dialogType: 'loadMedium' });
    } else {
      wx.navigateTo({ url: `/pages/quiz/quiz?type=medium&majorOrder=${majorOrder}` });
    }
  },

  viewMajorReport() {
    wx.navigateTo({ url: '/pages/result/result?from=storage&type=major' });
  },

  viewMediumReport() {
    wx.navigateTo({ url: '/pages/result/result?from=storage&type=medium' });
  },

  retakeMajorQuiz() {
    this.setData({ dialogVisible: true, dialogType: 'major' });
  },

  retakeMediumQuiz() {
    this.setData({ dialogVisible: true, dialogType: 'medium' });
  },

  onRetakeConfirm() {
    const { dialogType, cachedProgress } = this.data;
    this.setData({ dialogVisible: false, dialogType: '' });

    if (dialogType === 'major') {
      wx.removeStorageSync('majorQuizResult');
      wx.removeStorageSync('mediumQuizResult');
      if (cachedProgress && cachedProgress.quizType === 'medium') {
        this._clearCachedProgress();
      }
      this.setData({ majorResult: null, mediumResult: null, cachedProgress: null });
      wx.navigateTo({ url: '/pages/quiz/quiz?type=major' });
    } else if (dialogType === 'medium') {
      wx.removeStorageSync('mediumQuizResult');
      this.setData({ mediumResult: null });
      const majorResult = this.data.majorResult;
      if (!majorResult) {
        wx.showToast({ title: '请先完成大类问卷', icon: 'none' });
        return;
      }
      const majorOrder = majorResult.topIndex + 1;
      wx.navigateTo({ url: `/pages/quiz/quiz?type=medium&majorOrder=${majorOrder}` });
    } else if (dialogType === 'loadMajor') {
      wx.navigateTo({ url: '/pages/quiz/quiz?type=major&loadCache=1' });
    } else if (dialogType === 'loadMedium') {
      const majorResult = wx.getStorageSync('majorQuizResult') || null;
      const majorOrder = majorResult ? majorResult.topIndex + 1 : 1;
      wx.navigateTo({ url: `/pages/quiz/quiz?type=medium&majorOrder=${majorOrder}&loadCache=1` });
    }
  },

  onLoadCacheCancel() {
    const { dialogType } = this.data;
    this.setData({ dialogVisible: false, dialogType: '' });
    this._clearCachedProgress();

    if (dialogType === 'loadMajor') {
      wx.navigateTo({ url: '/pages/quiz/quiz?type=major' });
    } else if (dialogType === 'loadMedium') {
      const majorResult = wx.getStorageSync('majorQuizResult') || null;
      const majorOrder = majorResult ? majorResult.topIndex + 1 : 1;
      wx.navigateTo({ url: `/pages/quiz/quiz?type=medium&majorOrder=${majorOrder}` });
    }
  },

  onRetakeCancel() {
    this.setData({ dialogVisible: false, dialogType: '' });
  },

  goToMinorJobs() {
    const mediumResult = wx.getStorageSync('mediumQuizResult') || null;
    if (!mediumResult) {
      wx.showToast({
        title: '请先完成中类测评',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/minor-jobs/minor-jobs?mediumCategory=${encodeURIComponent(mediumResult.topCategory)}`
    });
  }
})