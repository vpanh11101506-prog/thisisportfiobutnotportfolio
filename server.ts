import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'portfolio-state.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface PortfolioState {
  avatarUrl?: string;
  photos?: any[];
  updatedAt?: number;
  adminPasswordHash?: string;
  adminPasswordSalt?: string;
}

// In-memory set of valid admin tokens
const activeAdminTokens = new Set<string>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function loadState(): PortfolioState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const state = JSON.parse(raw);
      // Initialize default admin password if not yet set
      if (!state.adminPasswordHash) {
        const defaultSalt = crypto.randomBytes(16).toString('hex');
        state.adminPasswordSalt = defaultSalt;
        state.adminPasswordHash = hashPassword('suny0307', defaultSalt);
        saveState(state);
      }
      return state;
    }
  } catch (err) {
    console.error('Error loading portfolio state:', err);
  }

  // Create initial state with default password
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const initialState: PortfolioState = {
    adminPasswordSalt: defaultSalt,
    adminPasswordHash: hashPassword('suny0307', defaultSalt),
  };
  saveState(initialState);
  return initialState;
}

function saveState(state: PortfolioState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving portfolio state:', err);
  }
}

// Middleware to protect admin-only endpoints
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token =
    (req.headers['x-admin-token'] as string) ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (!token || !activeAdminTokens.has(token)) {
    return res.status(403).json({
      error: 'Từ chối quyền truy cập: Bạn đang ở chế độ Người Xem (Viewer). Chỉ Admin mới có quyền sửa!',
      isViewer: true,
    });
  }

  next();
}

async function startServer() {
  const app = express();

  // Allow larger payloads for base64 image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Static uploads route (accessible to all clients)
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Auth: Login as Admin
  app.post('/api/auth/login', (req, res) => {
    try {
      const { password } = req.body;
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu admin!' });
      }

      const state = loadState();
      const salt = state.adminPasswordSalt || 'default_salt';
      const expectedHash = state.adminPasswordHash;

      const inputHash = hashPassword(password, salt);
      if (inputHash !== expectedHash) {
        return res.status(401).json({ error: 'Mật khẩu quản trị viên không chính xác!' });
      }

      // Generate random session token
      const token = crypto.randomBytes(32).toString('hex');
      activeAdminTokens.add(token);

      return res.json({
        success: true,
        token,
        role: 'admin',
        message: 'Đăng nhập Admin thành công!',
      });
    } catch (err: any) {
      console.error('Error in login:', err);
      res.status(500).json({ error: 'Lỗi đăng nhập server' });
    }
  });

  // Auth: Check status (Admin or Viewer)
  app.get('/api/auth/status', (req, res) => {
    const token =
      (req.headers['x-admin-token'] as string) ||
      req.headers['authorization']?.replace(/^Bearer\s+/i, '');

    const isAdmin = Boolean(token && activeAdminTokens.has(token));
    res.json({
      isAdmin,
      role: isAdmin ? 'admin' : 'viewer',
    });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req, res) => {
    const token =
      (req.headers['x-admin-token'] as string) ||
      req.headers['authorization']?.replace(/^Bearer\s+/i, '');

    if (token) {
      activeAdminTokens.delete(token);
    }
    res.json({ success: true, message: 'Đã chuyển về chế độ Người xem (Viewer)' });
  });

  // Auth: Change Admin Password (requires current admin token)
  app.post('/api/auth/change-password', requireAdmin, (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự!' });
      }

      const state = loadState();
      const salt = state.adminPasswordSalt || 'default_salt';
      if (currentPassword) {
        const checkHash = hashPassword(currentPassword, salt);
        if (checkHash !== state.adminPasswordHash) {
          return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng!' });
        }
      }

      const newSalt = crypto.randomBytes(16).toString('hex');
      state.adminPasswordSalt = newSalt;
      state.adminPasswordHash = hashPassword(newPassword, newSalt);
      state.updatedAt = Date.now();
      saveState(state);

      res.json({ success: true, message: 'Đã đổi mật khẩu Admin thành công!' });
    } catch (err: any) {
      console.error('Error changing password:', err);
      res.status(500).json({ error: 'Lỗi cập nhật mật khẩu' });
    }
  });

  // Get current global portfolio state (shared with all visitors)
  app.get('/api/portfolio', (req, res) => {
    const state = loadState();
    res.json({
      success: true,
      avatarUrl: state.avatarUrl || null,
      photos: state.photos || null,
      updatedAt: state.updatedAt || null,
    });
  });

  // Update global avatar (Admin only)
  app.post('/api/portfolio/avatar', requireAdmin, (req, res) => {
    try {
      const { avatarUrl, imageBase64 } = req.body;
      const state = loadState();

      if (imageBase64 || (avatarUrl && avatarUrl.startsWith('data:'))) {
        const rawData = imageBase64 || avatarUrl;
        const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let ext = 'jpg';
        let buffer: Buffer;

        if (matches && matches.length === 3) {
          const detectedMime = matches[1];
          if (detectedMime.includes('png')) ext = 'png';
          else if (detectedMime.includes('webp')) ext = 'webp';
          else if (detectedMime.includes('gif')) ext = 'gif';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(rawData, 'base64');
        }

        const fileName = `avatar_${Date.now()}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        // Also copy to dist/uploads if dist exists
        const distUploads = path.join(process.cwd(), 'dist', 'uploads');
        if (fs.existsSync(distUploads)) {
          fs.writeFileSync(path.join(distUploads, fileName), buffer);
        }

        const publicUrl = `/uploads/${fileName}`;
        state.avatarUrl = publicUrl;
        state.updatedAt = Date.now();
        saveState(state);

        return res.json({
          success: true,
          avatarUrl: publicUrl,
          message: 'Đã lưu ảnh đại diện lên server thành công!',
        });
      } else if (avatarUrl) {
        state.avatarUrl = avatarUrl;
        state.updatedAt = Date.now();
        saveState(state);

        return res.json({
          success: true,
          avatarUrl,
          message: 'Đã lưu link ảnh đại diện lên server thành công!',
        });
      }

      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh' });
    } catch (err: any) {
      console.error('Error saving avatar:', err);
      res.status(500).json({ error: err?.message || 'Lỗi khi lưu ảnh lên server' });
    }
  });

  // Update polaroid photos (Admin only)
  app.post('/api/portfolio/photos', requireAdmin, (req, res) => {
    try {
      const { photos } = req.body;
      if (!Array.isArray(photos)) {
        return res.status(400).json({ error: 'photos must be an array' });
      }

      const state = loadState();
      state.photos = photos;
      state.updatedAt = Date.now();
      saveState(state);

      res.json({ success: true, message: 'Đã lưu danh sách ảnh lên server!' });
    } catch (err: any) {
      console.error('Error saving photos:', err);
      res.status(500).json({ error: err?.message || 'Lỗi khi lưu danh sách ảnh' });
    }
  });

  // Reset avatar to default (Admin only)
  app.post('/api/portfolio/reset-avatar', requireAdmin, (req, res) => {
    try {
      const state = loadState();
      delete state.avatarUrl;
      state.updatedAt = Date.now();
      saveState(state);

      res.json({ success: true, message: 'Đã khôi phục ảnh đại diện mặc định!' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Lỗi khi khôi phục ảnh' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
