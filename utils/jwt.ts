import jwt from 'jsonwebtoken';

export type AppJwt = {
  sub: string;            // user id
  role: "admin" | "executive";
  email: string;
  iat?: number;
  exp?: number;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function signJwt(payload: Omit<AppJwt, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): AppJwt | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AppJwt;
  } catch {
    return null;
  }
}

export function getClaimsFromRequest(req: Request): Promise<AppJwt | null> {
  return new Promise((resolve) => {
    const token = req.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('access_token='))
      ?.split('=')[1];
    
    if (!token) {
      resolve(null);
      return;
    }
    
    resolve(verifyJwt(token));
  });
}
