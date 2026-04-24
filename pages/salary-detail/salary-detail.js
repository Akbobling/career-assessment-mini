const db = wx.cloud.database();

Page({
  data: {
    reportId: '',
    report: null,
    comments: [],
    commentInput: '',
    replyTo: null,
    isLiked: false,
    isCollected: false,
    loading: true,
    commentLoading: false,
    refreshTimer: null
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ reportId: id });
    this.loadReport();
    this.loadComments();
    this.checkUserActions();
    this.startCommentRefresh();
  },

  onUnload() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
    }
  },

  async loadReport() {
    try {
      const res = await db.collection('SALARY_REPORTS').doc(this.data.reportId).get();
      const reportData = res.data;
      reportData.formattedTimestamp = this.formatTimestamp(reportData.timestamp);
      this.setData({ report: reportData, loading: false });
    } catch (err) {
      console.error('加载爆料详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
  },

  async loadComments() {
    try {
      this.setData({ commentLoading: true });
      const res = await db.collection('SALARY_COMMENTS')
        .where({ reportId: this.data.reportId })
        .orderBy('timestamp', 'desc')
        .get();
      this.setData({ comments: res.data, commentLoading: false });
    } catch (err) {
      console.error('加载评论失败:', err);
      this.setData({ commentLoading: false });
    }
  },

  async checkUserActions() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.nickName) return;

      const res = await db.collection('USER_ACTIONS')
        .where({
          userId: userInfo.nickName,
          reportId: this.data.reportId
        })
        .get();

      const actions = {};
      res.data.forEach(item => {
        actions[item.actionType] = true;
      });

      this.setData({
        isLiked: actions.like || false,
        isCollected: actions.collect || false
      });
    } catch (err) {
      console.error('检查用户行为失败:', err);
    }
  },

  startCommentRefresh() {
    // 5分钟自动刷新评论
    this.setData({
      refreshTimer: setInterval(() => {
        this.loadComments();
      }, 5 * 60 * 1000)
    });
  },

  async onLike() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.nickName) {
        wx.showToast({ title: '请先完善个人信息', icon: 'none' });
        return;
      }

      const isLiked = this.data.isLiked;

      if (isLiked) {
        // 取消点赞
        await db.collection('USER_ACTIONS')
          .where({
            userId: userInfo.nickName,
            reportId: this.data.reportId,
            actionType: 'like'
          })
          .remove();
        await db.collection('SALARY_REPORTS').doc(this.data.reportId).update({
          data: { likes: db.command.inc(-1) }
        });
        await db.collection('USER_PROFILES').limit(1).get().then(res => {
          if (res.data.length > 0) {
            const likes = res.data[0].likes || [];
            const newLikes = likes.filter(id => id !== this.data.reportId);
            db.collection('USER_PROFILES').doc(res.data[0]._id).update({
              data: { likes: newLikes }
            });
          }
        });
        this.setData({ isLiked: false, 'report.likes': this.data.report.likes - 1 });
      } else {
        // 点赞
        await db.collection('USER_ACTIONS').add({
          data: {
            userId: userInfo.nickName,
            reportId: this.data.reportId,
            actionType: 'like',
            timestamp: Date.now()
          }
        });
        await db.collection('SALARY_REPORTS').doc(this.data.reportId).update({
          data: { likes: db.command.inc(1) }
        });
        await db.collection('USER_PROFILES').limit(1).get().then(res => {
          if (res.data.length > 0) {
            const likes = res.data[0].likes || [];
            if (!likes.includes(this.data.reportId)) {
              likes.push(this.data.reportId);
              db.collection('USER_PROFILES').doc(res.data[0]._id).update({
                data: { likes: likes }
              });
            }
          }
        });
        this.setData({ isLiked: true, 'report.likes': this.data.report.likes + 1 });
      }
    } catch (err) {
      console.error('点赞操作失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async onCollect() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.nickName) {
        wx.showToast({ title: '请先完善个人信息', icon: 'none' });
        return;
      }

      const isCollected = this.data.isCollected;

      if (isCollected) {
        // 取消收藏
        await db.collection('USER_ACTIONS')
          .where({
            userId: userInfo.nickName,
            reportId: this.data.reportId,
            actionType: 'collect'
          })
          .remove();
        await db.collection('SALARY_REPORTS').doc(this.data.reportId).update({
          data: { collects: db.command.inc(-1) }
        });
        await db.collection('USER_PROFILES').limit(1).get().then(res => {
          if (res.data.length > 0) {
            const collects = res.data[0].collects || [];
            const newCollects = collects.filter(id => id !== this.data.reportId);
            db.collection('USER_PROFILES').doc(res.data[0]._id).update({
              data: { collects: newCollects }
            });
          }
        });
        this.setData({ isCollected: false, 'report.collects': this.data.report.collects - 1 });
      } else {
        // 收藏
        await db.collection('USER_ACTIONS').add({
          data: {
            userId: userInfo.nickName,
            reportId: this.data.reportId,
            actionType: 'collect',
            timestamp: Date.now()
          }
        });
        await db.collection('SALARY_REPORTS').doc(this.data.reportId).update({
          data: { collects: db.command.inc(1) }
        });
        await db.collection('USER_PROFILES').limit(1).get().then(res => {
          if (res.data.length > 0) {
            const collects = res.data[0].collects || [];
            if (!collects.includes(this.data.reportId)) {
              collects.push(this.data.reportId);
              db.collection('USER_PROFILES').doc(res.data[0]._id).update({
                data: { collects: collects }
              });
            }
          }
        });
        this.setData({ isCollected: true, 'report.collects': this.data.report.collects + 1 });
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onShare() {
    wx.showShareMenu({ withShareTicket: true });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  onReplyComment(e) {
    const commentId = e.currentTarget.dataset.id;
    const comment = this.data.comments.find(c => c._id === commentId);
    if (comment) {
      this.setData({ replyTo: comment });
    }
  },

  onCancelReply() {
    this.setData({ replyTo: null });
  },

  async submitComment() {
    const { commentInput, replyTo } = this.data;
    if (!commentInput.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.nickName) {
      wx.showToast({ title: '请先完善个人信息', icon: 'none' });
      return;
    }

    try {
      const userName = userInfo.nickName;

      await db.collection('SALARY_COMMENTS').add({
        data: {
          reportId: this.data.reportId,
          userId: userInfo.nickName,
          userName: userName,
          content: commentInput,
          replyTo: replyTo ? replyTo._id : null,
          timestamp: Date.now(),
          likes: 0
        }
      });

      await db.collection('SALARY_REPORTS').doc(this.data.reportId).update({
        data: { comments: db.command.inc(1) }
      });

      this.setData({
        commentInput: '',
        replyTo: null,
        'report.comments': this.data.report.comments + 1
      });

      wx.showToast({ title: '评论成功', icon: 'success' });
      this.loadComments();
    } catch (err) {
      console.error('评论失败:', err);
      wx.showToast({ title: '评论失败', icon: 'none' });
    }
  }
});
