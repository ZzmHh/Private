# 插件安装包目录

生产 ZIP 由构建脚本生成，勿手工改此目录内 zip。

```bash
# 1. 复制 extension/build.env.example → extension/build.env 并填写域名
# 2. 执行
npm run build:extension
```

生成文件：`fanmeng-tiktok-extension.zip`（网站可通过 `/downloads/fanmeng-tiktok-extension.zip` 下载）

GitHub Release 会在打 tag `extension-v*` 时自动打包并上传同名文件。
