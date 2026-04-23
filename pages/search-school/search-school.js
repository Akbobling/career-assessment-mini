Page({
  data: {
    searchKeyword: '',
    universityList: [],
    searching: false
  },
  searchTimer: null,

  onSchoolSearch(e) {
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
      this.setData({ universityList: [], searching: false });
      return;
    }

    this.setData({ searching: true });
    this.searchTimer = setTimeout(() => {
      this.searchUniversities(keyword.trim());
    }, 300);
  },

  onSearchClear() {
    this.setData({ searchKeyword: '', universityList: [], searching: false });
  },

  searchUniversities(keyword) {
    wx.cloud.callFunction({
      name: 'getUniversities',
      data: { keyword, page: 1, pageSize: 20 }
    }).then(res => {
      if (res.result.code === 200) {
        this.setData({ universityList: res.result.data, searching: false });
      } else {
        this.setData({ universityList: [], searching: false });
      }
    }).catch(err => {
      console.error('搜索高校失败:', err);
      this.setData({ universityList: [], searching: false });
    });
  },

  selectUniversity(e) {
    const school = e.currentTarget.dataset.school;
    const cache = wx.getStorageSync('salaryFilterCache') || {};
    cache.filterSchool = school;
    cache.dirty = true;
    wx.setStorageSync('salaryFilterCache', cache);
    wx.navigateBack();
  }
})
