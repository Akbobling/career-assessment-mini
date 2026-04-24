const db = wx.cloud.database();

Page({
  data: {
    editId: null,
    formData: {
      type: '',
      industry: '',
      company: '',
      position: '',
      region: '',
      annualSalary: '',
      dailySalary: '',
      salaryType: '',
      salary: '',
      message: ''
    },
    charLimitReached: {
      company: false,
      position: false,
      annualSalary: false,
      dailySalary: false,
      salary: false,
      message: false
    },
    industryPickerVisible: false,
    industryValue: [],
    industryOptions: [
      { label: '互联网/游戏/软件', value: '互联网/游戏/软件' },
      { label: '金融/经济/投资/财会', value: '金融/经济/投资/财会' },
      { label: '广告/传媒/公关/展览', value: '广告/传媒/公关/展览' },
      { label: '企业服务/咨询', value: '企业服务/咨询' },
      { label: '教育/培训', value: '教育/培训' },
      { label: '房产/家居/物业/建筑', value: '房产/家居/物业/建筑' },
      { label: '快消/百货/批发/零售', value: '快消/百货/批发/零售' },
      { label: '医疗/健康/制药/生物', value: '医疗/健康/制药/生物' },
      { label: '电子/通信/硬件', value: '电子/通信/硬件' },
      { label: '汽车/机械/制造', value: '汽车/机械/制造' },
      { label: '交通/贸易/物流', value: '交通/贸易/物流' },
      { label: '化工/能源/环保', value: '化工/能源/环保' },
      { label: '餐饮/酒店/旅游/娱乐', value: '餐饮/酒店/旅游/娱乐' },
      { label: '公共事业/NGO/政府', value: '公共事业/NGO/政府' },
      { label: '农林牧渔/其他', value: '农林牧渔/其他' }
    ]
  },

  onLoad(options) {
    // 检查是否是编辑模式
    if (options.editId) {
      this.setData({ editId: options.editId });
      this.loadReportForEdit(options.editId);
    }
  },

  onShow() {
    // 检查是否有地区选择缓存
    const cache = wx.getStorageSync('publishRegionCache') || {};
    if (cache.filterRegion) {
      this.setData({
        'formData.region': cache.filterRegion
      });
      // 清除缓存
      wx.removeStorageSync('publishRegionCache');
      // 保存草稿
      this.saveDraft();
    }
    // 如果没有缓存，尝试加载草稿
    if (!cache.filterRegion) {
      this.loadDraft();
    }
  },

  goToSearchRegion() {
    wx.navigateTo({ url: '/pages/search-region/search-region?from=publish' });
  },

  loadDraft() {
    const draft = wx.getStorageSync('publishDraft');
    if (draft) {
      this.setData({
        formData: draft
      });
      console.log('[草稿加载] 已加载上次未发布的内容');
    }
  },

  saveDraft() {
    wx.setStorageSync('publishDraft', this.data.formData);
  },

  clearDraft() {
    wx.removeStorageSync('publishDraft');
  },

  async loadReportForEdit(id) {
    try {
      const res = await db.collection('SALARY_REPORTS').doc(id).get();
      const report = res.data;
      this.setData({
        'formData.type': report.tag,
        'formData.industry': report.industry,
        'formData.company': report.company,
        'formData.position': report.position,
        'formData.region': report.location,
        'formData.annualSalary': report.annualSalary || '',
        'formData.dailySalary': report.dailySalary || '',
        'formData.salaryType': report.salaryType || '税前',
        'formData.salary': report.salary || '',
        'formData.message': report.desc
      });
    } catch (err) {
      console.error('加载爆料失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  

  
  // 选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      'formData.type': type
    })
    this.saveDraft();
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
    const { value, label } = e.detail;
    // value is array, label is array
    const industryLabel = Array.isArray(label) ? label.join('') : (label || '');
    this.setData({
      industryValue: value || [],
      'formData.industry': industryLabel,
      industryPickerVisible: false
    });
    this.saveDraft();
  },

  onIndustryCancel() {
    this.setData({
      industryPickerVisible: false
    });
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
    this.saveDraft();
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
    this.saveDraft();
  },

  // 输入年薪
  inputAnnualSalary(e) {
    const value = e.detail.value;
    this.setData({
      'formData.annualSalary': value
    });
    this.saveDraft();
  },

  // 输入日薪
  inputDailySalary(e) {
    const value = e.detail.value;
    this.setData({
      'formData.dailySalary': value
    });
    this.saveDraft();
  },

  // 选择薪资类型（税前/税后）
  selectSalaryType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.salaryType': type
    });
    this.saveDraft();
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
    this.saveDraft();
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
    this.saveDraft();
  },

  onUnload() {
    // 页面卸载时保存草稿
    this.saveDraft();
  },
  
  // 发布
  async publish() {
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

    // 根据类型验证年薪或日薪
    if (formData.type === '校招' || formData.type === '社招') {
      if (!formData.annualSalary) {
        wx.showToast({
          title: '请输入年薪',
          icon: 'none'
        })
        return
      }
    } else if (formData.type === '实习') {
      if (!formData.dailySalary) {
        wx.showToast({
          title: '请输入日薪',
          icon: 'none'
        })
        return
      }
    }

    if (!formData.message) {
      wx.showToast({
        title: '请填写想对学弟学妹说的话',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '发布中...', mask: true });

      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};

      // 生成用户ID（使用完整昵称）
      const userId = userInfo.nickName || '匿名';
      const userName = userInfo.nickName || '匿名';

      // 构建爆料数据
      const reportData = {
        tag: formData.type,
        industry: formData.industry,
        company: formData.company,
        position: formData.position,
        location: formData.region,
        annualSalary: formData.annualSalary || '',
        dailySalary: formData.dailySalary || '',
        salaryType: formData.salaryType || '税前',
        salary: formData.salary,
        desc: formData.message,
        userId: userId,
        userName: userName,
        avatarUrl: userInfo.avatarUrl || '',
        education: userInfo.education || '',
        school: userInfo.school || '',
        major: userInfo.major || '',
        gradYear: userInfo.gradYear || '',
        status: 'pending', // 待审核
        timestamp: Date.now(),
        likes: 0,
        collects: 0,
        comments: 0
      };

      // 上传到云数据库
      let res;
      if (this.data.editId) {
        // 编辑模式：更新现有记录
        res = await db.collection('SALARY_REPORTS').doc(this.data.editId).update({
          data: reportData
        });
      } else {
        // 新增模式：创建新记录
        res = await db.collection('SALARY_REPORTS').add({
          data: reportData
        });
      }

      wx.hideLoading();

      // 清除草稿
      this.clearDraft();

      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });

      // 延迟后跳转到详情页
      setTimeout(() => {
        const reportId = this.data.editId || res._id;
        wx.redirectTo({
          url: `/pages/salary-detail/salary-detail?id=${reportId}`
        });
      }, 2000);

    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      });
    }
  }
})