# Smart Wallet

A smart wallet powered by Biconomy

### To run this project, follow the steps below:

Create a `.env` file in the root directory and add the following variables

```bash
REACT_APP_PAYMASTER_MUMBAI=
REACT_APP_BUNDLER_MUMBAI=https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_BSC_TESTNET=
REACT_APP_BUNDLER_BSC_TESTNET=https://bundler.biconomy.io/api/v2/97/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_POLYGON=
REACT_APP_BUNDLER_POLYGON=https://bundler.biconomy.io/api/v2/137/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_BSC_MAINNET=-
REACT_APP_BUNDLER_BSC_MAINNET=https://bundler.biconomy.io/api/v2/56/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_ETHEREUM=
REACT_APP_BUNDLER_ETHEREUM=https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_GOERLI=
REACT_APP_BUNDLER_GOERLI=https://bundler.biconomy.io/api/v2/5/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_ARBITRUM_MAINNET=
REACT_APP_BUNDLER_ARBITRUM_MAINNET=https://bundler.biconomy.io/api/v2/42161/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
REACT_APP_PAYMASTER_ARBITRUM_TESTNET=
REACT_APP_BUNDLER_ARBITRUM_TESTNET=https://bundler.biconomy.io/api/v2/421613/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44
```

The paymaster Urls can be generated from the [Biconomy Dashboard](https://dashboard.biconomy.io).


Clone the repository
```bash
git clone https://github.com/ARJUN-R34/biconomy-smart-wallet.git
```

Install dependencies and run the app
```bash
npm i && npm run start
```

The UI will be live on http://localhost:3000