Component({
  data: {
    selected: 0,
    color: "#666666",
    selectedColor: "#0052D9",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "测评",
        iconPath: "/images/anchor.png",
        selectedIconPath: "/images/anchor_activated.png"
      },
      {
        pagePath: "/pages/salary/salary",
        text: "薪资",
        iconPath: "/images/money.png",
        selectedIconPath: "/images/money_activated.png"
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        iconPath: "/images/user.png",
        selectedIconPath: "/images/user_activated.png"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
})