/**
 * 转换云存储 File ID 为临时的 HTTPS HTTPS 链接
 * 解决中文路径解析失败、链接过期及协议识别报错(500)问题
 * @param {Array|string} fileList - 一个或多个云文件 ID
 * @returns {Promise<Object|string>} - 转换后的临时链接
 */
async function getTempUrl(fileList) {
  if (!fileList) return '';
  const isArray = Array.isArray(fileList);
  const list = isArray ? fileList : [fileList];
  
  // 过滤出有效的 cloud:// 路径
  const cloudFiles = list.filter(fid => fid && typeof fid === 'string' && fid.startsWith('cloud://'));
  
  if (cloudFiles.length === 0) {
    return isArray ? list : list[0];
  }

  try {
    const res = await wx.cloud.getTempFileURL({
      fileList: cloudFiles
    });
    
    // 建立映射表
    const urlMap = {};
    res.fileList.forEach(item => {
      urlMap[item.fileID] = item.tempFileURL || item.fileID;
    });

    if (isArray) {
      return list.map(fid => urlMap[fid] || fid);
    } else {
      return urlMap[fileList] || fileList;
    }
  } catch (err) {
    console.error('获取临时链接失败', err);
    return isArray ? list : list[0];
  }
}

module.exports = {
  getTempUrl
};
