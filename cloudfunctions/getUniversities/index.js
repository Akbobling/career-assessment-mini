const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const universities = require('./data.js')

exports.main = async (event, context) => {
  const { keyword, page = 1, pageSize = 20 } = event
  
  try {
    let filteredData = universities
    
    if (keyword && keyword.trim() !== '') {
      const searchKeyword = keyword.trim().toLowerCase()
      filteredData = universities.filter(item => 
        item.name.toLowerCase().includes(searchKeyword) ||
        item.location.toLowerCase().includes(searchKeyword)
      )
    }
    
    const total = filteredData.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const list = filteredData.slice(start, end)
    
    return {
      code: 200,
      message: 'success',
      data: list,
      total: total,
      page: page,
      pageSize: pageSize
    }
  } catch (err) {
    console.error('查询高校数据失败:', err)
    return {
      code: 500,
      message: '查询失败',
      data: []
    }
  }
}