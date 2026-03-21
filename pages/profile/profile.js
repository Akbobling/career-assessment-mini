Page({
  data: {
    userInfo: {
      avatar: '',
      name: '',
      gender: '',
      school: '',
      phone: '',
      signature: ''
    }
  },
  onLoad() {
    this.getUserInfo();
  },
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userInfo: {
        avatar: userInfo.avatarUrl || '',
        name: userInfo.nickName || '',
        gender: userInfo.gender || '',
        school: userInfo.school || '',
        phone: userInfo.phone || '',
        signature: userInfo.signature || ''
      }
    });
  }
})