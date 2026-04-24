const db = wx.cloud.database();

Page({
  data: {
    activeTab: 0,
    myReports: [],
    myCollects: [],
    loading: false,
    dialogVisible: false,
    dialogType: '',
    currentId: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    console.log('my-reports onShow called');
    this.loadData();
  },

  onTabChange(e) {
    this.setData({ activeTab: Number(e.detail.value) });
    this.loadData();
  },

  async loadData() {
    console.log('my-reports loadData called, activeTab:', this.data.activeTab);
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.nickName) {
        this.setData({ myReports: [], myCollects: [], loading: false });
        return;
      }

      if (this.data.activeTab === 0) {
        // 我的爆料
        const res = await db.collection('SALARY_REPORTS')
          .where({ userName: userInfo.nickName, status: db.command.neq('deleted') })
          .orderBy('timestamp', 'desc')
          .get();
        this.setData({ myReports: res.data, loading: false });
      } else {
        // 我的收藏
        const profileRes = await db.collection('USER_PROFILES').limit(1).get();
        console.log('USER_PROFILES data:', profileRes.data);
        if (profileRes.data.length > 0) {
          const collects = profileRes.data[0].collects || [];
          console.log('Collects array:', collects);
          if (collects.length > 0) {
            const res = await db.collection('SALARY_REPORTS')
              .where({
                _id: db.command.in(collects)
              })
              .orderBy('timestamp', 'desc')
              .get();
            console.log('Loaded collects:', res.data);
            const formattedCollects = res.data.map(item => {
              item.formattedDate = this.formatDate(item.timestamp);
              return item;
            });
            this.setData({ myCollects: formattedCollects, loading: false });
          } else {
            console.log('No collects found');
            this.setData({ myCollects: [], loading: false });
          }
        } else {
          console.log('No USER_PROFILES found');
          this.setData({ myCollects: [], loading: false });
        }
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/salary-detail/salary-detail?id=${id}` });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const report = this.data.myReports.find(item => item._id === id);
    if (report) {
      wx.navigateTo({
        url: `/pages/publish/publish?editId=${id}`
      });
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      dialogVisible: true,
      dialogType: 'delete',
      currentId: id
    });
  },

  onUncollect(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      dialogVisible: true,
      dialogType: 'uncollect',
      currentId: id
    });
  },

  onDialogConfirm() {
    const { dialogType, currentId } = this.data;
    this.setData({ dialogVisible: false });

    if (dialogType === 'delete') {
      this.deleteReport(currentId);
    } else if (dialogType === 'uncollect') {
      this.uncollectReport(currentId);
    }
  },

  onDialogCancel() {
    this.setData({ dialogVisible: false });
  },

  async deleteReport(id) {
    try {
      await db.collection('SALARY_REPORTS').doc(id).update({
        data: { status: 'deleted' }
      });
      wx.showToast({ title: '删除成功', icon: 'success' });
      this.loadData();
    } catch (err) {
      console.error('删除失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  async uncollectReport(id) {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      
      // 删除 USER_ACTIONS 中的收藏记录
      await db.collection('USER_ACTIONS')
        .where({
          userId: userInfo.nickName,
          reportId: id,
          actionType: 'collect'
        })
        .remove();
      
      // 更新 SALARY_REPORTS 的收藏数
      await db.collection('SALARY_REPORTS').doc(id).update({
        data: { collects: db.command.inc(-1) }
      });
      
      // 更新 USER_PROFILES 的收藏列表
      const profileRes = await db.collection('USER_PROFILES').limit(1).get();
      if (profileRes.data.length > 0) {
        const collects = profileRes.data[0].collects || [];
        const newCollects = collects.filter(collectId => collectId !== id);
        await db.collection('USER_PROFILES').doc(profileRes.data[0]._id).update({
          data: { collects: newCollects }
        });
      }
      
      wx.showToast({ title: '取消收藏成功', icon: 'success' });
      this.loadData();
    } catch (err) {
      console.error('取消收藏失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getStatusText(status) {
    switch (status) {
      case 'pending': return '待审核';
      case 'approved': return '已通过';
      case 'rejected': return '已拒绝';
      case 'deleted': return '已删除';
      default: return '未知';
    }
  },

  getStatusClass(status) {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'deleted': return 'status-deleted';
      default: return '';
    }
  }
});
