Page({
  data: {
    userInfo: {
      avatar: '',
      name: ''
    },
    verifyStatus: ''
  },
  onLoad() {
    this.getUserInfo();
    this.loadVerifyStatus();
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
    this.getUserInfo();
    this.loadVerifyStatus();
  },
  loadVerifyStatus() {
    const status = wx.getStorageSync('studentVerifyStatus') || '';
    const statusText = status === 'pending' ? '审核中'
      : status === 'approved' ? '已认证'
      : status === 'rejected' ? '已驳回'
      : '';
    this.setData({ verifyStatus: statusText });
  },
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const avatarUrl = userInfo.avatarUrl || '';
    this.setData({
      userInfo: {
        avatar: avatarUrl,
        name: userInfo.nickName || '',
        isAvatarImage: this.isImageUrl(avatarUrl)
      }
    });
  },

  isImageUrl(url) {
    if (!url) return false;
    // Check if it's a valid image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.startsWith('http://') ||
           lowerUrl.startsWith('https://') ||
           lowerUrl.startsWith('wxfile://') ||
           lowerUrl.startsWith('tmp://');
  },
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },
  goToReports() {
    wx.navigateTo({
      url: '/pages/reports/reports'
    });
  },
  goToMyReports() {
    wx.navigateTo({
      url: '/pages/my-reports/my-reports'
    });
  },
  goToStudentVerify() {
    wx.navigateTo({
      url: '/pages/student-verify/student-verify'
    });
  }
})