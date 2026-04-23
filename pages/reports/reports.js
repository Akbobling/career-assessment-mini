const db = wx.cloud.database();

Page({
  data: {
    reports: [],
    expandedValues: []
  },

  onLoad() {
    this.loadReports();
  },

  async loadReports() {
    wx.showLoading({ title: '加载中...', mask: true });
    try {
      const res = await db.collection('QUIZ_REPORTS')
        .where({ _openid: '{openid}' })
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

      const reports = res.data.map(r => {
        const d = new Date(r.timestamp);
        const pad = n => String(n).padStart(2, '0');
        const dateSuffix = `_${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
        return {
          ...r,
          quizName: (r.quizName || '') + dateSuffix,
          timeStr: this.formatTime(r.timestamp)
        };
      });

      this.setData({ reports });
    } catch (err) {
      console.error('获取报告失败：', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  formatTime(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  handleCollapseChange(e) {
    this.setData({ expandedValues: e.detail.value });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/result/result?from=cloud&id=${id}`
    });
  }
});
