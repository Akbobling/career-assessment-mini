Page({
  data: {},
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  }
})