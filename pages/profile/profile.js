const db = wx.cloud.database();

Page({
  data: {
    userInfo: {
      avatar: '',
      name: '',
      gender: '',
      education: '',
      school: ''
    },
    educationVisible: false,
    educationValue: [],
    educationOptions: [
      { label: '专科', value: '专科' },
      { label: '本科', value: '本科' },
      { label: '硕士', value: '硕士' },
      { label: '博士', value: '博士' },
      { label: '其它', value: '其它' }
    ]
  },
  onLoad() {
    this.getUserInfo();
  },
  onShow() {
    this.getUserInfo();
  },
  async getUserInfo() {
    try {
      // Try to load from cloud first
      const res = await db.collection('USER_PROFILES').limit(1).get();
      if (res.data.length > 0) {
        const cloudData = res.data[0];
        this.setData({
          userInfo: {
            avatar: cloudData.avatarUrl || '',
            name: cloudData.nickName || '',
            gender: cloudData.gender || '',
            education: cloudData.education || '',
            school: cloudData.school || ''
          }
        });
        // Sync to local storage for fallback
        wx.setStorageSync('userInfo', cloudData);
      } else {
        // Fallback to local storage
        const userInfo = wx.getStorageSync('userInfo') || {};
        this.setData({
          userInfo: {
            avatar: userInfo.avatarUrl || '',
            name: userInfo.nickName || '',
            gender: userInfo.gender || '',
            education: userInfo.education || '',
            school: userInfo.school || ''
          }
        });
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
      // Fallback to local storage on error
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        userInfo: {
          avatar: userInfo.avatarUrl || '',
          name: userInfo.nickName || '',
          gender: userInfo.gender || '',
          education: userInfo.education || '',
          school: userInfo.school || ''
        }
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
  editEducation() {
    const currentEducation = this.data.userInfo.education || '';
    const matchedOption = this.data.educationOptions.find(opt => opt.label === currentEducation);
    this.setData({
      educationValue: matchedOption ? [matchedOption.value] : [],
      educationVisible: true
    });
  },
  async onEducationChange(e) {
    const { value, label } = e.detail;
    const educationLabel = Array.isArray(label) ? label.join('') : (label || '');
    const userInfo = wx.getStorageSync('userInfo') || {};
    userInfo.education = educationLabel;
    wx.setStorageSync('userInfo', userInfo);
    this.setData({
      educationValue: value || [],
      'userInfo.education': educationLabel,
      educationVisible: false
    });
    // Sync to cloud
    try {
      const res = await db.collection('USER_PROFILES').limit(1).get();
      if (res.data.length > 0) {
        await db.collection('USER_PROFILES').doc(res.data[0]._id).update({
          data: { education: educationLabel }
        });
      } else {
        // Remove system fields before add
        const { _id, _openid, ...addData } = userInfo;
        await db.collection('USER_PROFILES').add({
          data: addData
        });
      }
    } catch (err) {
      console.error('更新学历到云端失败:', err);
    }
  },
  onEducationCancel() {
    this.setData({ educationVisible: false });
  },
  editSchool() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=school'
    });
  }
})