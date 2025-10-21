import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // если это попытка залогиниться, то не проверять этот маршрут
  if(req.path == '/login'){
    next();
    return true;
  }
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};