const { computeResult, CATEGORIES, FULL_CATEGORIES } = require('../../utils/scoring.js');
const { getCollectionName, getAllBanks } = require('../../utils/minor-banks.js');
const db = wx.cloud.database();

Page({
  data: {
    topCategory: '',
    chartData: [],
    quizType: 'major',
    majorOrder: 0,
    bankTitle: ''
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
      let saved = null;
      if (type === 'major') {
        saved = wx.getStorageSync('majorQuizResult');
      } else if (type === 'medium') {
        saved = wx.getStorageSync('mediumQuizResult');
      } else if (type === 'minor') {
        const minorMap = wx.getStorageSync('minorQuizResults') || {};
        saved = minorMap[options.bank] || null;
      }
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
      } else if (quizType === 'minor') {
        const mediumCode = options.mediumCode || '';
        const minorCode = options.minorCode || '';
        const bankKey = options.bank || `${majorOrder}-${mediumCode}-${minorCode}`;
        const minorRes = await db.collection(getCollectionName(bankKey))
          .orderBy('order', 'asc')
          .limit(100)
          .get();
        const questions = minorRes.data;
        cats = questions.map(q => q.category);
        fullCats = cats;
        perGroup = questions.length > 0 ? (questions[0].items || []).length : 4;
      }

      // 三种问卷类型统一在此计算结果
      resultData = computeResult(answers, answerTimes, cats, fullCats, perGroup);
      resultData.quizType = quizType;
      resultData.majorOrder = majorOrder;
      resultData.timestamp = Date.now();

      // 细类问卷附加题库信息
      if (quizType === 'minor') {
        const mediumCode = options.mediumCode || '';
        const minorCode = options.minorCode || '';
        const bankKey = options.bank || `${majorOrder}-${mediumCode}-${minorCode}`;
        resultData.mediumCode = mediumCode;
        resultData.minorCode = minorCode;
        resultData.bankKey = bankKey;
        const bankConfig = getAllBanks().find(b => b.key === bankKey);
        resultData.bankTitle = bankConfig ? bankConfig.title : '';
      }

      this._saveReport(resultData);
    }

    const quizType = resultData.quizType || 'major';
    const majorOrder = resultData.majorOrder || 0;

    // 条形图标签去掉括号内容（如「科学型（科学研究人员）」->「科学型」），便于阅读
    const chartData = (resultData.chartData || []).map(item => ({
      ...item,
      shortLabel: (item.label || '').replace(/[（(][^（）()]*[）)]/g, '')
    }));

    this.setData({
      topCategory: resultData.topCategory,
      chartData,
      quizType,
      majorOrder,
      bankTitle: resultData.bankTitle || ''
    });
  },

  async _saveReport(resultData) {
    try {
      let quizName;
      if (resultData.quizType === 'major') {
        quizName = '大类职业适配度问卷';
      } else if (resultData.quizType === 'minor') {
        quizName = `细类职业适配度问卷·${resultData.bankTitle || resultData.bankKey || ''}`;
      } else {
        quizName = `第${['一','二','三','四','五','六','七'][resultData.majorOrder - 1] || ''}大类·中类职业适配度问卷`;
      }

      const report = {
        quizName,
        quizType: resultData.quizType,
        majorOrder: resultData.majorOrder,
        mediumCode: resultData.mediumCode || '',
        minorCode: resultData.minorCode || '',
        bankKey: resultData.bankKey || '',
        bankTitle: resultData.bankTitle || '',
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
