// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 自动载入用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.globalData.userInfo = userInfo;
    
    wx.cloud.init({
      env: 'cloud1-2gly2wfnd42ab7f8'
    }),
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
