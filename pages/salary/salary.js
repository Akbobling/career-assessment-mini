const db = wx.cloud.database();

Page({
  data: {
    activeTab: 'square',
    salaryList: [],
    loading: false,

    filterVisible: false,
    filterType: 'all',
    filterEdu: 'all',
    filterSchool: '',
    filterMajor: '',
    filterGradYear: '',
    filterRegion: '',
    filterCount: 0,

    typeOptions: [
      { label: '全部', value: 'all' },
      { label: '校招', value: '校招' },
      { label: '社招', value: '社招' },
      { label: '实习', value: '实习' }
    ],
    eduOptions: [
      { label: '全部', value: 'all' },
      { label: '专科', value: '专科' },
      { label: '本科', value: '本科' },
      { label: '硕士', value: '硕士' },
      { label: '博士', value: '博士' },
      { label: '其它', value: '其它' }
    ],

    gradYearVisible: false,
    gradYearValue: [],
    gradYearOptions: [],
    scrollTop: 0
  },

  onLoad() {
    const years = [];
    for (let y = 2014; y <= 2030; y++) {
      years.push({ label: `${y}年`, value: String(y) });
    }
    this.setData({ gradYearOptions: years });
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    const filterCache = wx.getStorageSync('salaryFilterCache');
    if (filterCache) {
      this.setData({
        filterSchool: filterCache.filterSchool || this.data.filterSchool,
        filterMajor: filterCache.filterMajor || this.data.filterMajor,
        filterRegion: filterCache.filterRegion || this.data.filterRegion
      }, () => {
        this._updateFilterCount();
        wx.removeStorageSync('salaryFilterCache');
      });
    }
    const restorePopup = wx.getStorageSync('salaryFilterPopupRestore');
    if (restorePopup) {
      wx.nextTick(() => {
        this.setData({ filterVisible: true });
        wx.removeStorageSync('salaryFilterPopupRestore');
      });
    }
  },

  onPageScroll(e) {
    this.setData({ scrollTop: e.scrollTop });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      let query = {};
      const { activeTab, filterType, filterEdu, filterSchool, filterMajor, filterGradYear, filterRegion } = this.data;

      // 只显示已通过的爆料
      query.status = 'approved';

      if (activeTab === 'school') {
        const userInfo = wx.getStorageSync('userInfo') || {};
        if (!userInfo.school) {
          this.setData({ salaryList: [], loading: false });
          return;
        }
        query.school = userInfo.school;
      }

      if (filterType !== 'all') query.tag = filterType;
      if (filterEdu !== 'all') query.education = filterEdu;
      if (filterSchool) query.school = filterSchool;
      if (filterMajor) query.major = filterMajor;
      if (filterGradYear) query.gradYear = filterGradYear;
      if (filterRegion) query.location = filterRegion;

      const res = await db.collection('SALARY_REPORTS')
        .where(query)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      this.setData({ salaryList: res.data, loading: false });
    } catch (err) {
      console.error('加载爆料失败：', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  openFilter() {
    this.setData({ filterVisible: true });
  },

  onFilterClose(e) {
    if (!e.detail.visible) {
      this.setData({ filterVisible: false });
    }
  },

  onTypeChange(e) {
    this.setData({ filterType: e.detail.value });
  },

  onEduChange(e) {
    this.setData({ filterEdu: e.detail.value });
  },

  onGradYearClick() {
    this.setData({ gradYearVisible: true });
  },

  onGradYearChange(e) {
    const { value, label } = e.detail;
    // label is an array, e.g. ['2024年']
    const yearLabel = Array.isArray(label) ? label.join('') : (label || '');
    this.setData({
      gradYearValue: value || [],
      filterGradYear: yearLabel,
      gradYearVisible: false
    });
  },

  onGradYearCancel() {
    this.setData({ gradYearVisible: false });
  },

  goToSearchSchool() {
    wx.setStorageSync('salaryFilterPopupRestore', true);
    wx.navigateTo({ url: '/pages/search-school/search-school?from=filter' });
  },

  goToSearchMajor() {
    wx.setStorageSync('salaryFilterPopupRestore', true);
    wx.navigateTo({ url: '/pages/search-major/search-major?from=filter' });
  },

  goToSearchRegion() {
    wx.setStorageSync('salaryFilterPopupRestore', true);
    wx.navigateTo({ url: '/pages/search-region/search-region?from=filter' });
  },

  _updateFilterCount() {
    let count = 0;
    if (this.data.filterType !== 'all') count++;
    if (this.data.filterEdu !== 'all') count++;
    if (this.data.filterSchool) count++;
    if (this.data.filterMajor) count++;
    if (this.data.filterGradYear) count++;
    if (this.data.filterRegion) count++;
    this.setData({ filterCount: count });
  },

  onFilterReset() {
    this.setData({
      filterType: 'all',
      filterEdu: 'all',
      filterSchool: '',
      filterMajor: '',
      filterGradYear: '',
      filterRegion: '',
      gradYearValue: [],
      filterCount: 0
    });
  },

  onFilterConfirm() {
    this._updateFilterCount();
    this.setData({ filterVisible: false });
    this.loadData();
  },

  goToPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/salary-detail/salary-detail?id=${id}` });
  },

  onBackToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  }
})