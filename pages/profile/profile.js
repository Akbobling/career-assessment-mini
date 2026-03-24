Page({
  data: {
    userInfo: {
      avatar: '',
      name: '',
      gender: '',
      school: '',
      phone: '',
      phoneDisplay: '',
      signature: ''
    }
  },
  onLoad() {
    this.getUserInfo();
  },
  onShow() {
    this.getUserInfo();
  },
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const phone = userInfo.phone || '';
    const phoneDisplay = phone ? this.maskPhone(phone) : '';
    this.setData({
      userInfo: {
        avatar: userInfo.avatarUrl || '',
        name: userInfo.nickName || '',
        gender: userInfo.gender || '',
        school: userInfo.school || '',
        phone: phone,
        phoneDisplay: phoneDisplay,
        signature: userInfo.signature || ''
      }
    });
  },
  maskPhone(phone) {
    if (phone.length === 11) {
      return phone.substring(0, 3) + '****' + phone.substring(7);
    }
    return phone;
  },
  getPhoneNumber(e) {
    if (e.detail.code) {
      wx.cloud.callFunction({
        name: 'getPhoneNumber',
        data: {
          code: e.detail.code
        }
      }).then(res => {
        if (res.result && res.result.phoneNumber) {
          const phone = res.result.phoneNumber;
          const phoneDisplay = this.maskPhone(phone);
          const userInfo = wx.getStorageSync('userInfo') || {};
          userInfo.phone = phone;
          wx.setStorageSync('userInfo', userInfo);
          this.setData({
            'userInfo.phone': phone,
            'userInfo.phoneDisplay': phoneDisplay
          });
          this.selectComponent('#t-toast').show({
            theme: 'success',
            context: this,
            selector: '#t-toast',
            message: '已填写手机号'
          });
        }
      }).catch(err => {
        console.error('获取手机号失败:', err);
      });
    }
  },
  editAvatar() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=avatar'
    });
  },
  editName() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=name'
    });
  },
  editGender() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=gender'
    });
  },
  editSignature() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=signature'
    });
  },
  editSchool() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=school'
    });
  }
})