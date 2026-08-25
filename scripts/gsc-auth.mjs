#!/usr/bin/env node

/**
 * GSC OAuth2 授权脚本（一体化）
 *
 * 1. 启动本地回调服务器 (localhost:3000)
 * 2. 打开浏览器进行 Google 登录授权
 * 3. 自动获取 authorization code
 * 4. 交换 refresh_token
 *
 * 用法：node scripts/gsc-auth.mjs
 */

import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import { URL } from 'url';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3847/callback';
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const PORT = 3847;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// ─── 回调服务器 ───
function createCallbackServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>❌ 授权失败</h1><p>错误：${error}</p><p>请关闭此页面并重试。</p>`);
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html><head><meta charset="utf-8"></head>
            <body style="font-family:system-ui;max-width:500px;margin:60px auto;text-align:center">
            <h1>✅ 授权成功！</h1>
            <p>Authorization code 已获取</p>
            <p style="color:#666">请返回终端查看 refresh_token</p>
            <p style="color:#999;font-size:13px">此页面可以关闭</p>
            </body></html>
          `);

          resolve(code);
          setTimeout(() => server.close(), 1000);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>❌ 缺少 code 参数</h1>');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404</h1>');
      }
    });

    server.listen(PORT, () => {
      console.log(`  ✓ 回调服务器已启动：http://localhost:${PORT}`);
    });
  });
}

// ─── 浏览器打开 ───
async function openBrowser(url) {
  try {
    const open = await import('open');
    await open.default(url);
    return true;
  } catch {
    return false;
  }
}

// ─── 主流程 ───
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Kestrel Metal — GSC OAuth2 Authorization');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 生成授权 URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  // 启动回调服务器并等待 code
  const codePromise = createCallbackServer();

  // 打开浏览器
  console.log('  ▶ 打开浏览器进行授权...');
  const opened = await openBrowser(authUrl);
  if (!opened) {
    console.log('  请手动打开以下链接：');
    console.log('');
    console.log(authUrl);
  }
  console.log('');
  console.log('  ▶ 在浏览器中：');
  console.log('    1. 使用你的 Google 账号登录');
  console.log('    2. 如看到"此应用未经验证"，点击"继续"或"前往 XXX"');
  console.log('    3. 点击"允许"');
  console.log('');
  console.log('  ⏳ 等待授权回调...');
  console.log('');

  // 等待 code
  const code = await codePromise;

  // 交换 token
  console.log('  ▶ 获取 Token...');

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // 验证身份
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ 授权成功！');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  授权账号：', payload.email);
  console.log('');
  console.log('  ▶ 以下是配置 Cloudflare Worker Secret 所需的值：');
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │  GOOGLE_CLIENT_ID                                   │');
  console.log('  │  ' + CLIENT_ID);
  console.log('  │                                                     │');
  console.log('  │  GOOGLE_CLIENT_SECRET                               │');
  console.log('  │  ' + CLIENT_SECRET);
  console.log('  │                                                     │');
  console.log('  │  GSC_REFRESH_TOKEN                                  │');
  console.log('  │  ' + tokens.refresh_token);
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('');

  if (!tokens.refresh_token) {
    console.log('⚠️  未返回 refresh_token');
    console.log('   可能需要重新授权，请确保添加了 prompt=consent 参数');
    console.log('   或在 Google 账号设置中撤销此应用的访问权限后重新授权');
  } else {
    console.log('  ▶ 下一步运行以下命令配置到 Cloudflare：');
    console.log('');
    console.log('    echo "' + tokens.refresh_token + '" | npx wrangler secret put GSC_REFRESH_TOKEN');
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ 授权失败：', err.message);
  process.exit(1);
});
