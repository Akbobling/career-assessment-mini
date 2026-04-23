const { computeResult, CATEGORIES, FULL_CATEGORIES } = require('../../utils/scoring.js');
const db = wx.cloud.database();

Page({
  data: {
    topCategory: '',
    chartData: [],
    quizType: 'major',
    majorOrder: 0
  },

  async onLoad(options) {
    let resultData;

    if (options.from === 'cloud' && options.id) {
      try {
        wx.showLoading({ title: '加载中...', mask: true });
        const res = await db.collection('QUIZ_REPORTS').doc(options.id).get();
        resultData = res.data;
        wx.hideLoading();
      } catch (err) {
        wx.hideLoading();
        console.error('获取报告失败：', err);
        wx.showToast({ title: '报告加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
    } else if (options.from === 'storage') {
      const type = options.type || 'major';
      const saved = type === 'major'
        ? wx.getStorageSync('majorQuizResult')
        : wx.getStorageSync('mediumQuizResult');
      if (saved) {
        resultData = saved;
      } else {
        wx.showToast({ title: '暂无测评记录', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
    } else {
      const answers = JSON.parse(decodeURIComponent(options.answers || '{}'));
      const answerTimes = options.answerTimes ? JSON.parse(decodeURIComponent(options.answerTimes)) : null;
      const quizType = options.type || 'major';
      const majorOrder = parseInt(options.majorOrder) || 0;

      let cats = null;
      let fullCats = null;
      let perGroup = null;

      if (quizType === 'medium') {
        const mediumRes = await db.collection(`MEDIUM_CATEGORY_QUESTIONS_${majorOrder}`)
          .orderBy('order', 'asc')
          .get();
        const questions = mediumRes.data;
        cats = questions.map(q => q.category);
        const numChar = ['一','二','三','四','五','六','七'][majorOrder - 1] || '';
        fullCats = questions.map(q => `第${numChar}大类·${q.category}`);
        perGroup = questions.length > 0 ? (questions[0].items || []).length : 6;
      }

      resultData = computeResult(answers, answerTimes, cats, fullCats, perGroup);
      resultData.timestamp = Date.now();
      resultData.quizType = quizType;
      resultData.majorOrder = majorOrder;

      this._saveReport(resultData);
    }

    const quizType = resultData.quizType || 'major';
    const majorOrder = resultData.majorOrder || 0;

    this.setData({
      topCategory: resultData.topCategory,
      chartData: resultData.chartData,
      quizType,
      majorOrder
    });
  },

  async _saveReport(resultData) {
    try {
      const quizName = resultData.quizType === 'major'
        ? '大类职业适配度问卷'
        : `第${['一','二','三','四','五','六','七'][resultData.majorOrder - 1] || ''}大类·中类职业适配度问卷`;

      const report = {
        quizName,
        quizType: resultData.quizType,
        majorOrder: resultData.majorOrder,
        topCategory: resultData.topCategory,
        topIndex: resultData.topIndex,
        chartData: resultData.chartData,
        timestamp: resultData.timestamp || Date.now()
      };

      await db.collection('QUIZ_REPORTS').add({ data: report });

      const countRes = await db.collection('QUIZ_REPORTS')
        .where({ _openid: '{openid}' })
        .count();

      if (countRes.total > 30) {
        const oldestRes = await db.collection('QUIZ_REPORTS')
          .where({ _openid: '{openid}' })
          .orderBy('timestamp', 'asc')
          .limit(countRes.total - 30)
          .get();

        const deletePromises = oldestRes.data.map(r =>
          db.collection('QUIZ_REPORTS').doc(r._id).remove()
        );
        await Promise.all(deletePromises);
      }
    } catch (err) {
      console.error('保存报告失败：', err);
    }
  },

  goBack() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
