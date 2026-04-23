const db = wx.cloud.database();

Page({
  data: {
    searchKeyword: '',
    majorList: [],
    searching: false
  },
  searchTimer: null,

  onMajorSearch(e) {
    let keyword = '';
    if (typeof e.detail === 'string') {
      keyword = e.detail;
    } else if (e.detail && typeof e.detail.value === 'string') {
      keyword = e.detail.value;
    } else if (e.detail && e.detail.value && typeof e.detail.value.value === 'string') {
      keyword = e.detail.value.value;
    }

    this.setData({ searchKeyword: keyword });

    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (!keyword || !keyword.trim()) {
      this.setData({ majorList: [], searching: false });
      return;
    }

    this.setData({ searching: true });
    this.searchTimer = setTimeout(() => {
      this.searchMajors(keyword.trim());
    }, 300);
  },

  onSearchClear() {
    this.setData({ searchKeyword: '', majorList: [], searching: false });
  },

  async searchMajors(keyword) {
    try {
      const res = await db.collection('MAJORS')
        .where({
          name: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .limit(30)
        .get();
      this.setData({ majorList: res.data, searching: false });
    } catch (err) {
      console.error('搜索专业失败:', err);
      this.setData({ majorList: [], searching: false });
    }
  },

  selectMajor(e) {
    const major = e.currentTarget.dataset.major;
    const cache = wx.getStorageSync('salaryFilterCache') || {};
    cache.filterMajor = major;
    cache.dirty = true;
    wx.setStorageSync('salaryFilterCache', cache);
    wx.navigateBack();
  }
})
