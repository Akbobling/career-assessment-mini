const db = wx.cloud.database();
const { computeResult } = require('../../utils/scoring.js');

function flattenQuestions(questions) {
  const list = [];
  questions.forEach((group, groupIndex) => {
    (group.items || []).forEach((content, itemIndex) => {
      list.push({
        id: `${groupIndex + 1}-${itemIndex + 1}`,
        groupIndex,
        itemIndex,
        category: group.category,
        content
      });
    });
  });
  return list;
}

Page({
  data: {
    title: "职业测评",
    quizType: 'major',
    majorOrder: 0,
    options: [
      { value: 1, label: "完全不符合" },
      { value: 2, label: "不太符合" },
      { value: 3, label: "一般" },
      { value: 4, label: "比较符合" },
      { value: 5, label: "完全符合" }
    ],
    allQuestions: [],
    total: 0,
    currentIndex: 0,
    currentQuestion: null,
    selectedValue: 0,
    answers: {},
    answerTimes: {},
    questionStartTime: 0,
    animClass: 'anim-slide-in',
    categories: [],
    fullCategories: [],
    itemsPerCategory: 6,
    _submitted: false
  },

  async onLoad(options) {
    const quizType = options.type || 'major';
    const majorOrder = parseInt(options.majorOrder) || 0;
    const loadCache = options.loadCache === '1';
    this.setData({ quizType, majorOrder, _submitted: false });

    wx.showLoading({ title: '题库加载中...', mask: true });
    try {
      let questions;
      if (quizType === 'major') {
        const res = await db.collection('MAJOR_CATEGORY_QUESTIONS')
          .orderBy('order', 'asc')
          .get();
        questions = res.data;
      } else {
        const res = await db.collection(`MEDIUM_CATEGORY_QUESTIONS_${majorOrder}`)
          .orderBy('order', 'asc')
          .get();
        questions = res.data;
      }

      const categories = questions.map(q => q.category);
      const fullCategories = questions.map(q => `第${['一','二','三','四','五','六','七'][majorOrder - 1] || ''}大类·${q.category}`);
      const itemsPerCategory = questions.length > 0 ? (questions[0].items || []).length : 6;

      const allQuestions = flattenQuestions(questions);
      this.setData({
        allQuestions,
        total: allQuestions.length,
        categories,
        fullCategories,
        itemsPerCategory
      });

      if (loadCache) {
        await this._loadProgress();
      } else {
        this.updateCurrentQuestion(0);
      }
      this._startTimer();
    } catch (err) {
      console.error('获取题库失败：', err);
      wx.showToast({ title: '题库加载失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  _startTimer() {
    this._questionStartTime = Date.now();
  },

  updateCurrentQuestion(index) {
    const { allQuestions, answers } = this.data;
    const currentQuestion = allQuestions[index] || null;
    const selectedValue = currentQuestion ? answers[currentQuestion.id] || 0 : 0;
    this.setData({
      currentIndex: index,
      currentQuestion,
      selectedValue
    });
    this._startTimer();
  },

  onUnload() {
    if (!this.data._submitted && Object.keys(this.data.answers).length > 0) {
      this._saveProgressLocal();
      this._saveProgressCloud();
    }
  },

  _saveProgressLocal() {
    const { quizType, majorOrder, answers, answerTimes, currentIndex } = this.data;
    const cacheData = {
      quizType,
      majorOrder,
      answers,
      answerTimes,
      currentIndex,
      timestamp: Date.now()
    };
    wx.setStorageSync('quizProgressCache', cacheData);
  },

  _saveProgressCloud() {
    const cacheData = wx.getStorageSync('quizProgressCache');
    if (!cacheData) return;
    db.collection('QUIZ_PROGRESS_CACHE').where({ _openid: '{openid}' }).count().then(countRes => {
      if (countRes.total === 0) {
        db.collection('QUIZ_PROGRESS_CACHE').add({ data: cacheData });
      } else {
        db.collection('QUIZ_PROGRESS_CACHE').where({ _openid: '{openid}' }).get().then(res => {
          if (res.data.length > 0) {
            db.collection('QUIZ_PROGRESS_CACHE').doc(res.data[0]._id).update({ data: cacheData });
          }
        });
      }
    }).catch(err => {
      console.error('保存答题进度失败：', err);
    });
  },

  async _loadProgress() {
    try {
      const localCache = wx.getStorageSync('quizProgressCache');
      const cache = localCache || null;
      if (cache && cache.quizType === this.data.quizType && cache.majorOrder === this.data.majorOrder) {
        this.setData({
          answers: cache.answers || {},
          answerTimes: cache.answerTimes || {}
        });
        const idx = cache.currentIndex || 0;
        this.updateCurrentQuestion(idx);
        wx.showToast({ title: '已加载上次进度', icon: 'success', duration: 1500 });
        return;
      }
      this.updateCurrentQuestion(0);
    } catch (err) {
      console.error('加载答题进度失败：', err);
      this.updateCurrentQuestion(0);
    }
  },

  _clearProgress() {
    wx.removeStorageSync('quizProgressCache');
    db.collection('QUIZ_PROGRESS_CACHE').where({ _openid: '{openid}' }).get().then(res => {
      if (res.data.length > 0) {
        db.collection('QUIZ_PROGRESS_CACHE').doc(res.data[0]._id).remove();
      }
    }).catch(err => {
      console.error('清除答题进度失败：', err);
    });
  },

  handleBack() {
    if (!this.data._submitted && Object.keys(this.data.answers).length > 0) {
      this._saveProgressLocal();
      this._saveProgressCloud();
    }
    wx.navigateBack();
  },

  handleOptionTap(e) {
    const value = Number(e.currentTarget.dataset.value || 0);
    const { currentQuestion, answers, answerTimes } = this.data;
    if (!currentQuestion || !value) return;
    const alreadyAnswered = !!answers[currentQuestion.id];
    const elapsed = Date.now() - this._questionStartTime;
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value
    };
    const nextAnswerTimes = {
      ...answerTimes,
      [currentQuestion.id]: alreadyAnswered ? answerTimes[currentQuestion.id] : elapsed
    };
    this.setData({
      answers: nextAnswers,
      answerTimes: nextAnswerTimes,
      selectedValue: value
    });
    if (!alreadyAnswered) {
      setTimeout(() => {
        this.goNextWithAnim();
      }, 400);
    }
  },

  goPrev() {
    this.goPrevWithAnim();
  },

  goNext() {
    this.goNextWithAnim();
  },

  goNextWithAnim() {
    const { currentIndex, total } = this.data;
    if (currentIndex >= total - 1) return;
    this.setData({ animClass: 'anim-slide-out' });
    setTimeout(() => {
      this.updateCurrentQuestion(currentIndex + 1);
      this.setData({ animClass: 'anim-slide-in' });
    }, 200);
  },

  goPrevWithAnim() {
    const { currentIndex } = this.data;
    if (currentIndex === 0) return;
    this.setData({ animClass: 'anim-slide-out' });
    setTimeout(() => {
      this.updateCurrentQuestion(currentIndex - 1);
      this.setData({ animClass: 'anim-slide-in' });
    }, 200);
  },

  // DEBUG-START: 后门方法，上线前移除
  handleDebugFill() {
    const { allQuestions, answers, answerTimes } = this.data;
    const nextAnswers = { ...answers };
    const nextAnswerTimes = { ...answerTimes };
    allQuestions.forEach(q => {
      if (!nextAnswers[q.id]) {
        nextAnswers[q.id] = Math.floor(Math.random() * 5) + 1;
        nextAnswerTimes[q.id] = Math.floor(Math.random() * 3000) + 500;
      }
    });
    this.setData({ answers: nextAnswers, answerTimes: nextAnswerTimes }, () => {
      this.handleSubmit();
    });
  },
  // DEBUG-END

  handleSubmit() {
    const { total, answers, answerTimes, quizType, majorOrder, categories, fullCategories, itemsPerCategory } = this.data;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < total) {
      wx.showToast({
        title: `请先完成全部题目（${answeredCount}/${total}）`,
        icon: "none"
      });
      return;
    }

    const cats = quizType === 'major' ? null : categories;
    const fullCats = quizType === 'major' ? null : fullCategories;
    const perGroup = quizType === 'major' ? null : itemsPerCategory;
    const resultData = computeResult(answers, answerTimes, cats, fullCats, perGroup);

    resultData.timestamp = Date.now();
    resultData.quizType = quizType;
    resultData.majorOrder = majorOrder;
    if (quizType === 'major') {
      wx.setStorageSync('majorQuizResult', resultData);
    } else {
      wx.setStorageSync('mediumQuizResult', resultData);
    }

    const answersStr = encodeURIComponent(JSON.stringify(answers));
    const timesStr = encodeURIComponent(JSON.stringify(answerTimes));
    this.data._submitted = true;
    this._clearProgress();
    wx.redirectTo({
      url: `/pages/result/result?type=${quizType}&majorOrder=${majorOrder}&answers=${answersStr}&answerTimes=${timesStr}`
    });
  },
});
