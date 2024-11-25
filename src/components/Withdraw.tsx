import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { Form, Image, Spinner, Modal, Button } from 'react-bootstrap'
import { Dai, Usdt, Usdc, Ethereum, Btc } from 'react-web3-icons'
import { MdOutlineSecurity } from 'react-icons/md'
import Web3 from 'web3'
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useConfig,
  useBalance,
  Connector,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useReadContract,
  useWriteContract,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { IoMdWallet } from 'react-icons/io'
import { HiSwitchHorizontal } from 'react-icons/hi'
import NextImage from 'next/image'
import TabMenu from './TabMenu'
import SuccessIcon from './SuccessIcon'
import { formatUnits, Address } from 'viem'
import Head from 'next/head'
import { useChainConfig } from '../hooks/useChainConfig'
import { MainnetContext } from '@/pages/_app'
import ERC20ABI from './abi/ERC20.json'
import USDCBridgeABI from './abi/USDCBridge.json'
import ThirdParty from './ThirdParty'
const optimismSDK = require('@eth-optimism/sdk')
const ethers = require('ethers')

const getTokenAddress = (token: string, l2ChainInfo: any) => {
  if (token == 'USDC.e' && l2ChainInfo) {
    return l2ChainInfo.contracts.l2Usdc
  } else if (token == 'tSWAN') {
    return l2ChainInfo.contracts.l2SwanToken
  }
  return undefined
}

const receivingTokens: {
  swanETH: string
  'USDC.e': string
  tSWAN: string
} = {
  swanETH: 'ETH',
  'USDC.e': 'USDC',
  tSWAN: 'tSWAN',
}

const Withdraw: React.FC = () => {
  const [ethValue, setEthValue] = useState<string>('')
  const [sendToken, setSendToken] = useState<string>('ETH')
  const [errorInput, setErrorInput] = useState<string>('')
  const [checkMetaMask, setCheckMetaMask] = useState<boolean>(false)
  // const [loader, setLoader] = useState<boolean>(false)
  const [iconLoader, setIconLoader] = useState<boolean>(false)
  const [iconStatus, setIconStatus] = useState<boolean>(false)
  const [loaded, setLoaded] = useState(false)
  const { address, isConnected } = useAccount()
  const { chain } = useAccount()
  const { chainInfoFromConfig, chainInfoAsObject } = useChainConfig()
  const [l1ChainInfo, setL1ChainInfo] = useState<any>({})
  const [l2ChainInfo, setL2ChainInfo] = useState<any>({})
  const [SwanBalance, setSwanBalance] = useState<number>(0)
  const [metaMastError, setMetaMaskError] = useState<string>('')
  const { connect } = useConnect()
  const { chains, switchChain } = useSwitchChain()
  const [showModal, setShowModal] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const chainId = useChainId()
  // const [balance, setBalance] = useState<string>('')
  const [fromChain, setFromChain] = useState(chainInfoFromConfig[1].id)
  const { isMainnet } = useContext(MainnetContext)

  const {
    status,
    data: writeData,
    writeContract,
    isPending: isWriteContractPending,
    failureReason,
  } = useWriteContract()
  const { data: hash, sendTransaction, isPending } = useSendTransaction()
  const {
    isLoading: isWriteContractConfirming,
    isSuccess: isWriteContractConfirmed,
  } = useWaitForTransactionReceipt({
    hash: writeData,
  })
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // const { data } = useBalance({
  //   address: address,
  //   chainId: chainId,
  // })

  let balance = useBalance({
    address: address,
    chainId: chainId,
    token:
      sendToken && l2ChainInfo?.contracts
        ? getTokenAddress(sendToken, l2ChainInfo)
        : undefined,
  }).data

  const { data: tokenAllowance } = useReadContract({
    abi: ERC20ABI,
    address:
      sendToken && l2ChainInfo?.contracts
        ? getTokenAddress(sendToken, l2ChainInfo)
        : undefined,
    functionName: 'allowance',
    args:
      sendToken == 'USDC.e' && l2ChainInfo?.contracts?.l2UsdcBridge
        ? [address, l2ChainInfo?.contracts?.l2UsdcBridge]
        : [address, l2ChainInfo?.contracts?.l2StandardBridge],
  })

  const balanceShow = chain?.id

  useEffect(() => {
    if (chainInfoAsObject) {
      setL1ChainInfo(chainInfoAsObject[chainInfoFromConfig[0].id])
      setL2ChainInfo(chainInfoAsObject[chainInfoFromConfig[1].id])
      setFromChain(chainInfoFromConfig[1].id)
    }
  }, [isMainnet])

  useEffect(() => {
    if (chainInfoAsObject) {
      setL1ChainInfo(chainInfoAsObject[chainInfoFromConfig[0].id])
      setL2ChainInfo(chainInfoAsObject[fromChain])
    }
  }, [chainInfoAsObject])

  useEffect(() => {
    if (chainInfoAsObject) {
      setL1ChainInfo(chainInfoAsObject[chainInfoAsObject[fromChain]?.l1ChainId])
      setL2ChainInfo(chainInfoAsObject[fromChain])
    }
    setSendToken('swanETH')
  }, [fromChain])

  useEffect(() => {
    if (isApproving && isWriteContractConfirmed) {
      if (sendToken == 'USDC.e') {
        let usdcInWei = ethers.utils.parseUnits(ethValue, 'mwei')
        writeContract({
          abi: USDCBridgeABI,
          address: l2ChainInfo.contracts.l2UsdcBridge,
          functionName: 'bridgeERC20',
          args: [
            l2ChainInfo.contracts.l2Usdc,
            l2ChainInfo.contracts.l1Usdc,
            usdcInWei,
            200000,
            '',
          ],
          account: address,
        })
        setIsApproving(false)
      } else if (sendToken == 'tSWAN') {
        let swanInWei = ethers.utils.parseEther(ethValue)
        writeContract({
          abi: USDCBridgeABI,
          address: l2ChainInfo.contracts.l1StandardBridge,
          functionName: 'bridgeERC20',
          args: [
            l2ChainInfo.contracts.l2SwanToken,
            l2ChainInfo.contracts.l1SwanToken,
            swanInWei,
            200000,
            '',
          ],
          account: address,
        })
        setIsApproving(false)
      }
    }
  }, [isWriteContractConfirmed])

  const handleWithdraw = async () => {
    try {
      if (!ethValue) {
        // setErrorInput('Please enter the amount')
      } else {
        if (parseFloat(ethValue) <= 0) {
          setErrorInput('Invalid Amount Entered!')
        } else {
          setErrorInput('')
          let L2StandardBridge = l2ChainInfo.contracts.l2Bridge
          //-------------------------------------------------------- SEND TOKEN VALUE -----------------------------------------------------------------

          try {
            if (sendToken == 'swanETH') {
              sendTransaction({
                to: L2StandardBridge as Address,
                value: ethers.utils.parseEther(ethValue),
              })
            } else if (sendToken === 'USDC.e') {
              const usdcInWei = ethers.utils.parseUnits(ethValue, 'mwei')
              if (Number(tokenAllowance) < Number(usdcInWei)) {
                writeContract({
                  abi: ERC20ABI,
                  address: l2ChainInfo.contracts.l2Usdc,
                  functionName: 'approve',
                  args: [l2ChainInfo.contracts.l2UsdcBridge, usdcInWei],
                  account: address,
                })

                setIsApproving(true)
              } else {
                writeContract({
                  abi: USDCBridgeABI,
                  address: l2ChainInfo.contracts.l2UsdcBridge,
                  functionName: 'bridgeERC20',
                  args: [
                    l2ChainInfo.contracts.l2Usdc,
                    l2ChainInfo.contracts.l1Usdc,
                    usdcInWei,
                    200000,
                    '',
                  ],
                  account: address,
                })
              }
            } else if (sendToken == 'tSWAN') {
              const swanInWei = ethers.utils.parseEther(ethValue)
              if (Number(tokenAllowance) < Number(swanInWei)) {
                writeContract({
                  abi: ERC20ABI,
                  address: l2ChainInfo.contracts.l2SwanToken,
                  functionName: 'approve',
                  args: [l2ChainInfo.contracts.l2StandardBridge, swanInWei],
                  account: address,
                })

                setIsApproving(true)
              } else {
                writeContract({
                  abi: USDCBridgeABI,
                  address: l2ChainInfo.contracts.l2StandardBridge,
                  functionName: 'bridgeERC20',
                  args: [
                    l2ChainInfo.contracts.l2SwanToken,
                    l2ChainInfo.contracts.l1SwanToken,
                    swanInWei,
                    200000,
                    '',
                  ],
                  account: address,
                })
              }
            }
            //-------------------------------------------------------- SEND TOKEN VALUE END-----------------------------------------------------------------
            // updateWallet()
          } catch (error) {
            // setLoader(false)
            setIconStatus(false)
            setIconLoader(true)
            setTimeout(() => {
              setIconLoader(false)
            }, 3000)
            console.log({ error }, 98)
          } finally {
            // setLoader(false)
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  ////========================================================== HANDLE CHANGE =======================================================================
  const [checkDisabled, setCheckDisabled] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (sendToken) {
      if (
        balance &&
        Number(formatUnits(balance.value, balance.decimals)) <
          Number(e.target.value)
      ) {
        setCheckDisabled(true)
        setErrorInput(`Insufficient ${sendToken} balance.`)
      } else {
        setCheckDisabled(false)
        setErrorInput('')
      }
      setEthValue(e.target.value)
    }
  }

  const changeChain = (event: any) => {
    const targetChainId = event.target.value
    switchChain({ chainId: Number(targetChainId) })
    setFromChain(targetChainId)
  }

  // ============= For Format balance =========================
  const formatBalance = (rawBalance: string) => {
    const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(6)
    return balance
  }
  // ============= Get and update balance =========================
  // const updateWallet = async () => {
  //   if (typeof window.ethereum !== 'undefined') {
  //     try {
  //       const balance = formatBalance(
  //         await window.ethereum.request({
  //           method: 'eth_getBalance',
  //           params: [address, 'latest'],
  //         }),
  //       )
  //       setSwanBalance(Number(balance))
  //     } catch {}
  //   } else {
  //     console.error('Ethereum provider is not available')
  //   }
  // }
  // const fetchBalance = async () => {
  //   if (address) {
  //     const web3 = new Web3(window.ethereum)
  //     const balance = await web3.eth.getBalance(address)
  //     const balanceInEther = web3.utils.fromWei(balance, 'ether')
  //     const formattedBalance = parseFloat(balanceInEther).toFixed(6)
  //     setBalance(formattedBalance)
  //   }
  // }
  // useEffect(() => {
  //   const ethereum = window.ethereum

  //   if (ethereum && ethereum.on && ethereum.removeListener) {
  //     const handleChainChanged = async () => {
  //       await fetchBalance()
  //     }

  //     ethereum.on('chainChanged', handleChainChanged)

  //     return () => {
  //       ethereum.removeListener('chainChanged', handleChainChanged)
  //     }
  //   }
  // }, [fetchBalance])

  // useEffect(() => {
  //   updateWallet()
  // }, [balance])

  useEffect(() => {
    console.log('reason', failureReason)
  }, [failureReason])
  useEffect(() => {
    console.log('Network changed:', chainId)
  }, [chainId])

  useEffect(() => {
    setEthValue('')
    setErrorInput('')
  }, [sendToken])

  // useEffect(() => {
  //   fetchBalance()
  // }, [address])

  useEffect(() => {
    setLoaded(true)
  }, [])

  useEffect(() => {
    setEthValue('')
    if (isConfirmed) {
      console.log('isConfirmed:', isConfirmed)
      setIconStatus(true)
      setIconLoader(true)
      setTimeout(() => {
        setIconLoader(false)
      }, 3000)
    } else if (isWriteContractConfirmed && !isApproving) {
      console.log('isWriteContractConfirmed:', isWriteContractConfirmed)
      setIconStatus(true)
      setIconLoader(true)
      setTimeout(() => {
        setIconLoader(false)
      }, 3000)
    }
  }, [isConnected, isConfirmed, isWriteContractConfirmed])

  useEffect(() => {
    if (loaded) {
      console.log('load complete')
    }
  }, [loaded])

  if (chainInfoAsObject && l1ChainInfo && l2ChainInfo) {
    return (
      <>
        <Head>
          <title>Withdraw</title>
          <meta name="description" content="Withdraw SwanETH to receive ETH" />
        </Head>
        <div>
        <div className={loaded ? 'loaded bridge_wrap' : 'bridge_wrap'}>
          {iconLoader ? <SuccessIcon parentMessage={iconStatus} /> : <></>}
          <TabMenu />
          <section className="deposit_wrap">
            {/* <div className="withdraw_title_wrap">
            <div className="withdraw_title_icn">
              <MdOutlineSecurity />
            </div>
            <div className="withdraw_title_content">
              <h3>Use the official bridge</h3>
              <p>This usually takes 7 days</p>
              <p>Bridge any token to Sepolia Testnet</p>
            </div>
          </div> */}
            <div className="deposit_price_wrap flex-row jc">
              <div className="deposit_price_title flex-row">
                <NextImage
                  src="/assets/images/swantoken.png"
                  alt="To icn"
                  layout="responsive"
                  width={30}
                  height={30}
                  className="img_icon"
                />
                <div className="deposit_price_content">
                  <p>From</p>
                  {chainInfoFromConfig[1].name}
                </div>
              </div>

              <div className="up flex-row center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 256 256"
                >
                  <path
                    fill="#a1a1aa"
                    d="M224.49 136.49l-72 72a12 12 0 01-17-17L187 140H40a12 12 0 010-24h147l-51.49-51.52a12 12 0 0117-17l72 72a12 12 0 01-.02 17.01z"
                  ></path>
                </svg>
              </div>

              <div className="deposit_details flex-row end">
                <div className="deposit_price_content text-right">
                  <p>To</p>
                  <h5 className="flex-row">{l1ChainInfo.name}</h5>
                </div>
                {l1ChainInfo.name === 'Ethereum' ||
                l1ChainInfo.name === 'Sepolia' ? (
                  <NextImage
                    src="/assets/images/network-ethereum.svg"
                    alt="To icn"
                    layout="responsive"
                    width={30}
                    height={30}
                    className="img_icon"
                  />
                ) : (
                  <NextImage
                    src="/assets/images/swantoken.png"
                    alt="To icn"
                    layout="responsive"
                    width={30}
                    height={30}
                    className="img_icon"
                  />
                )}
              </div>
            </div>

            <div className="deposit_price_wrap balance">
              <div className="form-title">Withdraw</div>
              <div className="deposit_input_wrap">
                <Form>
                  <div className="deposit_inner_input">
                    <Form.Control
                      disabled={
                        !isConnected ||
                        Number(chain?.id) !== Number(l2ChainInfo.chainId)
                      }
                      type="number"
                      name="eth_value"
                      value={ethValue}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="any"
                    />
                    <Form.Select
                      aria-label="Default select example"
                      className="select_wrap"
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                        setSendToken(event.target.value)
                      }
                    >
                      {/* <option>{l2ChainInfo?.nativeCurrency?.symbol}</option> */}
                      <option value="swanETH">swanETH</option>
                      {l1ChainInfo.chainId == 11155111 ? (
                        <>
                          <option value="USDC.e">USDC.e</option>
                          <option value="tSWAN">tSWAN</option>
                        </>
                      ) : (
                        <></>
                      )}
                    </Form.Select>
                  </div>
                  {/* <div className="input_icn_wrap">
                    {sendToken == 'ETH' ? (
                      <span className="input_icn flex-row">
                        <Ethereum style={{ fontSize: '1.5rem' }} />
                      </span>
                    ) : (
                        <span></span>
                      )}
                  </div> */}
                </Form>
              </div>
              {errorInput && (
                <small className="text-danger">{errorInput}</small>
              )}
              {Number(chain?.id) == Number(l2ChainInfo.chainId) &&
              balanceShow !== undefined ? (
                address && (
                  <p className="wallet_bal text-right mt-2">
                    {balance?.formatted} {balance?.symbol} available
                  </p>
                )
              ) : (
                <></>
              )}
            </div>

            <div className="deposit_price_wrap">
              <div className="withdraw_bal_sum flex-row jc">
                <span className="input_icn flex-row">
                  {/* <Ethereum style={{ fontSize: '1.2rem' }} />  */}
                  <svg
                    className="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="8138"
                    width="16"
                    height="16"
                  >
                    <path
                      d="M512 558.34857177l0-92.69714354L179.81978607 465.65142823A38.60836029 38.60836029 0 0 0 141.21142578 504.25978851l0 15.48042298A38.60836029 38.60836029 0 0 0 179.81978607 558.34857177L512 558.34857177z"
                      fill="#ffffff"
                      p-id="8139"
                    ></path>
                    <path
                      d="M570.86268615 707.40557862l259.32025911-159.90257264a38.60836029 38.60836029 0 0 0 0.41713714-65.49053192l-259.3202591-164.21298981A38.60836029 38.60836029 0 0 0 512 350.42887878L512 674.54444122a38.60836029 38.60836029 0 0 0 58.86268615 32.90748597z"
                      fill="#ffffff"
                      p-id="8140"
                    ></path>
                  </svg>
                  To address
                </span>
                {l2ChainInfo &&
                l2ChainInfo.contracts &&
                l2ChainInfo.contracts.l1StandardBridge ? (
                  <p className="green flex-row">
                    {l2ChainInfo.contracts.l1StandardBridge?.slice(0, 4)}...
                    {l2ChainInfo.contracts.l1StandardBridge?.slice(-4)}
                    <svg
                      className="icon"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="9263"
                      width="14"
                      height="14"
                    >
                      <path
                        d="M512.465455 0.116364C230.609455 0.116364 1.210182 229.492364 1.210182 511.371636S230.586182 1022.650182 512.465455 1022.650182s511.278545-229.376 511.278545-511.278546C1023.720727 229.492364 794.344727 0.116364 512.465455 0.116364z m286.091636 413.230545L466.013091 754.222545a42.519273 42.519273 0 0 1-30.254546 12.753455h-0.232727a42.589091 42.589091 0 0 1-30.114909-12.427636l-178.711273-178.827637a42.565818 42.565818 0 0 1 0-60.253091 42.565818 42.565818 0 0 1 60.253091 0l148.363637 148.247273 302.312727-310.062545a42.682182 42.682182 0 0 1 60.253091-0.698182 42.821818 42.821818 0 0 1 0.674909 60.392727z m0 0"
                        p-id="9264"
                        fill="#43b85c"
                      ></path>
                    </svg>
                  </p>
                ) : (
                  <p></p>
                )}
              </div>
              <div className="spacing"></div>
              <div className="withdraw_bal_sum flex-row jc">
                <span className="input_icn flex-row">
                  {/* <Ethereum style={{ fontSize: '1.2rem' }} />  */}
                  <svg
                    className="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="2648"
                    width="16"
                    height="16"
                  >
                    <path
                      d="M597.333333 608.085333v89.173334A256 256 0 0 0 256 938.666667H170.666667a341.333333 341.333333 0 0 1 426.666666-330.624zM512 554.666667c-141.44 0-256-114.56-256-256s114.56-256 256-256 256 114.56 256 256-114.56 256-256 256z m0-85.333334c94.293333 0 170.666667-76.373333 170.666667-170.666666s-76.373333-170.666667-170.666667-170.666667-170.666667 76.373333-170.666667 170.666667 76.373333 170.666667 170.666667 170.666666z m316.501333 256h153.002667v85.333334h-153.002667l78.037334 77.994666-60.330667 60.373334L665.173333 768l181.034667-181.034667 60.330667 60.373334L828.501333 725.333333z"
                      p-id="2649"
                      fill="#4177f3"
                    ></path>
                  </svg>
                  Receive on {l1ChainInfo.name}
                </span>
                <p>
                  {ethValue && address ? ethValue : '-'}{' '}
                  {receivingTokens[sendToken as 'swanETH' | 'USDC.e' | 'tSWAN']}
                </p>
                {/* <span className='input_title'>ETH</span> */}
              </div>
            </div>
            <div
              className="deposit_btn_wrap"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <p
                style={{
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  marginTop: '0px',
                  marginBottom: '12px',
                  lineHeight: '1.2',
                }}
              >
                {`Please ensure you are connected to MetaMask & the ${l2ChainInfo.name} Network`}
              </p>
              {checkMetaMask === true ? (
                <a
                  className="btn deposit_btn flex-row"
                  href="https://metamask.io/"
                  target="_blank"
                >
                  <NextImage
                    src="/assets/images/metamask.svg"
                    alt="metamask icn"
                    layout="responsive"
                    width={500}
                    height={300}
                  />
                  Please Install Metamask Wallet
                </a>
              ) : !isConnected ? (
                <w3m-connect-button />
              ) : // : isMainnet ? (
              //   <button
              //     className="btn deposit_btn flex-row disabled"
              //     disabled={true}
              //   >
              //     Initate Withdrawal
              //   </button>
              // )
              Number(chain?.id) !== Number(fromChain) ? (
                <button
                  className="btn deposit_btn flex-row"
                  onClick={() =>
                    switchChain({
                      chainId: Number(fromChain),
                    })
                  }
                >
                  <HiSwitchHorizontal />
                  Switch to {l2ChainInfo?.name}
                </button>
              ) : checkDisabled ? (
                <button
                  className="btn deposit_btn deposit_btn_disabled flex-row"
                  disabled={true}
                >
                  Initiate Withdrawal
                </button>
              ) : (
                <button
                  className={
                    !isPending &&
                    !isConfirming &&
                    !isWriteContractPending &&
                    !isWriteContractConfirming &&
                    ethValue &&
                    Number(ethValue) > 0
                      ? 'btn deposit_btn flex-row'
                      : 'btn deposit_btn deposit_btn_disabled flex-row'
                  }
                  onClick={handleWithdraw}
                  disabled={
                    isPending ||
                    isConfirming ||
                    isWriteContractPending ||
                    isWriteContractConfirming
                      ? true
                      : false
                  }
                >
                  {isConfirming ||
                  isPending ||
                  isWriteContractPending ||
                  isWriteContractConfirming ? (
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  ) : (
                    <span>
                      {' '}
                      {ethValue && Number(ethValue) > 0
                        ? 'Initiate Withdrawal'
                        : 'Enter an amount'}{' '}
                    </span>
                  )}
                </button>
              )}
              {/* {isMainnet ? (
                <p
                  style={{
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    marginTop: '20px',
                    marginBottom: '0px',
                  }}
                >
                  Withdrawals from Swan Mainnet are currently unavailable
                </p>
              ) : ( */}
              {/* )} */}
            </div>
          </section>
        </div>
        <ThirdParty />
        </div>
      </>
    )
  } else return <div>Loading...</div>
}
export default Withdraw
