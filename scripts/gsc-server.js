#!/usr/bin/env node

/**
 * GSC OAuth2 回调服务器
 *
 * 启动一个本地 HTTP 服务器，监听 http://localhost:3000/callback
 * 用于接收 Google OAuth2 回调中的 authorization code
 */

import http from 'http';
import { URL } from 'url';

const PORT = 3000;

let codePromiseResolve = null;

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
        <html><head><meta charset="utf-8"></head><body style="font-family:system-ui;max-width:500px;margin:60px auto;text-align:center">
        <h1>✅ 授权成功！</h1>
        <p>Authorization code 已获取</p>
        <p style="color:#666">请返回终端查看 refresh_token</p>
        <p style="color:#999;font-size:13px">此页面可以关闭</p>
        </body></html>
      `);

      if (codePromiseResolve) {
        codePromiseResolve(code);
        codePromiseResolve = null;
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>❌ 缺少 code 参数</h1>');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1>');
  }
});

export function waitForCode() {
  return new Promise((resolve) => {
    codePromiseResolve = resolve;
  });
}

export function startServer() {
  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`  回调服务器已启动：http://localhost:${PORT}`);
      resolve();
    });
  });
}

export function stopServer() {
  server.close();
}
