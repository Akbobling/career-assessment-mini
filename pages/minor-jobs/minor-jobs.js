const db = wx.cloud.database();

Page({
  data: {
    mediumCategory: '',
    jobs: [],
    loading: true,
    searchKeyword: ''
  },

  onLoad(options) {
    const { mediumCategory } = options;
    if (!mediumCategory) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ mediumCategory });
    this.loadJobs();
  },

  async loadJobs() {
    try {
      this.setData({ loading: true });
      const res = await db.collection('MINOR_JOBS')
        .where({ mediumCategory: this.data.mediumCategory })
        .get();
      this.setData({ jobs: res.data, loading: false });
    } catch (err) {
      console.error('加载岗位失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  getFilteredJobs() {
    const { jobs, searchKeyword } = this.data;
    if (!searchKeyword) return jobs;
    return jobs.filter(job => 
      job.jobName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      job.description.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }
});
