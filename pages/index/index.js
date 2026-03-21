// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    activeTab: 'assessment',
  },
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value,
    });
  },
  goToPage: function(){
    wx.navigateTo({
      url: '/pages/profile/profile',
    })
  }
})
