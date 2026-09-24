// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-d9gf6ki2bb00f5d0c',
        traceUser: true,
      });
    }

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },

  onShow() {
    // 检查云开发是否可用并从云端载入用户信息
    this.loadUserInfoFromCloud().then(() => {
      // 云端数据加载完成后检查用户信息完整性
      this.checkUserInfo();
    });
  },

  async loadUserInfoFromCloud() {
    // 直接使用本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.globalData.userInfo = userInfo;

    // 尝试从云端加载用户信息
    try {
      const db = wx.cloud.database();
      const res = await db.collection('USER_PROFILES').limit(1).get();

      if (res.data.length > 0) {
        const cloudData = res.data[0];
        // 将云端数据保存到本地存储
        wx.setStorageSync('userInfo', cloudData);
        wx.setStorageSync('userInfoCacheTime', Date.now());
        this.globalData.userInfo = cloudData;
        console.log('已从云端载入用户信息');
      }
    } catch (err) {
      console.error('云端加载失败:', err);
      wx.showToast({ title: '云端加载失败', icon: 'none' });
    }
  },

  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const hasCompletedProfile = wx.getStorageSync('hasCompletedProfile') || false;

    // 检查云端用户信息是否完整
    const isCloudProfileComplete = userInfo.nickName && userInfo.nickName.length >= 2 &&
                                  userInfo.gender &&
                                  userInfo.education &&
                                  userInfo.school &&
                                  userInfo.major &&
                                  userInfo.gradYear;

    // 如果云端信息完整但本地没有标记，自动设置标记
    if (isCloudProfileComplete && !hasCompletedProfile) {
      wx.setStorageSync('hasCompletedProfile', true);
      console.log('[用户信息] 云端信息完整，自动设置完成标记');
    }

    // 如果已经标记为完成，不再强制跳转
    if (hasCompletedProfile || isCloudProfileComplete) {
      return;
    }

    // 如果用户信息不完整，强制跳转到profile页面
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage ? currentPage.route : '';

    // 如果当前不在profile页面，跳转到profile
    if (currentRoute !== 'pages/profile/profile') {
      wx.redirectTo({
        url: '/pages/profile/profile?force=true'
      });
    }
  },

  globalData: {
    userInfo: null
  }
})
