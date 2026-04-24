Page({
  data: {
    type: '',
    avatarUrl: '',
    name: '',
    gender: '',
    genderVisible: false,
    genderValue: [],
    genderText: '',
    genderOptionsList: [
      { label: '男', value: '男' },
      { label: '女', value: '女' },
      { label: '保密', value: '保密' }
    ],
    searchKeyword: '',
    universityList: [],
    searching: false
  },
  searchTimer: null,

  onLoad(options) {
    const { type } = options;
    const userInfo = wx.getStorageSync('userInfo') || {};
    const genderValue = userInfo.gender ? [userInfo.gender] : [];
    const genderText = userInfo.gender || '';

    this.setData({
      type: type,
      avatarUrl: userInfo.avatarUrl || '',
      name: userInfo.nickName || '',
      gender: userInfo.gender || '',
      genderValue: genderValue,
      genderText: genderText,
      school: userInfo.school || ''
    });
  },
  
  chooseAvatar() {
    console.log('[头像上传] 开始选择头像');
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('[头像上传] 选择的临时文件路径:', tempFilePath);
        wx.showLoading({ title: '上传中...', mask: true });

        // 上传到云存储
        const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        console.log('[头像上传] 云存储路径:', cloudPath);
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: uploadRes => {
            wx.hideLoading();
            const fileID = uploadRes.fileID;
            console.log('[头像上传] 上传成功，文件ID:', fileID);
            this.setData({
              avatarUrl: fileID
            });
            this.autoSave('avatar', fileID);
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          },
          fail: err => {
            wx.hideLoading();
            console.error('[头像上传] 上传失败:', err);
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },
  
  onChooseWechatAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      console.log('[微信头像] 微信头像URL:', avatarUrl);
      wx.showLoading({ title: '上传中...', mask: true });

      // 上传到云存储
      const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      console.log('[微信头像] 云存储路径:', cloudPath);
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: avatarUrl,
        success: uploadRes => {
          wx.hideLoading();
          const fileID = uploadRes.fileID;
          console.log('[微信头像] 上传成功，文件ID:', fileID);
          this.setData({
            avatarUrl: fileID
          });
          this.autoSave('avatar', fileID);
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        },
        fail: err => {
          wx.hideLoading();
          console.error('[微信头像] 上传失败:', err);
          // 上传失败时，直接使用微信头像URL
          console.log('[微信头像] 上传失败，使用微信头像URL');
          this.setData({
            avatarUrl: avatarUrl
          });
          this.autoSave('avatar', avatarUrl);
          wx.showToast({
            title: '上传失败，使用微信头像',
            icon: 'none'
          });
        }
      });
    }
  },
  
  onNameInput(e) {
    const value = e.detail.value;
    this.setData({
      name: value
    });
    // 不在输入时提示，只在返回时检查
    // 如果没有设置头像，使用昵称末两位作为默认头像
    if (!this.data.avatarUrl && value && value.length >= 2) {
      const defaultAvatar = value.slice(-2);
      this.setData({
        avatarUrl: defaultAvatar
      });
      this.autoSave('avatar', defaultAvatar);
    }
  },

  onUnload() {
    // 如果是编辑昵称，检查昵称长度
    if (this.data.type === 'name') {
      const name = this.data.name;
      if (!name || name.length < 2) {
        wx.showToast({
          title: '昵称至少需要2个字符',
          icon: 'none',
          duration: 2000
        });
        // 阻止返回，通过重新进入当前页面
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/edit-profile/edit-profile?type=name'
          });
        }, 2000);
      } else {
        // 昵称有效，保存到本地和云端
        this.autoSave('name', name);
      }
    }
  },
  
  onGenderClick() {
    this.setData({
      genderVisible: true
    });
  },
  
  onGenderChange(e) {
    const { value, label } = e.detail;
    this.setData({
      gender: value[0],
      genderValue: value,
      genderText: label.join(' '),
      genderVisible: false
    });
    this.autoSave('gender', value[0]);
  },
  
  onGenderCancel() {
    this.setData({
      genderVisible: false
    });
  },

  onSchoolSearch(e) {
    let keyword = '';
    if (typeof e.detail === 'string') {
      keyword = e.detail;
    } else if (e.detail && typeof e.detail.value === 'string') {
      keyword = e.detail.value;
    } else if (e.detail && e.detail.value && typeof e.detail.value.value === 'string') {
      keyword = e.detail.value.value;
    }
    
    this.setData({
      searchKeyword: keyword
    });
    
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    if (!keyword || !keyword.trim()) {
      this.setData({
        universityList: [],
        searching: false
      });
      return;
    }
    
    this.setData({ searching: true });
    
    this.searchTimer = setTimeout(() => {
      this.searchUniversities(keyword.trim());
    }, 300);
  },
  
  onSearchClear() {
    this.setData({
      searchKeyword: '',
      universityList: [],
      searching: false
    });
  },
  
  searchUniversities(keyword) {
    wx.cloud.callFunction({
      name: 'getUniversities',
      data: {
        keyword: keyword,
        page: 1,
        pageSize: 20
      }
    }).then(res => {
      if (res.result.code === 200) {
        this.setData({
          universityList: res.result.data,
          searching: false
        });
      } else {
        this.setData({
          universityList: [],
          searching: false
        });
      }
    }).catch(err => {
      console.error('搜索高校失败:', err);
      this.setData({
        universityList: [],
        searching: false
      });
    });
  },
  
  selectUniversity(e) {
    const school = e.currentTarget.dataset.school;
    this.autoSave('school', school);
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    });
    setTimeout(() => {
      wx.navigateBack();
      // 通知profile页面检查完成状态
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.checkProfileComplete) {
        prevPage.checkProfileComplete();
      }
    }, 1000);
  },
  
  async autoSave(field, value) {
    console.log('[自动保存] 开始保存字段:', field, '值:', value);
    const userInfo = wx.getStorageSync('userInfo') || {};

    if (field === 'avatar') {
      userInfo.avatarUrl = value;
    } else if (field === 'name') {
      userInfo.nickName = value;
    } else if (field === 'gender') {
      userInfo.gender = value;
    } else if (field === 'school') {
      userInfo.school = value;
    }

    wx.setStorageSync('userInfo', userInfo);
    console.log('[自动保存] 本地存储已更新，头像URL:', userInfo.avatarUrl);

    // Sync to cloud database
    const db = wx.cloud.database();
    console.log('[自动保存] 开始同步到云端数据库');
    const res = await db.collection('USER_PROFILES').limit(1).get();
    console.log('[自动保存] 云端查询结果:', res.data);
    if (res.data.length > 0) {
      // Remove system fields before update
      const { _id, _openid, ...updateData } = userInfo;
      console.log('[自动保存] 更新云端数据:', updateData);
      await db.collection('USER_PROFILES').doc(res.data[0]._id).update({
        data: updateData
      });
      console.log('[自动保存] 云端更新成功');
    } else {
      const { _id, _openid, ...addData } = userInfo;
      console.log('[自动保存] 添加云端数据:', addData);
      await db.collection('USER_PROFILES').add({
        data: addData
      });
      console.log('[自动保存] 云端添加成功');
    }
  }
})