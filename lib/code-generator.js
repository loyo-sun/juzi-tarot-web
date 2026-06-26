/**
 * 兑换码生成器
 * 使用雪花算法确保唯一性，并进行额外的随机化处理
 */

import { supabaseAdmin } from './supabase.js';

// 雪花算法配置
const EPOCH = 1640995200000; // 2022-01-01 00:00:00 UTC
const WORKER_ID_BITS = 5;
const DATACENTER_ID_BITS = 5;
const SEQUENCE_BITS = 12;

const MAX_WORKER_ID = (1 << WORKER_ID_BITS) - 1;
const MAX_DATACENTER_ID = (1 << DATACENTER_ID_BITS) - 1;
const MAX_SEQUENCE = (1 << SEQUENCE_BITS) - 1;

const WORKER_ID_SHIFT = SEQUENCE_BITS;
const DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS;

class Snowflake {
  constructor(workerId = 1, datacenterId = 1) {
    if (workerId > MAX_WORKER_ID || workerId < 0) {
      throw new Error(`Worker ID must be between 0 and ${MAX_WORKER_ID}`);
    }
    if (datacenterId > MAX_DATACENTER_ID || datacenterId < 0) {
      throw new Error(`Datacenter ID must be between 0 and ${MAX_DATACENTER_ID}`);
    }

    this.workerId = workerId;
    this.datacenterId = datacenterId;
    this.sequence = 0;
    this.lastTimestamp = -1;
  }

  generate() {
    let timestamp = Date.now();

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate id');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & MAX_SEQUENCE;
      if (this.sequence === 0) {
        // Sequence overflow, wait for next millisecond
        timestamp = this.waitNextMillis(timestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // Generate snowflake ID
    const id =
      ((timestamp - EPOCH) << TIMESTAMP_SHIFT) |
      (this.datacenterId << DATACENTER_ID_SHIFT) |
      (this.workerId << WORKER_ID_SHIFT) |
      this.sequence;

    return id;
  }

  waitNextMillis(currentTimestamp) {
    let timestamp = Date.now();
    while (timestamp <= currentTimestamp) {
      timestamp = Date.now();
    }
    return timestamp;
  }
}

// 创建雪花算法实例（使用随机的 worker 和 datacenter ID）
const snowflake = new Snowflake(
  Math.floor(Math.random() * (MAX_WORKER_ID + 1)),
  Math.floor(Math.random() * (MAX_DATACENTER_ID + 1))
);

/**
 * 将数字转换为自定义的 Base36 字符串（去除易混淆字符）
 * 字符集：0-9, A-Z（去除 O, I, L）
 */
const CHARSET = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 33 个字符（去除 O, I, L）
const BASE = CHARSET.length;

function encodeBase(num) {
  if (num === 0) return CHARSET[0];
  
  let result = '';
  let n = BigInt(num);
  
  while (n > 0) {
    result = CHARSET[Number(n % BigInt(BASE))] + result;
    n = n / BigInt(BASE);
  }
  
  return result;
}

/**
 * 对字符串进行随机打乱（Fisher-Yates shuffle）
 */
function shuffleString(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

/**
 * 生成一个兑换码
 * 格式：XXXX-XXXX-XXXX (12位)
 * 基于雪花算法 + 随机化，确保唯一性且无规律
 */
function generateSingleCode() {
  // 1. 生成雪花 ID
  const snowflakeId = snowflake.generate();
  
  // 2. 转换为 Base33 字符串
  let code = encodeBase(snowflakeId);
  
  // 3. 添加随机盐值增强随机性
  const salt = Math.random().toString(36).substring(2, 6).toUpperCase();
  code = code + salt;
  
  // 4. 打乱字符顺序
  code = shuffleString(code);
  
  // 5. 截取或填充到 12 位
  if (code.length > 12) {
    // 从随机位置截取 12 位
    const start = Math.floor(Math.random() * (code.length - 12));
    code = code.substring(start, start + 12);
  } else if (code.length < 12) {
    // 填充到 12 位
    while (code.length < 12) {
      code += CHARSET[Math.floor(Math.random() * BASE)];
    }
  }
  
  // 6. 格式化为 XXXX-XXXX-XXXX
  return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
}

/**
 * 检查兑换码是否已存在
 * @param {string} code - 兑换码
 * @returns {Promise<boolean>} 是否存在
 */
async function isCodeExists(code) {
  const { data, error } = await supabaseAdmin
    .from('redemption_codes')
    .select('id')
    .eq('code', code)
    .single();
  
  return !error && data !== null;
}

/**
 * 生成唯一的兑换码（确保不重复）
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<string>} 唯一的兑换码
 */
export async function generateUniqueCode(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateSingleCode();
    
    // 检查是否已存在
    const exists = await isCodeExists(code);
    if (!exists) {
      return code;
    }
    
    // 如果存在，等待 1ms 后重试（让雪花算法生成新的时间戳）
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  throw new Error('生成唯一兑换码失败，请重试');
}

/**
 * 批量生成唯一的兑换码
 * @param {number} count - 生成数量
 * @returns {Promise<Array<string>>} 兑换码数组
 */
export async function generateUniqueCodes(count) {
  const codes = [];
  const batchSize = 10; // 每批生成 10 个
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = Math.min(batchSize, count - i);
    const promises = Array.from({ length: batch }, () => generateUniqueCode());
    
    try {
      const batchCodes = await Promise.all(promises);
      codes.push(...batchCodes);
    } catch (error) {
      throw new Error(`批量生成兑换码失败: ${error.message}`);
    }
  }
  
  return codes;
}

/**
 * 验证兑换码格式
 * @param {string} code - 兑换码
 * @returns {boolean} 是否有效
 */
export function validateCodeFormat(code) {
  // 格式：XXXX-XXXX-XXXX
  const pattern = /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/;
  return pattern.test(code);
}
