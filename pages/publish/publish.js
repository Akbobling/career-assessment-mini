Page({
  data: {
    formData: {
      type: '',
      industry: '',
      company: '',
      position: '',
      region: '',
      salary: '',
      message: ''
    },
    charLimitReached: {
      company: false,
      position: false,
      salary: false,
      message: false
    },
    industryPickerVisible: false,
    regionPickerVisible: false,
    industryColumns: [
      {
        values: ['互联网/游戏/软件', '金融/银行/投资', '教育/培训', '医疗/健康', '制造业', '零售/电商', '咨询/服务', '其他']
      }
    ],
    regionColumns: [
      {
        values: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '其他']
      }
    ]
  },
  

  
  // 选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      'formData.type': type
    })
  },
  
  // 显示行业选择器
  showIndustryPicker() {
    this.setData({
      industryPickerVisible: true
    })
  },
  
  // 行业选择器可见性变化
  industryPickerVisibleChange(e) {
    this.setData({
      industryPickerVisible: e.detail.visible
    })
  },
  
  // 行业选择变化
  industryChange(e) {
    this.setData({
      'formData.industry': e.detail.value[0]
    })
  },
  
  // 显示地区选择器
  showRegionPicker() {
    this.setData({
      regionPickerVisible: true
    })
  },
  
  // 地区选择器可见性变化
  regionPickerVisibleChange(e) {
    this.setData({
      regionPickerVisible: e.detail.visible
    })
  },
  
  // 地区选择变化
  regionChange(e) {
    this.setData({
      'formData.region': e.detail.value[0]
    })
  },
  
  // 输入公司名称
  inputCompany(e) {
    const value = e.detail.value;
    const maxLength = 30;
    const isLimitReached = value.length >= maxLength;
    if (value.length > maxLength) {
      this.setData({
        'formData.company': value.substring(0, maxLength),
        'charLimitReached.company': true
      });
    } else {
      this.setData({
        'formData.company': value,
        'charLimitReached.company': isLimitReached
      });
    }
  },

  // 输入岗位
  inputPosition(e) {
    const value = e.detail.value;
    const maxLength = 30;
    const isLimitReached = value.length >= maxLength;
    if (value.length > maxLength) {
      this.setData({
        'formData.position': value.substring(0, maxLength),
        'charLimitReached.position': true
      });
    } else {
      this.setData({
        'formData.position': value,
        'charLimitReached.position': isLimitReached
      });
    }
  },

  // 输入薪资描述
  inputSalary(e) {
    const value = e.detail.value;
    const maxLength = 50;
    const isLimitReached = value.length >= maxLength;
    if (value.length > maxLength) {
      this.setData({
        'formData.salary': value.substring(0, maxLength),
        'charLimitReached.salary': true
      });
    } else {
      this.setData({
        'formData.salary': value,
        'charLimitReached.salary': isLimitReached
      });
    }
  },

  // 输入想对学弟学妹说的话
  inputMessage(e) {
    const value = e.detail.value;
    const maxLength = 200;
    const isLimitReached = value.length >= maxLength;
    if (value.length > maxLength) {
      this.setData({
        'formData.message': value.substring(0, maxLength),
        'charLimitReached.message': true
      });
    } else {
      this.setData({
        'formData.message': value,
        'charLimitReached.message': isLimitReached
      });
    }
  },
  
  // 发布
  publish() {
    const { formData } = this.data
    
    // 表单验证
    if (!formData.type) {
      wx.showToast({
        title: '请选择类型',
        icon: 'none'
      })
      return
    }
    
    if (!formData.industry) {
      wx.showToast({
        title: '请选择行业',
        icon: 'none'
      })
      return
    }
    
    if (!formData.company) {
      wx.showToast({
        title: '请填写公司',
        icon: 'none'
      })
      return
    }
    
    if (!formData.position) {
      wx.showToast({
        title: '请填写岗位',
        icon: 'none'
      })
      return
    }
    
    if (!formData.region) {
      wx.showToast({
        title: '请选择地区',
        icon: 'none'
      })
      return
    }
    
    if (!formData.message) {
      wx.showToast({
        title: '请填写想对学弟学妹说的话',
        icon: 'none'
      })
      return
    }
    
    // 模拟发布成功
    wx.showToast({
      title: '发布成功',
      icon: 'success'
    })
    
    // 延迟后返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})