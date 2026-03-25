import jwt from 'jsonwebtoken';

// 强制要求设置 JWT_SECRET 环境变量
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Please set it in your .env file or environment configuration.'
  );
}

export interface JWTPayload {
  userId: string;
  phone: string;
  role: string;
  activeRole?: 'BOSS' | 'RUNNER';  // 当前激活的身份
}

// 签发 JWT
export function signToken(payload: JWTPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: expiresIn as any });
}

// 验证 JWT
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET as string) as JWTPayload;
}

// 从请求头中提取 token
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
