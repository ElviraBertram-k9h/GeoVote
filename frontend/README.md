# GeoVoteFHE Frontend

Next.js + Tailwind 前端，按 zama_template 模式接入 FHEVM：

- 本地（Hardhat 31337）：使用 **@fhevm/mock-utils** 的 Mock 实例与合约交互（加密/解密）
- 测试网（Sepolia）：从 CDN 加载 **Relayer SDK** 与合约交互（加密/解密）

## 开发步骤

1. 安装依赖

```bash
pnpm i || npm i || yarn
```

2. 合约侧（在 `action/contracts`）编译与部署

```bash
# 终端 A
cd ../contracts
npm run node

# 终端 B
cd ../contracts
npm run build
npm run deploy:localhost
```

3. 生成 ABI 和地址文件到前端

```bash
# 终端 C (在 frontend 目录)
npm run gen:abi
```

4. 启动前端

```bash
npm run dev
```

打开浏览器 `http://localhost:3000`。

## 切换到 Sepolia（Relayer SDK 模式）

1. 在 `action/contracts` 设置环境变量并部署：

```bash
export SEPOLIA_RPC_URL=...
export PRIVATE_KEY=...
npm run deploy:sepolia
```

2. 回到前端执行：

```bash
npm run gen:abi
npm run dev
```

前端会根据链 ID 自动选择 Mock 或 Relayer SDK。


