// routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.ts';
import { createHmac } from 'node:crypto';

const router = express.Router();

// Логин админа
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const secret = 'gfrvwf23f';
    const passHash = createHmac('sha256', secret)
    .update(password)
    .digest('hex');
    // Простая проверка (в production используйте хеширование!)
    if ((username === 'admin') && password) {
      const user = await User.findOne({ 
        where: { username, role: 'admin', password: passHash } 
      });
      if (!user) {
        return res.status(401).json({ error: 'Admin not found' });
      }
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' } 
      );
      
      res.json({ token, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;