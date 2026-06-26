/**
 * 橘子塔塔管理后台 - 主应用
 */

// 全局状态
const state = {
  token: null,
  admin: null,
  currentPage: 'stats'
};

// API 基础配置
const API_BASE = '';

// 工具函数：API 请求
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`
    }
  };

  const response = await fetch(API_BASE + url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    // 如果是认证错误，跳转到登录页
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/index.html';
      throw new Error('认证失败，请重新登录');
    }
    throw new Error(data.error || '请求失败');
  }

  return data;
}

// 初始化
async function init() {
  // 检查登录状态
  state.token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');

  if (!state.token || !userStr) {
    window.location.href = '/admin/index.html';
    return;
  }

  try {
    state.admin = JSON.parse(userStr);
    
    // 验证 token
    const response = await apiRequest('/api/admin-auth?action=me');
    if (response.success) {
      state.admin = response.admin;
      localStorage.setItem('admin_user', JSON.stringify(state.admin));
    }

    // 更新顶部用户信息
    document.getElementById('topbarUser').textContent = state.admin.name || state.admin.email;

    // 设置菜单点击事件
    setupMenu();

    // 加载默认页面
    loadPage('stats');

  } catch (error) {
    console.error('初始化失败:', error);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/index.html';
  }
}

// 设置菜单
function setupMenu() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      
      // 更新菜单状态
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // 加载页面
      loadPage(page);
    });
  });
}

// 加载页面
async function loadPage(page) {
  state.currentPage = page;
  const contentArea = document.getElementById('contentArea');

  // 显示加载状态
  contentArea.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  `;

  try {
    switch (page) {
      case 'stats':
        await loadStatsPage();
        break;
      case 'codes':
        await loadCodesPage();
        break;
      case 'sessions':
        await loadSessionsPage();
        break;
      default:
        contentArea.innerHTML = '<p>页面不存在</p>';
    }
  } catch (error) {
    console.error('加载页面失败:', error);
    contentArea.innerHTML = `
      <div class="alert alert-error">
        加载失败: ${error.message}
      </div>
    `;
  }
}

// 加载统计页面
async function loadStatsPage() {
  const response = await apiRequest('/api/admin-stats');
  const stats = response.stats;

  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
    <div class="content-header">
      <h2>统计数据</h2>
      <p>实时查看系统使用情况</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">总兑换码</div>
        <div class="stat-card-value">${stats.codes.total}</div>
        <div class="stat-card-change">活跃: ${stats.codes.active}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-label">总占卜次数</div>
        <div class="stat-card-value">${stats.sessions.total}</div>
        <div class="stat-card-change">今日: ${stats.sessions.today}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-label">本周占卜</div>
        <div class="stat-card-value">${stats.sessions.week}</div>
        <div class="stat-card-change">本月: ${stats.sessions.month}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-label">总追问</div>
        <div class="stat-card-value">${stats.followups.total}</div>
        <div class="stat-card-change">平均: ${stats.followups.avg_per_session}/次</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">兑换码状态分布</div>
      </div>
      <div class="card-body">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-label">活跃</div>
            <div class="stat-card-value" style="color: var(--success-color);">${stats.codes.active}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">已过期</div>
            <div class="stat-card-value" style="color: var(--warning-color);">${stats.codes.expired}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">已禁用</div>
            <div class="stat-card-value" style="color: var(--error-color);">${stats.codes.disabled}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">使用率</div>
            <div class="stat-card-value">${stats.codes.usage_rate}%</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 加载兑换码页面
async function loadCodesPage() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
    <div class="content-header">
      <h2>兑换码管理</h2>
      <p>生成、查看和管理兑换码</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">生成兑换码</div>
      </div>
      <div class="card-body">
        <form id="generateForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label>生成数量</label>
            <input type="number" id="genCount" class="form-control" value="1" min="1" max="100" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>问题次数</label>
            <input type="number" id="genQuestions" class="form-control" value="3" min="1" max="100" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>追问次数</label>
            <input type="number" id="genFollowups" class="form-control" value="3" min="0" max="10" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>有效期(天)</label>
            <input type="number" id="genDays" class="form-control" value="30" min="1" max="365" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>备注</label>
            <input type="text" id="genNote" class="form-control" placeholder="可选" />
          </div>
          <div style="display: flex; align-items: flex-end;">
            <button type="submit" class="btn btn-primary" style="width: 100%;">生成</button>
          </div>
        </form>
        <div id="generateResult"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">兑换码列表</div>
      </div>
      <div class="card-body">
        <div style="margin-bottom: 16px; display: flex; gap: 12px;">
          <input type="text" id="searchCode" class="form-control" placeholder="搜索兑换码或备注" style="flex: 1;" />
          <select id="filterStatus" class="form-control" style="width: 150px;">
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="expired">已过期</option>
            <option value="disabled">已禁用</option>
          </select>
          <button onclick="searchCodes()" class="btn btn-primary">搜索</button>
        </div>
        <div id="codesTable"></div>
        <div id="codesPagination"></div>
      </div>
    </div>
  `;

  // 设置生成表单
  document.getElementById('generateForm').addEventListener('submit', generateCodes);

  // 加载兑换码列表
  await loadCodesList();
}

// 生成兑换码
async function generateCodes(e) {
  e.preventDefault();

  const count = parseInt(document.getElementById('genCount').value);
  const questionLimit = parseInt(document.getElementById('genQuestions').value);
  const followupLimit = parseInt(document.getElementById('genFollowups').value);
  const expiresDays = parseInt(document.getElementById('genDays').value);
  const note = document.getElementById('genNote').value.trim();

  const resultDiv = document.getElementById('generateResult');
  resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>生成中...</p></div>';

  try {
    const response = await apiRequest('/api/admin-codes?action=generate', {
      method: 'POST',
      body: JSON.stringify({
        count,
        question_limit: questionLimit,
        followup_limit_per_question: followupLimit,
        expires_days: expiresDays,
        note: note || undefined
      })
    });

    const codes = response.codes.map(c => c.code).join('\n');
    resultDiv.innerHTML = `
      <div class="alert alert-success">
        成功生成 ${response.count} 个兑换码！
      </div>
      <textarea class="form-control" rows="5" readonly style="font-family: monospace; font-size: 13px;">${codes}</textarea>
      <button onclick="copyToClipboard(\`${codes}\`)" class="btn btn-primary" style="margin-top: 12px;">复制到剪贴板</button>
    `;

    // 刷新列表
    await loadCodesList();

  } catch (error) {
    resultDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// 加载兑换码列表
window.loadCodesList = async function(page = 1, status = '', search = '') {
  const params = new URLSearchParams({ page, pageSize: 20 });
  if (status) params.append('status', status);
  if (search) params.append('search', search);

  try {
    const response = await apiRequest(`/api/admin-codes?action=list&${params}`);
    
    const tableDiv = document.getElementById('codesTable');
    if (response.codes.length === 0) {
      tableDiv.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 40px;">暂无数据</p>';
      return;
    }

    const tableHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>兑换码</th>
              <th>次数</th>
              <th>状态</th>
              <th>过期时间</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${response.codes.map(code => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${code.code}</td>
                <td>${code.question_used}/${code.question_limit}</td>
                <td>
                  <span class="badge badge-${code.status === 'active' ? 'success' : code.status === 'expired' ? 'warning' : 'error'}">
                    ${code.status === 'active' ? '活跃' : code.status === 'expired' ? '已过期' : '已禁用'}
                  </span>
                </td>
                <td>${code.expires_at ? new Date(code.expires_at).toLocaleDateString('zh-CN') : '永久'}</td>
                <td>${code.note || '-'}</td>
                <td>
                  <button onclick="toggleCodeStatus('${code.id}', '${code.status}')" class="btn" style="font-size: 12px; padding: 6px 12px;">
                    ${code.status === 'active' ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    tableDiv.innerHTML = tableHTML;

    // 分页
    const paginationDiv = document.getElementById('codesPagination');
    const { page: currentPage, totalPages } = response.pagination;
    
    if (totalPages > 1) {
      let paginationHTML = '<div style="margin-top: 20px; text-align: center;">';
      
      if (currentPage > 1) {
        paginationHTML += `<button onclick="loadCodesList(${currentPage - 1}, '${status}', '${search}')" class="btn" style="margin: 0 4px;">上一页</button>`;
      }
      
      paginationHTML += `<span style="margin: 0 16px;">第 ${currentPage} / ${totalPages} 页</span>`;
      
      if (currentPage < totalPages) {
        paginationHTML += `<button onclick="loadCodesList(${currentPage + 1}, '${status}', '${search}')" class="btn" style="margin: 0 4px;">下一页</button>`;
      }
      
      paginationHTML += '</div>';
      paginationDiv.innerHTML = paginationHTML;
    } else {
      paginationDiv.innerHTML = '';
    }

  } catch (error) {
    console.error('加载兑换码列表失败:', error);
    document.getElementById('codesTable').innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
};

// 搜索兑换码
window.searchCodes = function() {
  const search = document.getElementById('searchCode').value.trim();
  const status = document.getElementById('filterStatus').value;
  loadCodesList(1, status, search);
};

// 切换兑换码状态
window.toggleCodeStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  
  if (!confirm(`确定要${newStatus === 'disabled' ? '禁用' : '启用'}此兑换码吗？`)) {
    return;
  }

  try {
    await apiRequest(`/api/admin-codes?action=update&id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    alert('操作成功！');
    await loadCodesList();
  } catch (error) {
    alert('操作失败: ' + error.message);
  }
};

// 加载占卜记录页面
async function loadSessionsPage() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
    <div class="content-header">
      <h2>占卜记录</h2>
      <p>查看所有占卜记录</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">占卜记录列表</div>
      </div>
      <div class="card-body">
        <div style="margin-bottom: 16px; display: flex; gap: 12px;">
          <input type="text" id="searchSessionCode" class="form-control" placeholder="搜索兑换码" style="width: 200px;" />
          <button onclick="searchSessions()" class="btn btn-primary">搜索</button>
        </div>
        <div id="sessionsTable"></div>
        <div id="sessionsPagination"></div>
      </div>
    </div>
  `;

  await loadSessionsList();
}

// 加载占卜记录列表
window.loadSessionsList = async function(page = 1, code = '') {
  const params = new URLSearchParams({ page, pageSize: 20 });
  if (code) params.append('code', code);

  try {
    const response = await apiRequest(`/api/admin-sessions?action=list&${params}`);
    
    const tableDiv = document.getElementById('sessionsTable');
    if (response.sessions.length === 0) {
      tableDiv.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 40px;">暂无数据</p>';
      return;
    }

    const tableHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>兑换码</th>
              <th>问题</th>
              <th>追问</th>
              <th>天使祝福</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${response.sessions.map(session => `
              <tr>
                <td>${new Date(session.created_at).toLocaleString('zh-CN')}</td>
                <td style="font-family: monospace;">${session.code}</td>
                <td>${session.question_preview}</td>
                <td>${session.followups_count}</td>
                <td>
                  <span class="badge badge-${session.has_angel_blessing ? 'success' : 'info'}">
                    ${session.has_angel_blessing ? '有' : '无'}
                  </span>
                </td>
                <td>
                  <button onclick="viewSessionDetail('${session.id}')" class="btn" style="font-size: 12px; padding: 6px 12px;">
                    查看详情
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    tableDiv.innerHTML = tableHTML;

    // 分页
    const paginationDiv = document.getElementById('sessionsPagination');
    const { page: currentPage, totalPages } = response.pagination;
    
    if (totalPages > 1) {
      let paginationHTML = '<div style="margin-top: 20px; text-align: center;">';
      
      if (currentPage > 1) {
        paginationHTML += `<button onclick="loadSessionsList(${currentPage - 1}, '${code}')" class="btn" style="margin: 0 4px;">上一页</button>`;
      }
      
      paginationHTML += `<span style="margin: 0 16px;">第 ${currentPage} / ${totalPages} 页</span>`;
      
      if (currentPage < totalPages) {
        paginationHTML += `<button onclick="loadSessionsList(${currentPage + 1}, '${code}')" class="btn" style="margin: 0 4px;">下一页</button>`;
      }
      
      paginationHTML += '</div>';
      paginationDiv.innerHTML = paginationHTML;
    } else {
      paginationDiv.innerHTML = '';
    }

  } catch (error) {
    console.error('加载占卜记录失败:', error);
    document.getElementById('sessionsTable').innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
};

// 搜索占卜记录
window.searchSessions = function() {
  const code = document.getElementById('searchSessionCode').value.trim();
  loadSessionsList(1, code);
};

// 查看占卜详情
window.viewSessionDetail = async function(id) {
  try {
    const response = await apiRequest(`/api/admin-sessions?action=detail&id=${id}`);
    const session = response.session;

    alert(`占卜详情：\n\n问题：${session.question}\n\n解析：${session.ai_reading ? session.ai_reading.substring(0, 200) + '...' : '暂无'}\n\n追问数：${session.followups.length}`);
  } catch (error) {
    alert('获取详情失败: ' + error.message);
  }
};

// 复制到剪贴板
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板！');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  });
};

// 退出登录
window.logout = function() {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/index.html';
  }
};

// 页面加载时初始化
init();
