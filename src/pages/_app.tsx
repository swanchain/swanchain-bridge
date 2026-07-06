// Temp disable server side rendering for min viable product
import dynamic from 'next/dynamic'
import Head from 'next/head'

import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  mainnet,
  sepolia,
  arbitrum,
  optimismSepolia,
  optimism,
} from '@reown/appkit/networks'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { createAppKit } from '@reown/appkit/react' 

import { injected } from 'wagmi/connectors'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import { useEffect, useState, createContext } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NextImage from 'next/image'
import '../assets/style/account/account.scss'
import '../assets/style/account/withdrawAccount.scss'
import '../assets/style/deposit.scss'
import '../assets/style/tab-menu.scss'
import '../assets/style/withdraw.scss'
import '../assets/style/withdraw-history.scss'
import '../assets/style/third-party.scss'
import '../assets/style/featured-projects.scss'
import '../assets/style/main.scss'
import '../assets/style/common/header.scss'
import '../assets/style/common/footer.scss'
import '../assets/style/common/_color_variable.scss'

const queryClient = new QueryClient()

export const SWAN_SATURN = {
  id: Number(process.env.NEXT_PUBLIC_L2_SATURN_CHAIN_ID),
  name: 'Saturn',
  network: 'SWAN',
  iconUrl: 'https://i.imgur.com/Q3oIdip.png',
  iconBackground: '#000000',
  nativeCurrency: {
    decimals: 18,
    name: 'Swan ETH',
    symbol: 'swanETH',
  },
  rpcUrls: {
    default: {
      http: [String(process.env.NEXT_PUBLIC_L2_SATURN_RPC_URL)],
    },
  },
  blockExplorers: {
    default: {
      name: 'Swan Testnet Explorer',
      url: process.env.NEXT_PUBLIC_L2_SATURN_EXPLORER_URL || '',
    },
  },
  testnet: true,
  l1ChainId: '11155111',
  opContracts: {
    l2Bridge: process.env.NEXT_PUBLIC_L2_BRIDGE,
    optimismPortal: process.env.NEXT_PUBLIC_SATURN_OPTIMISM_PORTAL_PROXY,
    addressManager: process.env.NEXT_PUBLIC_SATURN_LIB_ADDRESSMANAGER,
    l1CrossDomainMessenger:
      process.env.NEXT_PUBLIC_SATURN_PROXY_OVM_L1CROSSDOMAINMESSENGER,
    l1StandardBridge: process.env.NEXT_PUBLIC_SATURN_PROXY_OVM_L1STANDARDBRIDGE,
    l2OutputOracle: process.env.NEXT_PUBLIC_L2_SATURN_OUTPUTORACLE_PROXY,
  },
}

export const SWAN_PROXIMA = {
  id: Number(process.env.NEXT_PUBLIC_L2_PROXIMA_CHAIN_ID),
  name: 'Proxima',
  network: 'SWAN',
  iconUrl: 'https://i.imgur.com/Q3oIdip.png',
  iconBackground: '#000000',
  nativeCurrency: {
    decimals: 18,
    name: 'Swan ETH',
    symbol: 'swanETH',
  },
  rpcUrls: {
    default: {
      http: [String(process.env.NEXT_PUBLIC_L2_PROXIMA_RPC_URL)],
    },
  },
  blockExplorers: {
    default: {
      name: 'Swan Testnet Explorer',
      url: process.env.NEXT_PUBLIC_L2_PROXIMA_EXPLORER_URL || '',
    },
  },
  testnet: true,
  l1ChainId: '11155111',
  opContracts: {
    l2Bridge: process.env.NEXT_PUBLIC_L2_BRIDGE,
    optimismPortal: process.env.NEXT_PUBLIC_PROXIMA_OPTIMISM_PORTAL_PROXY,
    addressManager: process.env.NEXT_PUBLIC_PROXIMA_LIB_ADDRESSMANAGER,
    l1CrossDomainMessenger:
      process.env.NEXT_PUBLIC_PROXIMA_PROXY_OVM_L1CROSSDOMAINMESSENGER,
    l1StandardBridge:
      process.env.NEXT_PUBLIC_PROXIMA_PROXY_OVM_L1STANDARDBRIDGE,
    l2OutputOracle: process.env.NEXT_PUBLIC_L2_PROXIMA_OUTPUTORACLE_PROXY,
    l1UsdcBridge: process.env.NEXT_PUBLIC_SEPOLIA_USDC_BRIDGE,
    l2UsdcBridge: process.env.NEXT_PUBLIC_PROXIMA_USDC_BRIDGE,
    l1Usdc: process.env.NEXT_PUBLIC_SEPOLIA_USDC,
    l2Usdc: process.env.NEXT_PUBLIC_PROXIMA_USDC,
    // l1SwanToken: process.env.NEXT_PUBLIC_SEPOLIA_SWAN_TOKEN,
    // l2SwanToken: process.env.NEXT_PUBLIC_PROXIMA_SWAN_TOKEN,
  },
}

export const SWAN_MAINNET = {
  id: Number(process.env.NEXT_PUBLIC_L2_SWAN_CHAIN_ID),
  name: 'Swan',
  network: 'SWAN',
  iconUrl: 'https://i.imgur.com/Q3oIdip.png',
  iconBackground: '#000000',
  nativeCurrency: {
    decimals: 18,
    name: 'Swan ETH',
    symbol: 'swanETH',
  },
  rpcUrls: {
    default: {
      http: [String(process.env.NEXT_PUBLIC_L2_SWAN_RPC_URL)],
    },
  },
  blockExplorers: {
    default: {
      name: 'Swan Mainnet Explorer',
      url: process.env.NEXT_PUBLIC_L2_SWAN_EXPLORER_URL || '',
    },
  },
  testnet: false,
  l1ChainId: '1',
  opContracts: {
    l2Bridge: process.env.NEXT_PUBLIC_L2_BRIDGE,
    optimismPortal: process.env.NEXT_PUBLIC_SWAN_OPTIMISM_PORTAL_PROXY,
    addressManager: process.env.NEXT_PUBLIC_SWAN_LIB_ADDRESSMANAGER,
    l1CrossDomainMessenger:
      process.env.NEXT_PUBLIC_SWAN_PROXY_OVM_L1CROSSDOMAINMESSENGER,
    l1StandardBridge: process.env.NEXT_PUBLIC_SWAN_PROXY_OVM_L1STANDARDBRIDGE,
    l2OutputOracle: process.env.NEXT_PUBLIC_L2_SWAN_OUTPUTORACLE_PROXY,
    l1SwanToken: process.env.NEXT_PUBLIC_ETHEREUM_SWAN_TOKEN,
    l2SwanToken: process.env.NEXT_PUBLIC_SWAN_SWAN_TOKEN,
  },
}

const noopStorage = {
  getItem: (_key: any) => '',
  setItem: (_key: any, _value: any) => {},
  removeItem: (_key: any) => {},
}

// Set up metadata
const metadata = {
  name: 'swanchain-bridge',
  description: 'AppKit Example',
  url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png'],
}

export const networks = [
  sepolia,
  {
    ...mainnet,
    testnet: false,
    rpcUrls: {
      default: {
        http: ['https://ethereum-rpc.publicnode.com'],
      },
    },
  },
  SWAN_PROXIMA,
  // SWAN_SATURN,
  SWAN_MAINNET,
]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: String(process.env.NEXT_PUBLIC_PRODUCT_ID),
  networks,
})

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: String(process.env.NEXT_PUBLIC_PRODUCT_ID),
  networks: [sepolia, mainnet, SWAN_PROXIMA, SWAN_MAINNET],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export const connector = injected({ target: 'metaMask' })
export const MainnetContext = createContext<any>(null)

function MyApp({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isMainnet, setIsMainnet] = useState<any>(true)
  const router = useRouter()
  const [boolValue, setBoolValue] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <MainnetContext.Provider value={{ isMainnet, setIsMainnet }}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Head>
            <title>SwanETH Bridge</title>
            <meta
              name="description"
              content="Welcome to the Swan Bridge. We will NEVER ask for your private keys or seed phrase."
            />
            <link rel="icon" href="/assets/images/swantoken.png" />
          </Head>
          <div className="main_container">
            <div
              className={
                router.pathname === '/withdraw' && boolValue
                  ? 'show tip'
                  : 'tip'
              }
            >
              <p>
                After you initiate the withdrawal, please go to the Withdraw
                History page to complete the withdrawal process.
              </p>
              <p>
                You may need to wait for our blockchain scanner to pickup your
                request.
              </p>
              <div
                className="tip_close flex-row center"
                onClick={() => setBoolValue(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
            </div>
            <Header />
            <div className="main_wrap">
              {isMounted && <Component {...pageProps} />}
            </div>
            <div className="main_bg"></div>
            <Footer />
          </div>
        </QueryClientProvider>
      </WagmiProvider>
    </MainnetContext.Provider>
  )
}

export default MyApp
