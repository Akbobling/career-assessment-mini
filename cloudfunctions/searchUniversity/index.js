const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { keyword } = event
  
  if (!keyword || keyword.trim() === '') {
    return {
      code: 400,
      message: '请输入搜索关键词',
      data: []
    }
  }

  try {
    const result = await cloud.callFunction({
      name: 'getUniversities',
      data: {
        keyword: keyword.trim()
      }
    })
    
    return result.result
  } catch (err) {
    console.error('搜索高校失败:', err)
    return {
      code: 500,
      message: '搜索失败，请稍后重试',
      data: []
    }
  }
}