const db = wx.cloud.database();

Page({
  data: {
    portraitImage: '',      // 人像页（学生证封面带照片那页）
    registerImage: '',      // 注册页
    submitting: false
  },

  onLoad() {
    // 若已有提交记录，可回显状态（当前仅本地占位）
    const submitted = wx.getStorageSync('studentVerifyStatus');
    if (submitted === 'pending') {
      wx.showToast({ title: '您已提交过认证，等待审核', icon: 'none' });
    }
  },

  chooseImage(e) {
    const type = e.currentTarget.dataset.type; // portrait | register
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths && res.tempFilePaths[0];
        if (!tempPath) return;
        if (type === 'portrait') {
          this.setData({ portraitImage: tempPath });
        } else {
          this.setData({ registerImage: tempPath });
        }
      }
    });
  },

  previewImage(e) {
    const type = e.currentTarget.dataset.type;
    const url = type === 'portrait' ? this.data.portraitImage : this.data.registerImage;
    if (!url) return;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  async onSubmit() {
    const { portraitImage, registerImage, submitting } = this.data;
    if (submitting) return;

    if (!portraitImage) {
      wx.showToast({ title: '请上传学生证人像页', icon: 'none' });
      return;
    }
    if (!registerImage) {
      wx.showToast({ title: '请上传学生证注册页', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      // TODO: 上传逻辑待补充
      // 1. 使用 wx.cloud.uploadFile 将 portraitImage / registerImage 上传到云存储
      // 2. 获取 fileID 后写入数据库集合（如 STUDENT_VERIFY），状态置为 pending
      // pass

      wx.setStorageSync('studentVerifyStatus', 'pending');

      wx.hideLoading();
      wx.showToast({ title: '已成功提交', icon: 'success', duration: 1500 });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('提交学生认证失败：', err);
      wx.hideLoading();
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
