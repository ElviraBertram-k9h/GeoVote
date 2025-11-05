# GeoVoteFHE Contracts

Landmark voting contract leveraging FHEVM:

- Clear `votes` for public transparency and ranking
- Encrypted `votesEnc` for FHE demo and secure operations
- One vote per address per landmark

## Prerequisites

- Node.js 18+
- Hardhat
- FHEVM Hardhat node (local) with `@fhevm/hardhat-plugin@^0.1.0`

## Install

```bash
pnpm i || npm i || yarn
```

## Build

```bash
npm run build
```

## Run local node

```bash
npm run node
```

## Deploy

Localhost:

```bash
npm run deploy:localhost
```

Sepolia (RelayerSDK mode):

```bash
export SEPOLIA_RPC_URL=...
export PRIVATE_KEY=...
npm run deploy:sepolia
```


