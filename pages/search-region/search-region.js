const REGION_DATA = require('../../data/regions.js');

Page({
  data: {
    searchKeyword: '',
    searchResults: [],
    treeOptions: REGION_DATA,
    treeValue: ['hot'],
    treeHeight: 500,
    selectedRegion: ''
  },

  onReady() {
    const sysInfo = wx.getWindowInfo();
    // page height - statusbar - navbar - search - bottom bar - padding
    const available = sysInfo.windowHeight - 50 - 44 - 60 - 20;
    this.setData({ treeHeight: Math.max(300, available) });
  },

  onRegionSearch(e) {
    let keyword = '';
    if (typeof e.detail === 'string') {
      keyword = e.detail;
    } else if (e.detail && typeof e.detail.value === 'string') {
      keyword = e.detail.value;
    }
    this.setData({ searchKeyword: keyword });

    if (!keyword || !keyword.trim()) {
      this.setData({ searchResults: [] });
      return;
    }

    const uniqueLabels = new Set();
    const kw = keyword.trim();
    REGION_DATA.forEach(province => {
      (province.children || []).forEach(city => {
        if (city.label.includes(kw)) {
          uniqueLabels.add(city.label);
        }
      });
    });
    const results = Array.from(uniqueLabels).map(label => ({ label })).slice(0, 30);
    this.setData({ searchResults: results });
  },

  onSearchClear() {
    this.setData({ searchKeyword: '', searchResults: [] });
  },

  selectSearchResult(e) {
    const region = e.currentTarget.dataset.region;
    this.setData({ selectedRegion: region });
  },

  onTreeChange(e) {
    const { value, level } = e.detail;
    // value is the full path array e.g. ['hot', '北京'] or ['四川', '成都市']
    this.setData({ treeValue: value });
    if (Array.isArray(value) && value.length >= 2) {
      const provinceVal = value[0];
      const cityVal = value[1];
      // Find the city label from treeOptions
      const province = REGION_DATA.find(p => p.value === provinceVal);
      if (province && province.children) {
        const city = province.children.find(c => c.value === cityVal);
        if (city) {
          this.setData({ selectedRegion: city.label });
        }
      }
    }
  },

  onConfirm() {
    const { selectedRegion } = this.data;
    if (!selectedRegion) return;
    const cache = wx.getStorageSync('salaryFilterCache') || {};
    cache.filterRegion = selectedRegion;
    cache.dirty = true;
    wx.setStorageSync('salaryFilterCache', cache);
    wx.navigateBack();
  }
})
