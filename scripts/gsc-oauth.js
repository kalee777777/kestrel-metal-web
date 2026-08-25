#!/usr/bin/env node

/**
 * GSC OAuth2 授权脚本
 *
 * 使用 OAuth2 桌面客户端获取 Google Search Console API 的 refresh_token
 * 运行后浏览器会自动打开 Google 登录页面
 *
 * 用法：node scripts/gsc-oauth.js
 */

import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import { URL } from 'url';
import readline from 'readline';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function getAuthUrl() {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

function exchangeCode(code) {
  return client.getToken(code);
}

function verifyToken(tokens) {
  return client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CLIENT_ID,
  });
}

function waitForCode() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.question('请在此处粘贴授权回调 URL 中的 code 参数：\n', (answer) => {
      rl.close();
      const code = answer.trim();
      if (!code) {
        reject(new Error('未输入 code'));
        return;
      }
      resolve(code);
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Kestrel Metal — GSC OAuth2 Authorization');
  console.log('═══════════════════════════════════════════════════════════\n');

  const authUrl = getAuthUrl();

  console.log('▶ 步骤 1：浏览器打开授权页面');
  console.log('  浏览器将自动打开。如果没有，请手动打开以下链接：');
  console.log('');
  console.log(authUrl);
  console.log('');

  try {
    const open = await import('open');
    await open.default(authUrl);
    console.log('  浏览器已打开 ✓');
  } catch {
    console.log('  请手动打开上述链接');
  }

  console.log('');
  console.log('▶ 步骤 2：在浏览器中完成授权');
  console.log('  1. 使用 kestrel-seo@gmail.com 登录');
  console.log('  2. 如果看到"此应用未经验证"，点击"继续"或"前往 XXX"');
  console.log('  3. 点击"允许"授予权限');
  console.log('  4. 浏览器将跳转到 localhost:3000');
  console.log('');

  let code;
  try {
    code = await waitForCode();
  } catch (err) {
    console.error('\n❌ 错误：', err.message);
    process.exit(1);
  }

  console.log('');
  console.log('▶ 步骤 3：获取 Tokens...');
  console.log('');

  try {
    const tokens = await exchangeCode(code);
    const ticket = await verifyToken(tokens);

    const payload = ticket.getPayload();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ 授权成功！');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  邮箱：', payload.email);
    console.log('');
    console.log('  ▶ 以下是配置 Cloudflare Worker Secret 所需的值：');
    console.log('');
    console.log('  GOOGLE_CLIENT_ID=');
    console.log('  ' + CLIENT_ID);
    console.log('');
    console.log('  GOOGLE_CLIENT_SECRET=');
    console.log('  ' + CLIENT_SECRET);
    console.log('');
    console.log('  GSC_REFRESH_TOKEN=');
    console.log('  ' + tokens.refresh_token);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');

    if (!tokens.refresh_token) {
      console.log('');
      console.log('⚠️  未返回 refresh_token，请重新授权时添加 prompt=consent');
    }
  } catch (err) {
    console.error('\n❌ 获取 Token 失败：', err.message);
    if (err.message.includes('invalid_grant')) {
      console.error('  可能原因：code 已过期或已被使用，请重新运行脚本');
    }
    process.exit(1);
  }
}

main();
