/**
 * 细类职业适配度问卷题库配置
 *
 * 数据文件：database_collections/MINOR_CATEGORY_QUESTIONS_{major}-{mediumCode}-{minorCode}.json
 * 云数据库集合名与文件名一致，需将 JSONL 数据导入对应集合。
 *
 * - major：大类序号（1-7）
 * - mediumCode：国家职业分类大典的中类代码（两位字符串）
 * - minorCode：小类代码（两位字符串）
 * - title：小类问卷名称（可按实际分类名称修改）
 * - categoryCount：该问卷包含的细类数量，每个细类 4 道题
 */

const MAJOR_NAMES = ['管理型', '技术型', '办事型', '服务型', '生产型', '加工型', '军队型'];
const MAJOR_ORDINAL_CHARS = ['一', '二', '三', '四', '五', '六', '七'];

function getMajorLabel(majorOrder) {
  const ch = MAJOR_ORDINAL_CHARS[majorOrder - 1] || '';
  return ch ? `第${ch}大类` : '';
}

const MINOR_BANKS = [
  // 第二大类 · 工程技术人员（中类代码 02）
  { major: 2, mediumCode: '02', minorCode: '07', title: '机械工程技术人员', categoryCount: 13 },
  { major: 2, mediumCode: '02', minorCode: '18', title: '土木建筑工程技术人员', categoryCount: 13 },
  { major: 2, mediumCode: '02', minorCode: '20', title: '林业工程技术人员', categoryCount: 12 },
  { major: 2, mediumCode: '02', minorCode: '30', title: '工业与工程管理技术人员', categoryCount: 11 },
  { major: 2, mediumCode: '02', minorCode: '38', title: '数字工程技术人员', categoryCount: 13 },
  // 第二大类 · 卫生专业技术人员（中类代码 05）
  { major: 2, mediumCode: '05', minorCode: '01', title: '临床医师', categoryCount: 15 },
  { major: 2, mediumCode: '05', minorCode: '02', title: '中医医师', categoryCount: 15 },
  { major: 2, mediumCode: '05', minorCode: '07', title: '医技人员', categoryCount: 15 },
  // 第二大类 · 经济和金融专业人员（中类代码 06）
  { major: 2, mediumCode: '06', minorCode: '07', title: '商务专业人员', categoryCount: 17 },
  // 第二大类 · 文学艺术、体育专业人员（中类代码 09）
  { major: 2, mediumCode: '09', minorCode: '02', title: '文艺创作与演奏人员', categoryCount: 10 },
  // 第四大类 · 交通运输、仓储物流和邮政业服务人员（中类代码 02）
  { major: 4, mediumCode: '02', minorCode: '07', title: '邮政和快递服务人员', categoryCount: 11 },
  // 第四大类 · 住宿和餐饮服务人员（中类代码 03）
  { major: 4, mediumCode: '03', minorCode: '02', title: '餐饮服务人员', categoryCount: 13 },
  // 第四大类 · 信息传输、软件和信息技术服务人员（中类代码 04）
  { major: 4, mediumCode: '04', minorCode: '05', title: '信息技术服务人员', categoryCount: 11 },
  // 第四大类 · 技术辅助服务人员（中类代码 08）
  { major: 4, mediumCode: '08', minorCode: '08', title: '设计人员', categoryCount: 29 },
  // 第六大类
  // 注：第六大类中类问卷为自定义分组，以下映射如与实际分类不一致，可直接修改
  { major: 6, mediumCode: '09', minorCode: '03', title: '工艺美术品制作人员', categoryCount: 19 },
  { major: 6, mediumCode: '16', minorCode: '02', title: '石油天然气开采人员', categoryCount: 13 }
];

/**
 * 各大类的中类问卷结果顺序（topIndex）到国家分类中类代码的映射
 * 第二、第四大类的问卷顺序与国家代码顺序一致
 */
const MEDIUM_CODE_MAP = {
  2: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
  4: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'],
  // 第六大类为自定义分组：文娱传媒型 -> 09，资源型 -> 16
  6: [null, null, null, '09', null, null, '16', null]
};

const ITEMS_PER_CATEGORY = 4;

function getBankKey(bank) {
  return `${bank.major}-${bank.mediumCode}-${bank.minorCode}`;
}

function getCollectionName(bankKey) {
  return `MINOR_CATEGORY_QUESTIONS_${bankKey}`;
}

function getMajorName(majorOrder) {
  return MAJOR_NAMES[majorOrder - 1] || '';
}

function getMediumCode(majorOrder, topIndex) {
  const codes = MEDIUM_CODE_MAP[majorOrder];
  if (!codes) return null;
  return codes[topIndex] || null;
}

function decorateBank(bank) {
  return {
    ...bank,
    key: getBankKey(bank),
    majorName: getMajorName(bank.major),
    questionCount: bank.categoryCount * ITEMS_PER_CATEGORY
  };
}

function getAllBanks() {
  return MINOR_BANKS.map(decorateBank);
}

/** 根据中类测评结果推荐该中类下可用的细类问卷 */
function getRecommendedBanks(majorOrder, topIndex) {
  const mediumCode = getMediumCode(majorOrder, topIndex);
  if (!mediumCode) return [];
  return MINOR_BANKS
    .filter(b => b.major === majorOrder && b.mediumCode === mediumCode)
    .map(decorateBank);
}

/** 按大类分组返回全部题库（排除推荐部分） */
function getOtherBankGroups(majorOrder, topIndex) {
  const mediumCode = getMediumCode(majorOrder, topIndex);
  const groups = [];
  MAJOR_NAMES.forEach((name, index) => {
    const major = index + 1;
    let banks = MINOR_BANKS.filter(b => b.major === major);
    if (major === majorOrder && mediumCode) {
      banks = banks.filter(b => b.mediumCode !== mediumCode);
    }
    if (banks.length > 0) {
      groups.push({
        major,
        majorName: name,
        majorLabel: getMajorLabel(major),
        banks: banks.map(decorateBank)
      });
    }
  });
  return groups;
}

module.exports = {
  MAJOR_NAMES,
  MAJOR_ORDINAL_CHARS,
  ITEMS_PER_CATEGORY,
  getBankKey,
  getCollectionName,
  getMajorName,
  getMajorLabel,
  getMediumCode,
  getAllBanks,
  getRecommendedBanks,
  getOtherBankGroups
};
