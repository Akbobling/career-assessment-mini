const db = wx.cloud.database();

Page({
  data: {
    userInfo: {
      avatar: '',
      name: '',
      gender: '',
      education: '',
      school: '',
      major: '',
      gradYear: ''
    },
    educationVisible: false,
    educationValue: [],
    educationOptions: [
      { label: '专科', value: '专科' },
      { label: '本科', value: '本科' },
      { label: '硕士', value: '硕士' },
      { label: '博士', value: '博士' },
      { label: '其它', value: '其它' }
    ],
    gradYearVisible: false,
    gradYearValue: [],
    gradYearOptions: [],
    forceMode: false
  },
  onLoad(options) {
    if (options.force === 'true') {
      this.setData({ forceMode: true });
    }
    const years = [];
    for (let y = 2014; y <= 2030; y++) {
      years.push({ label: `${y}年`, value: String(y) });
    }
    this.setData({ gradYearOptions: years });
    this.getUserInfo();
  },
  onShow() {
    this.getUserInfo();
    // 检查是否有专业选择缓存
    const majorCache = wx.getStorageSync('profileMajorCache');
    if (majorCache) {
      this.updateMajor(majorCache);
      wx.removeStorageSync('profileMajorCache');
    }
  },
  async getUserInfo() {
    // 优先使用本地缓存
    const userInfo = wx.getStorageSync('userInfo') || {};
    const cacheTime = wx.getStorageSync('userInfoCacheTime');
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

    // 如果有本地缓存且未过期，直接使用
    if (userInfo.nickName && cacheTime && (now - cacheTime) < CACHE_DURATION) {
      const avatarUrl = userInfo.avatarUrl || '';
      this.setData({
        userInfo: {
          avatar: avatarUrl,
          name: userInfo.nickName || '',
          gender: userInfo.gender || '',
          education: userInfo.education || '',
          school: userInfo.school || '',
          major: userInfo.major || '',
          gradYear: userInfo.gradYear || '',
          isAvatarImage: this.isImageUrl(avatarUrl)
        }
      });
      return;
    }

    // 从云端获取最新数据
    try {
      console.log('[用户信息] 开始从云端获取用户信息');
      const res = await db.collection('USER_PROFILES').limit(1).get();
      console.log('[用户信息] 云端查询结果:', res.data);
      if (res.data.length > 0) {
        const cloudData = res.data[0];
        const avatarUrl = cloudData.avatarUrl || '';
        console.log('[用户信息] 云端头像URL:', avatarUrl);
        this.setData({
          userInfo: {
            avatar: avatarUrl,
            name: cloudData.nickName || '',
            gender: cloudData.gender || '',
            education: cloudData.education || '',
            school: cloudData.school || '',
            major: cloudData.major || '',
            gradYear: cloudData.gradYear || '',
            isAvatarImage: this.isImageUrl(avatarUrl)
          }
        });
        console.log('[用户信息] 设置的用户信息:', this.data.userInfo);
        // 缓存到本地
        wx.setStorageSync('userInfo', cloudData);
        wx.setStorageSync('userInfoCacheTime', Date.now());
      } else {
        // Fallback to local storage
        const avatarUrl = userInfo.avatarUrl || '';
        console.log('[用户信息] 云端无数据，使用本地头像URL:', avatarUrl);
        this.setData({
          userInfo: {
            avatar: avatarUrl,
            name: userInfo.nickName || '',
            gender: userInfo.gender || '',
            education: userInfo.education || '',
            school: userInfo.school || '',
            major: userInfo.major || '',
            gradYear: userInfo.gradYear || '',
            isAvatarImage: this.isImageUrl(avatarUrl)
          }
        });
      }
    } catch (err) {
      console.error('[用户信息] 加载用户信息失败:', err);
      wx.showToast({ title: '加载用户信息失败', icon: 'none' });
      // Fallback to local storage on error
      const avatarUrl = userInfo.avatarUrl || '';
      console.log('[用户信息] 加载失败，使用本地头像URL:', avatarUrl);
      this.setData({
        userInfo: {
          avatar: avatarUrl,
          name: userInfo.nickName || '',
          gender: userInfo.gender || '',
          education: userInfo.education || '',
          school: userInfo.school || '',
          major: userInfo.major || '',
          gradYear: userInfo.gradYear || '',
          isAvatarImage: this.isImageUrl(avatarUrl)
        }
      });
    }
  },

  isImageUrl(url) {
    if (!url) return false;
    console.log('[头像检查] URL:', url);
    // Check if it's a valid image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    const isImage = imageExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.startsWith('http://') ||
           lowerUrl.startsWith('https://') ||
           lowerUrl.startsWith('wxfile://') ||
           lowerUrl.startsWith('tmp://') ||
           lowerUrl.startsWith('cloud://');
    console.log('[头像检查] 是否为图片URL:', isImage, 'URL类型:', 
      lowerUrl.startsWith('cloud://') ? '云存储' :
      lowerUrl.startsWith('http://') ? 'HTTP' :
      lowerUrl.startsWith('https://') ? 'HTTPS' :
      lowerUrl.startsWith('wxfile://') ? '本地文件' :
      lowerUrl.startsWith('tmp://') ? '临时文件' : '其他');
    return isImage;
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
      wx.showToast({ title: '更新学历失败', icon: 'none' });
    }
    this.checkProfileComplete();
  },
  onEducationCancel() {
    this.setData({ educationVisible: false });
  },
  editSchool() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile?type=school'
    });
  },

  editMajor() {
    wx.navigateTo({
      url: '/pages/search-major/search-major?from=profile'
    });
  },

  editGradYear() {
    const currentGradYear = this.data.userInfo.gradYear || '';
    const matchedOption = this.data.gradYearOptions.find(opt => opt.label === currentGradYear);
    this.setData({
      gradYearValue: matchedOption ? [matchedOption.value] : [],
      gradYearVisible: true
    });
  },

  async onGradYearChange(e) {
    const { value, label } = e.detail;
    const yearLabel = Array.isArray(label) ? label.join('') : (label || '');
    const userInfo = wx.getStorageSync('userInfo') || {};
    userInfo.gradYear = yearLabel;
    wx.setStorageSync('userInfo', userInfo);
    this.setData({
      gradYearValue: value || [],
      'userInfo.gradYear': yearLabel,
      gradYearVisible: false
    });
    // Sync to cloud
    try {
      const res = await db.collection('USER_PROFILES').limit(1).get();
      if (res.data.length > 0) {
        await db.collection('USER_PROFILES').doc(res.data[0]._id).update({
          data: { gradYear: yearLabel }
        });
      } else {
        const { _id, _openid, ...addData } = userInfo;
        await db.collection('USER_PROFILES').add({
          data: addData
        });
      }
    } catch (err) {
      console.error('更新毕业年份到云端失败:', err);
      wx.showToast({ title: '更新毕业年份失败', icon: 'none' });
    }
    this.checkProfileComplete();
  },

  onGradYearCancel() {
    this.setData({ gradYearVisible: false });
  },

  async updateMajor(major) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    userInfo.major = major;
    wx.setStorageSync('userInfo', userInfo);
    this.setData({
      'userInfo.major': major
    });
    // Sync to cloud
    try {
      const res = await db.collection('USER_PROFILES').limit(1).get();
      if (res.data.length > 0) {
        await db.collection('USER_PROFILES').doc(res.data[0]._id).update({
          data: { major: major }
        });
      } else {
        const { _id, _openid, ...addData } = userInfo;
        await db.collection('USER_PROFILES').add({
          data: addData
        });
      }
    } catch (err) {
      console.error('更新专业到云端失败:', err);
      wx.showToast({ title: '更新专业失败', icon: 'none' });
    }
    this.checkProfileComplete();
  },

  checkProfileComplete() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const isComplete = userInfo.nickName && userInfo.nickName.length >= 2 &&
                      userInfo.gender &&
                      userInfo.education &&
                      userInfo.school &&
                      userInfo.major &&
                      userInfo.gradYear;

    if (isComplete) {
      wx.setStorageSync('hasCompletedProfile', true);
      if (this.data.forceMode) {
        wx.showToast({
          title: '信息完善完成',
          icon: 'success'
        });
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    }
  }
})