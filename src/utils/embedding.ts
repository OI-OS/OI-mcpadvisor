/**
 * 文本向量化工具
 * 注意：这是一个简化实现，实际应使用专业的嵌入模型
 */

/**
 * 创建固定长度的零向量
 */
const createZeroVector = (size: number): number[] => 
  new Array(size).fill(0);

/**
 * 向量归一化
 */
const normalizeVector = (vector: number[]): number[] => {
  const magnitude = calculateMagnitude(vector);
  
  if (magnitude === 0) {
    return vector;
  }
  
  return vector.map(val => val / magnitude);
};

/**
 * 计算向量幅度
 */
const calculateMagnitude = (vector: number[]): number => {
  const sumOfSquares = vector.reduce((sum, val) => sum + val * val, 0);
  return Math.sqrt(sumOfSquares);
};

/**
 * 更新向量值
 */
const updateVectorWithCharCode = (vector: number[], text: string): number[] => {
  const result = [...vector];
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    result[i % result.length] += charCode / 255;
  }
  
  return result;
};

/**
 * 将文本转换为向量表示
 * @param text 输入文本
 * @param dimensions 向量维度
 * @returns 归一化的向量表示
 */
export const getTextEmbedding = (text: string, dimensions: number = 1536): number[] => {
  if (!text) {
    return createZeroVector(dimensions);
  }
  
  // 创建初始向量
  const vector = createZeroVector(dimensions);
  
  // 使用字符编码更新向量
  const updatedVector = updateVectorWithCharCode(vector, text);
  
  // 归一化向量
  return normalizeVector(updatedVector);
};
