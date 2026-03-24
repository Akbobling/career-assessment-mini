Page({
  data: {
    userInfo: {
      avatar: '',
      name: ''
    }
  },
  onLoad() {
    this.getUserInfo();
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
    this.getUserInfo();
  },
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userInfo: {
        avatar: userInfo.avatarUrl || '',
        name: userInfo.nickName || ''
      }
    });
  },
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  }
})