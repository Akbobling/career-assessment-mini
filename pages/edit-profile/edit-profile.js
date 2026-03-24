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
    signature: '',
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
      signature: userInfo.signature || '',
      school: userInfo.school || ''
    });
  },
  
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          avatarUrl: tempFilePath
        });
        this.autoSave('avatar', tempFilePath);
      }
    });
  },
  
  onChooseWechatAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      this.setData({
        avatarUrl: avatarUrl
      });
      this.autoSave('avatar', avatarUrl);
    }
  },
  
  onNameInput(e) {
    const value = e.detail.value;
    this.setData({
      name: value
    });
    this.autoSave('name', value);
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
  
  onSignatureInput(e) {
    const value = e.detail.value;
    this.setData({
      signature: value
    });
    this.autoSave('signature', value);
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
    }, 1000);
  },
  
  autoSave(field, value) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    if (field === 'avatar') {
      userInfo.avatarUrl = value;
    } else if (field === 'name') {
      userInfo.nickName = value;
    } else if (field === 'gender') {
      userInfo.gender = value;
    } else if (field === 'signature') {
      userInfo.signature = value;
    } else if (field === 'school') {
      userInfo.school = value;
    }
    
    wx.setStorageSync('userInfo', userInfo);
  }
})