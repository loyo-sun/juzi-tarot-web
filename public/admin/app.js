const { createApp, ref, reactive, computed, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

// API 基础URL
const API_BASE = '/api';

// 认证工具
const auth = {
  getToken() {
    return localStorage.getItem('admin_token');
  },
  setToken(token) {
    localStorage.getItem('admin_token', token);
  },
  removeToken() {
    localStorage.removeItem('admin_token');
  },
  async request(url, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!data.success && response.status === 401) {
      this.removeToken();
      window.location.href = '/admin/login.html';
      return;
    }

    return data;
  }
};

// ==================== 组件：创建兑换码 ====================
const CreateCodeComponent = {
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">创建兑换码</h1>
        <p class="page-description">批量生成兑换码，用于用户占卜</p>
      </div>

      <div class="content-card form-card">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
          <el-form-item label="生成数量" prop="count" required>
            <el-input-number 
              v-model="form.count" 
              :min="1" 
              :max="100"
              placeholder="默认 1"
            />
            <span style="margin-left: 10px; color: #909399;">最多 100 个</span>
          </el-form-item>

          <el-form-item label="提问次数" prop="question_limit" required>
            <el-input-number 
              v-model="form.question_limit" 
              :min="1" 
              :max="100"
              placeholder="默认 1"
            />
            <span style="margin-left: 10px; color: #909399;">每个兑换码可提问次数</span>
          </el-form-item>

          <el-form-item label="追问次数" prop="followup_limit_per_question" required>
            <el-input-number 
              v-model="form.followup_limit_per_question" 
              :min="0" 
              :max="20"
              placeholder="默认 10"
            />
            <span style="margin-left: 10px; color: #909399;">每个问题可追问次数</span>
          </el-form-item>

          <el-form-item label="有效期" prop="expires_days">
            <el-radio-group v-model="form.expiresType">
              <el-radio label="permanent">永久有效</el-radio>
              <el-radio label="custom">自定义天数</el-radio>
            </el-radio-group>
            <el-input-number 
              v-if="form.expiresType === 'custom'"
              v-model="form.expires_days" 
              :min="1" 
              :max="365"
              placeholder="天数"
              style="margin-top: 10px;"
            />
          </el-form-item>

          <el-form-item label="备注">
            <el-input 
              v-model="form.note" 
              type="textarea"
              :rows="3"
              placeholder="选填，记录该批兑换码的用途"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleGenerate" :loading="loading">
              <el-icon><el-icon-plus /></el-icon>
              生成兑换码
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 生成结果 -->
        <el-divider v-if="generatedCodes.length > 0" />
        <div v-if="generatedCodes.length > 0">
          <el-alert
            title="兑换码生成成功！"
            type="success"
            :closable="false"
            style="margin-bottom: 20px;"
          >
            <template #default>
              <p>成功生成 {{ generatedCodes.length }} 个兑换码，请妥善保管。</p>
            </template>
          </el-alert>

          <el-table :data="generatedCodes" border style="width: 100%">
            <el-table-column prop="code" label="兑换码" width="180">
              <template #default="{ row }">
                <el-tag>{{ row.code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="question_limit" label="提问次数" width="100" />
            <el-table-column prop="followup_limit_per_question" label="追问次数" width="100" />
            <el-table-column prop="expires_at" label="过期时间">
              <template #default="{ row }">
                {{ row.expires_at ? formatDate(row.expires_at) : '永久有效' }}
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 20px; text-align: center;">
            <el-button @click="copyAllCodes">
              <el-icon><el-icon-copy-document /></el-icon>
              复制所有兑换码
            </el-button>
            <el-button @click="exportCodes">
              <el-icon><el-icon-download /></el-icon>
              导出为文本
            </el-button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const formRef = ref(null);
    const loading = ref(false);
    const generatedCodes = ref([]);

    const form = reactive({
      count: 1,
      question_limit: 1,
      followup_limit_per_question: 10,
      expiresType: 'permanent',
      expires_days: 30,
      note: ''
    });

    const rules = {
      count: [{ required: true, message: '请输入生成数量', trigger: 'blur' }],
      question_limit: [{ required: true, message: '请输入提问次数', trigger: 'blur' }],
      followup_limit_per_question: [{ required: true, message: '请输入追问次数', trigger: 'blur' }]
    };

    const handleGenerate = async () => {
      if (!formRef.value) return;
      
      try {
        await formRef.value.validate();
        loading.value = true;

        const requestData = {
          count: form.count,
          question_limit: form.question_limit,
          followup_limit_per_question: form.followup_limit_per_question,
          note: form.note || undefined
        };

        // 只有选择自定义天数时才传 expires_days
        if (form.expiresType === 'custom') {
          requestData.expires_days = form.expires_days;
        }

        const response = await auth.request(`${API_BASE}/admin-codes?action=generate`, {
          method: 'POST',
          body: JSON.stringify(requestData)
        });

        if (response.success) {
          generatedCodes.value = response.codes;
          ElMessage.success(`成功生成 ${response.count} 个兑换码`);
        } else {
          ElMessage.error(response.error || '生成失败');
        }
      } catch (error) {
        console.error('生成失败:', error);
        ElMessage.error('生成失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields();
      }
      generatedCodes.value = [];
    };

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString('zh-CN');
    };

    const copyAllCodes = () => {
      const codes = generatedCodes.value.map(c => c.code).join('\n');
      navigator.clipboard.writeText(codes).then(() => {
        ElMessage.success('已复制到剪贴板');
      });
    };

    const exportCodes = () => {
      const content = generatedCodes.value.map(c => 
        `${c.code}\t${c.question_limit}\t${c.followup_limit_per_question}\t${c.expires_at || '永久有效'}`
      ).join('\n');
      
      const header = '兑换码\t提问次数\t追问次数\t过期时间\n';
      const blob = new Blob([header + content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `兑换码_${new Date().getTime()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return {
      formRef,
      form,
      rules,
      loading,
      generatedCodes,
      handleGenerate,
      resetForm,
      formatDate,
      copyAllCodes,
      exportCodes
    };
  }
};

// ==================== 组件：兑换码管理 ====================
const ManageCodesComponent = {
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">兑换码管理</h1>
        <p class="page-description">查看和管理所有兑换码</p>
      </div>

      <div class="content-card">
        <!-- 搜索筛选 -->
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="兑换码">
            <el-input 
              v-model="searchForm.search" 
              placeholder="搜索兑换码或备注"
              clearable
            />
          </el-form-item>

          <el-form-item label="激活状态">
            <el-select v-model="searchForm.is_active" placeholder="全部" clearable>
              <el-option label="启用" value="true" />
              <el-option label="停用" value="false" />
            </el-select>
          </el-form-item>

          <el-form-item label="使用状态">
            <el-select v-model="searchForm.usage_status" placeholder="全部" clearable>
              <el-option label="未使用" value="unused" />
              <el-option label="使用中" value="in_use" />
              <el-option label="已使用" value="used" />
            </el-select>
          </el-form-item>

          <el-form-item label="过期时间">
            <el-date-picker
              v-model="searchForm.expires_date"
              type="date"
              placeholder="选择日期"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="loadCodes">
              <el-icon><el-icon-search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <el-divider />

        <!-- 表格 -->
        <el-table 
          :data="codes" 
          border 
          v-loading="loading"
          style="width: 100%"
        >
          <el-table-column prop="code" label="兑换码" width="160" fixed>
            <template #default="{ row }">
              <el-tag>{{ row.code }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="激活状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'">
                {{ row.is_active ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="使用状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.usage_status === 'unused' ? '' : (row.usage_status === 'in_use' ? 'warning' : 'info')"
              >
                {{ getUsageStatusText(row.usage_status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="使用情况" width="120">
            <template #default="{ row }">
              <span>{{ row.question_used }} / {{ row.question_limit }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="followup_limit_per_question" label="追问次数" width="100" />

          <el-table-column label="过期时间" width="180">
            <template #default="{ row }">
              {{ row.expires_at ? formatDate(row.expires_at) : '永久有效' }}
            </template>
          </el-table-column>

          <el-table-column prop="note" label="备注" min-width="150" show-overflow-tooltip />

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button
                  v-if="row.is_active"
                  size="small"
                  type="warning"
                  @click="toggleActive(row, false)"
                >
                  停用
                </el-button>
                <el-button
                  v-else
                  size="small"
                  type="success"
                  @click="toggleActive(row, true)"
                >
                  启用
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div style="margin-top: 20px; text-align: center;">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadCodes"
            @current-change="loadCodes"
          />
        </div>
      </div>
    </div>
  `,
  setup() {
    const loading = ref(false);
    const codes = ref([]);
    
    const searchForm = reactive({
      search: '',
      is_active: '',  // 默认为空（全部）
      usage_status: '',  // 默认为空（全部）
      expires_date: null
    });

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    });

    const loadCodes = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });

        if (searchForm.search) params.append('search', searchForm.search);
        if (searchForm.is_active) params.append('is_active', searchForm.is_active);
        if (searchForm.usage_status) params.append('usage_status', searchForm.usage_status);
        
        const response = await auth.request(
          `${API_BASE}/admin-codes?action=list&${params}`
        );

        if (response.success) {
          codes.value = response.codes;
          pagination.total = response.pagination.total;
        } else {
          ElMessage.error(response.error || '加载失败');
        }
      } catch (error) {
        console.error('加载失败:', error);
        ElMessage.error('加载失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    const resetSearch = () => {
      searchForm.search = '';
      searchForm.is_active = '';
      searchForm.usage_status = '';
      searchForm.expires_date = null;
      pagination.page = 1;
      loadCodes();
    };

    const toggleActive = async (row, isActive) => {
      try {
        await ElMessageBox.confirm(
          `确定要${isActive ? '启用' : '停用'}兑换码 ${row.code} 吗？`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        const response = await auth.request(
          `${API_BASE}/admin-codes?action=update&id=${row.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ is_active: isActive })
          }
        );

        if (response.success) {
          ElMessage.success(isActive ? '已启用' : '已停用');
          loadCodes();
        } else {
          ElMessage.error(response.error || '操作失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('操作失败:', error);
          ElMessage.error('操作失败，请稍后重试');
        }
      }
    };

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString('zh-CN');
    };

    const getUsageStatusText = (status) => {
      const map = {
        'unused': '未使用',
        'in_use': '使用中',
        'used': '已使用'
      };
      return map[status] || status;
    };

    onMounted(() => {
      loadCodes();
    });

    return {
      loading,
      codes,
      searchForm,
      pagination,
      loadCodes,
      resetSearch,
      toggleActive,
      formatDate,
      getUsageStatusText
    };
  }
};

// 组件待续...（由于文件太长，我会继续创建）

// ==================== 组件：占卜记录 ====================
const SessionsComponent = {
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">占卜记录</h1>
        <p class="page-description">查看所有用户的占卜记录</p>
      </div>

      <div class="content-card">
        <!-- 搜索筛选 -->
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="兑换码">
            <el-input 
              v-model="searchForm.code" 
              placeholder="搜索兑换码"
              clearable
            />
          </el-form-item>

          <el-form-item label="日期范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="loadSessions">
              <el-icon><el-icon-search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <el-divider />

        <!-- 表格 -->
        <el-table 
          :data="sessions" 
          border 
          v-loading="loading"
          style="width: 100%"
        >
          <el-table-column prop="code" label="兑换码" width="140">
            <template #default="{ row }">
              <el-tag size="small">{{ row.code }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="question_preview" label="问题" min-width="200" show-overflow-tooltip />

          <el-table-column label="卡牌" width="80">
            <template #default="{ row }">
              {{ row.cards_count }} 张
            </template>
          </el-table-column>

          <el-table-column label="追问" width="80">
            <template #default="{ row }">
              {{ row.followups_count }} 次
            </template>
          </el-table-column>

          <el-table-column label="天使祝福" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.has_angel_blessing" type="success" size="small">有</el-tag>
              <span v-else style="color: #909399;">无</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
                {{ row.status === 'completed' ? '已完成' : '进行中' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                @click="viewDetail(row.id)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div style="margin-top: 20px; text-align: center;">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadSessions"
            @current-change="loadSessions"
          />
        </div>
      </div>

      <!-- 详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="占卜详情"
        width="800px"
        :close-on-click-modal="false"
      >
        <div v-if="currentSession" v-loading="detailLoading">
          <!-- 基本信息 -->
          <el-descriptions :column="2" border>
            <el-descriptions-item label="兑换码">
              <el-tag>{{ currentSession.code }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentSession.status === 'completed' ? 'success' : 'warning'">
                {{ currentSession.status === 'completed' ? '已完成' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">
              {{ formatDate(currentSession.created_at) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 问题 -->
          <el-divider content-position="left">
            <strong>🔮 占卜问题</strong>
          </el-divider>
          <el-card shadow="never" style="background: #f5f7fa;">
            <p style="font-size: 16px; line-height: 1.6;">{{ currentSession.question }}</p>
          </el-card>

          <!-- 抽取的卡牌 -->
          <el-divider content-position="left">
            <strong>🎴 抽取的卡牌</strong>
          </el-divider>
          <div class="card-display">
            <div 
              v-for="(card, index) in currentSession.cards" 
              :key="index"
              class="card-item"
            >
              <img 
                :src="getCardImage(card.index)" 
                :alt="card.name"
                class="card-image"
                :style="{ transform: card.reversed ? 'rotate(180deg)' : 'none' }"
              />
              <div class="card-name">{{ card.name }}</div>
              <div v-if="card.reversed" class="card-reversed">【逆位】</div>
              <el-tag size="small" style="margin-top: 5px;">{{ card.position }}</el-tag>
            </div>
          </div>

          <!-- AI 解析 -->
          <el-divider content-position="left">
            <strong>✨ AI 解析</strong>
          </el-divider>
          <el-card shadow="never" v-if="currentSession.ai_reading">
            <div style="white-space: pre-wrap; line-height: 1.8;">{{ currentSession.ai_reading }}</div>
          </el-card>
          <el-empty v-else description="暂无解析结果" :image-size="80" />

          <!-- 追问记录 -->
          <el-divider content-position="left" v-if="currentSession.followups && currentSession.followups.length > 0">
            <strong>💭 追问记录（{{ currentSession.followups.length }}）</strong>
          </el-divider>
          <div v-if="currentSession.followups && currentSession.followups.length > 0">
            <el-timeline>
              <el-timeline-item 
                v-for="(followup, index) in currentSession.followups" 
                :key="followup.id"
                :timestamp="formatDate(followup.created_at)"
              >
                <el-card>
                  <template #header>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <strong>追问 {{ index + 1 }}</strong>
                      <el-tag size="small">{{ followup.card.name }}</el-tag>
                    </div>
                  </template>
                  <p><strong>问题：</strong>{{ followup.question }}</p>
                  <p v-if="followup.ai_reading" style="margin-top: 10px; color: #606266;">
                    <strong>解答：</strong>{{ followup.ai_reading }}
                  </p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 天使祝福 -->
          <el-divider content-position="left" v-if="currentSession.angel_blessing_card">
            <strong>👼 天使祝福</strong>
          </el-divider>
          <div v-if="currentSession.angel_blessing_card" class="card-display">
            <div class="card-item">
              <img 
                :src="getCardImage(currentSession.angel_blessing_card.index)" 
                :alt="currentSession.angel_blessing_card.name"
                class="card-image"
              />
              <div class="card-name">{{ currentSession.angel_blessing_card.name }}</div>
            </div>
            <el-card shadow="never" style="flex: 1;" v-if="currentSession.angel_blessing_text">
              <div style="white-space: pre-wrap; line-height: 1.8;">{{ currentSession.angel_blessing_text }}</div>
            </el-card>
          </div>
        </div>

        <template #footer>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  setup() {
    const loading = ref(false);
    const detailLoading = ref(false);
    const sessions = ref([]);
    const detailDialogVisible = ref(false);
    const currentSession = ref(null);
    
    const searchForm = reactive({
      code: '',
      dateRange: null
    });

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    });

    const loadSessions = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: pagination.page,
          pageSize: pagination.pageSize
        });

        if (searchForm.code) params.append('code', searchForm.code);
        if (searchForm.dateRange && searchForm.dateRange.length === 2) {
          params.append('startDate', searchForm.dateRange[0].toISOString());
          params.append('endDate', searchForm.dateRange[1].toISOString());
        }
        
        const response = await auth.request(
          `${API_BASE}/admin-sessions?action=list&${params}`
        );

        if (response.success) {
          sessions.value = response.sessions;
          pagination.total = response.pagination.total;
        } else {
          ElMessage.error(response.error || '加载失败');
        }
      } catch (error) {
        console.error('加载失败:', error);
        ElMessage.error('加载失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    const viewDetail = async (id) => {
      detailDialogVisible.value = true;
      detailLoading.value = true;
      
      try {
        const response = await auth.request(
          `${API_BASE}/admin-sessions?action=detail&id=${id}`
        );

        if (response.success) {
          currentSession.value = response.session;
        } else {
          ElMessage.error(response.error || '加载失败');
        }
      } catch (error) {
        console.error('加载失败:', error);
        ElMessage.error('加载失败，请稍后重试');
      } finally {
        detailLoading.value = false;
      }
    };

    const resetSearch = () => {
      searchForm.code = '';
      searchForm.dateRange = null;
      pagination.page = 1;
      loadSessions();
    };

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString('zh-CN');
    };

    const getCardImage = (index) => {
      return `/cards/${index}.webp`;
    };

    onMounted(() => {
      loadSessions();
    });

    return {
      loading,
      detailLoading,
      sessions,
      searchForm,
      pagination,
      detailDialogVisible,
      currentSession,
      loadSessions,
      viewDetail,
      resetSearch,
      formatDate,
      getCardImage
    };
  }
};

// ==================== 主应用 ====================
const app = createApp({
  setup() {
    const activeMenu = ref('create-code');
    const currentComponent = ref('CreateCode');
    const adminInfo = reactive({
      email: '',
      name: ''
    });

    const componentMap = {
      'create-code': 'CreateCode',
      'manage-codes': 'ManageCodes',
      'sessions': 'Sessions',
      'stats': 'Stats'
    };

    const handleMenuSelect = (key) => {
      activeMenu.value = key;
      currentComponent.value = componentMap[key] || 'CreateCode';
    };

    const handleCommand = (command) => {
      if (command === 'logout') {
        ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          auth.removeToken();
          window.location.href = '/admin/login.html';
        }).catch(() => {});
      }
    };

    const checkAuth = async () => {
      const token = auth.getToken();
      if (!token) {
        window.location.href = '/admin/login.html';
        return;
      }

      try {
        const response = await auth.request(`${API_BASE}/admin-auth?action=me`);
        if (response.success) {
          Object.assign(adminInfo, response.admin);
        } else {
          window.location.href = '/admin/login.html';
        }
      } catch (error) {
        console.error('验证失败:', error);
        window.location.href = '/admin/login.html';
      }
    };

    onMounted(() => {
      checkAuth();
    });

    return {
      activeMenu,
      currentComponent,
      adminInfo,
      handleMenuSelect,
      handleCommand
    };
  },
  components: {
    CreateCode: CreateCodeComponent,
    ManageCodes: ManageCodesComponent,
    Sessions: SessionsComponent
  }
});

// 使用 Element Plus
app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(`ElIcon${key}`, component);
}

app.mount('#app');
