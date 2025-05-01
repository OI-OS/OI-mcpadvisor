/**
 * Application constants
 */

import path from 'path';

export const COMPASS_API_BASE = "https://registry.mcphub.io";
export const OCEANBASE_API_BASE = "https://registry.mcphub.io";
export const SERVER_NAME = "mcpadvisor";
export const SERVER_VERSION = "1.0.0";

// OceanBase configuration
export const CERT_PATH = path.resolve(process.cwd(), 'certs/ca.pem');
export const OCEANBASE_URL = process.env.OCEANBASE_URL || 
  'mysql://xiaohui0501:YQGWE*XNWMbpTg@obmt6pb9nrl5dk0w-mi.aliyun-cn-hangzhou-internet.oceanbase.cloud:3306/mcpadvisor';
export const DB_MAX_CONNECTIONS = Number(process.env.DB_MAX_CONNECTIONS || 20);
export const DB_TABLE_NAME = 'mcp_vector_data';
export const VECTOR_ENGINE_TYPE = process.env.VECTOR_ENGINE_TYPE || 'oceanbase'; 
export const GETMCP_API_URL = 'https://getmcp.io/api/servers.json';
export const CACHE_TTL_MS = 3600000; // 1 hour
