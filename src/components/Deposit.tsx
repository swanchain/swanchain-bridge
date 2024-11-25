import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { Form, Image, Spinner, Modal, Button } from 'react-bootstrap'
import { Dai, Usdt, Usdc, Ethereum, Btc } from 'react-web3-icons'
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useConfig,
  useBalance,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useChains,
  useReadContract,
  useWriteContract,
} from 'wagmi'
import TabMenu from './TabMenu'
import SuccessIcon from './SuccessIcon'
import { HiSwitchHorizontal } from 'react-icons/hi'
import NextImage from 'next/image'
import { formatUnits, Address } from 'viem'
import { useChainConfig } from '../hooks/useChainConfig'
import { useEthPrice } from '../hooks/useEthPrice'
import { MainnetContext } from '@/pages/_app'
import ERC20ABI from './abi/ERC20.json'
import USDCBridgeABI from './abi/USDCBridge.json'
import ThirdParty from './ThirdParty'
const optimismSDK = require('@eth-optimism/sdk')
const ethers = require('ethers')

const receivingTokens: {
  ETH: string
  USDC: string
  tSWAN: string
} = {
  ETH: 'swanETH',
  USDC: 'USDC.e',
  tSWAN: 'tSWAN',
}
//l2ChainInfo.contracts?.l1Usdc as `0x${string}`

const getTokenAddress = (token: string, l2ChainInfo: any) => {
  if (token == 'USDC' && l2ChainInfo) {
    return l2ChainInfo.contracts.l1Usdc
  } else if (token == 'tSWAN') {
    return l2ChainInfo.contracts.l1SwanToken
  }
  return undefined
}

const Deposit: React.FC = () => {
  const [ethValue, setEthValue] = useState<string>('')
  const [sendToken, setSendToken] = useState<string>('ETH')
  const { address, isConnected } = useAccount()
  const account = useAccount()
  const [errorInput, setErrorInput] = useState<string>('')
  const [iconLoader, setIconLoader] = useState<boolean>(false)
  const [iconStatus, setIconStatus] = useState<boolean>(false)
  // const [loader, setLoader] = useState<boolean>(false)
  const [loaded, setLoaded] = useState(false)
  const { chain } = useAccount()
  const { chainInfoFromConfig, chainInfoAsObject } = useChainConfig()
  const [l1ChainInfo, setL1ChainInfo] = useState<any>({})
  const [l2ChainInfo, setL2ChainInfo] = useState<any>({})
  const [checkMetaMask, setCheckMetaMask] = useState<string>('')
  const { chains, switchChain } = useSwitchChain()
  const [showModal, setShowModal] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isDepositSuccessful, setIsDepositSuccessful] = useState(false)
  const chainId = useChainId()
  const [destinationChainId, setDestinationChainId] = useState(
    chainInfoFromConfig[1].id,
  )
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
  let balance = useBalance({
    address: address,
    chainId: chainId,
    token:
      sendToken && l2ChainInfo?.contracts
        ? getTokenAddress(sendToken, l2ChainInfo)
        : undefined,
  }).data
  const ethPrice = useEthPrice(ethValue)

  const { data: tokenAllowance } = useReadContract({
    abi: ERC20ABI,
    address:
      sendToken && l2ChainInfo?.contracts
        ? getTokenAddress(sendToken, l2ChainInfo)
        : undefined,
    functionName: 'allowance',
    args:
      sendToken == 'USDC' && l2ChainInfo?.contracts?.l1UsdcBridge
        ? [address, l2ChainInfo?.contracts?.l1UsdcBridge]
        : [address, l2ChainInfo?.contracts?.l1StandardBridge],
  })

  const balanceShow = chain?.id

  const { isMainnet } = useContext(MainnetContext)

  // console.log(isWriteContractConfirmed)

  const handleDeposit = async () => {
    try {
      if (!ethValue) {
        // setErrorInput('Please enter the amount')
      } else {
        if (!(parseFloat(ethValue) > 0)) {
          setErrorInput('Invalid Amount Entered!')
        } else {
          let L1StandardBridge = l2ChainInfo.contracts.l1StandardBridge
          if (sendToken === 'ETH') {
            sendTransaction({
              to: L1StandardBridge as Address,
              value: ethers.utils.parseEther(ethValue),
            })
          } else if (sendToken === 'USDC') {
            const usdcInWei = ethers.utils.parseUnits(ethValue, 'mwei')
            if (Number(tokenAllowance) < Number(usdcInWei)) {
              writeContract({
                abi: ERC20ABI,
                address: l2ChainInfo.contracts.l1Usdc,
                functionName: 'approve',
                args: [l2ChainInfo.contracts.l1UsdcBridge, usdcInWei],
                account: address,
              })

              setIsApproving(true)
            } else {
              writeContract({
                abi: USDCBridgeABI,
                address: l2ChainInfo.contracts.l1UsdcBridge,
                functionName: 'bridgeERC20',
                args: [
                  l2ChainInfo.contracts.l1Usdc,
                  l2ChainInfo.contracts.l2Usdc,
                  usdcInWei,
                  200000,
                  '',
                ],
                account: address,
              })
            }
          } else if (sendToken === 'tSWAN') {
            const swanInWei = ethers.utils.parseEther(ethValue)
            if (Number(tokenAllowance) < Number(swanInWei)) {
              writeContract({
                abi: ERC20ABI,
                address: l2ChainInfo.contracts.l1SwanToken,
                functionName: 'approve',
                args: [l2ChainInfo.contracts.l1StandardBridge, swanInWei],
                account: address,
              })

              setIsApproving(true)
            } else {
              writeContract({
                abi: USDCBridgeABI,
                address: l2ChainInfo.contracts.l1StandardBridge,
                functionName: 'bridgeERC20',
                args: [
                  l2ChainInfo.contracts.l1SwanToken,
                  l2ChainInfo.contracts.l2SwanToken,
                  swanInWei,
                  200000,
                  '',
                ],
                account: address,
              })
            }
          }
        }
      }
    } catch (error) {
      setIconStatus(false)
      setIconLoader(true)
      setTimeout(() => {
        setIconLoader(false)
      }, 3000)
      console.log({ error }, 98)
    }
  }

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

  useEffect(() => {
    console.log('reason', failureReason)
  }, [failureReason])
  useEffect(() => {
    console.log('Network changed:', chainId, chainId === 11155111)
  }, [chainId])

  useEffect(() => {
    setEthValue('')
    setErrorInput('')
  }, [sendToken])

  useEffect(() => {
    if (chainInfoAsObject) {
      setL1ChainInfo(chainInfoAsObject[chainInfoFromConfig[0].id])
      setL2ChainInfo(chainInfoAsObject[chainInfoFromConfig[1].id])
      setDestinationChainId(chainInfoFromConfig[1].id)
    }
  }, [isMainnet])

  useEffect(() => {
    if (chainInfoAsObject) {
      setL1ChainInfo(chainInfoAsObject[chainInfoFromConfig[0].id])
      setL2ChainInfo(chainInfoAsObject[destinationChainId])
    }
  }, [chainInfoAsObject])

  useEffect(() => {
    if (chainInfoAsObject) {
      setL1ChainInfo(
        chainInfoAsObject[chainInfoAsObject[destinationChainId]?.l1ChainId],
      )
      setL2ChainInfo(chainInfoAsObject[destinationChainId])
      setSendToken('ETH')
    }
  }, [destinationChainId])

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

  useEffect(() => {
    if (isApproving && isWriteContractConfirmed) {
      if (sendToken == 'USDC') {
        let usdcInWei = ethers.utils.parseUnits(ethValue, 'mwei')
        writeContract({
          abi: USDCBridgeABI,
          address: l2ChainInfo.contracts.l1UsdcBridge,
          functionName: 'bridgeERC20',
          args: [
            l2ChainInfo.contracts.l1Usdc,
            l2ChainInfo.contracts.l2Usdc,
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
            l2ChainInfo.contracts.l1SwanToken,
            l2ChainInfo.contracts.l2SwanToken,
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

  const changeChain = (event: any) => {
    const targetChainId = event.target.value
    // switchChain({ chainId: Number(targetChainId) })
    setDestinationChainId(targetChainId)
  }

  if (chainInfoAsObject && l1ChainInfo && l2ChainInfo) {
    return (
      <>
        <div>
          <div className={loaded ? 'loaded bridge_wrap' : 'bridge_wrap'}>
            {iconLoader ? <SuccessIcon parentMessage={iconStatus} /> : <></>}
            <TabMenu />
            <section className="deposit_wrap">
              <div className="deposit_price_wrap flex-row jc">
                <div className="deposit_price_title flex-row">
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
                  <div className="deposit_price_content">
                    <p>From</p>
                    <h5 className="flex-row">{l1ChainInfo?.name}</h5>
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
                    {chainInfoFromConfig[1].name}
                    {/* <option value="2024">Swan Saturn</option>
                  <option value="20241133">Swan Proxima</option> */}
                  </div>
                  <NextImage
                    src="/assets/images/swantoken.png"
                    alt="To icn"
                    layout="responsive"
                    width={30}
                    height={30}
                    className="img_icon"
                  />
                </div>
              </div>
              <div className="deposit_price_wrap balance">
                <div className="form-title">Deposit</div>
                <div className="deposit_input_wrap">
                  <Form>
                    <div className="deposit_inner_input">
                      <Form.Control
                        disabled={
                          !isConnected ||
                          Number(chain?.id) !== Number(l1ChainInfo.chainId)
                        }
                        type="number"
                        value={ethValue}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        step="any"
                      />
                      <Form.Select
                        aria-label="Default select example"
                        className="select_wrap"
                        onChange={({ target }) => setSendToken(target.value)}
                      >
                        <option value="ETH">ETH</option>
                        {l1ChainInfo.chainId == 11155111 ? (
                          <>
                            <option value="USDC">USDC</option>
                            <option value="tSWAN">tSWAN</option>
                          </>
                        ) : (
                          <></>
                        )}
                        {/* <option value="DAI">DAI</option>
                          <option value="USDT">USDT</option>
                          <option value="wBTC">wBTC</option>  */}
                      </Form.Select>
                    </div>
                  </Form>
                </div>
                {Number(ethValue) > 0 && ethPrice && sendToken == 'ETH' ? (
                  <div className="wallet_bal text-left">~ ${ethPrice}</div>
                ) : (
                  <></>
                )}
                {errorInput && (
                  <small className="text-danger">{errorInput}</small>
                )}
                {Number(chain?.id) == Number(l1ChainInfo.chainId) &&
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
                    Receive on {l2ChainInfo?.name}
                  </span>
                  <p>
                    {ethValue && address ? ethValue : '-'}{' '}
                    {receivingTokens[sendToken as 'ETH' | 'USDC' | 'tSWAN']}
                  </p>
                </div>
              </div>
              <div
                className="deposit_btn_wrap"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
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
                  Please ensure you are connected to MetaMask & the{' '}
                  {l1ChainInfo?.name} Network
                </p>
                {checkMetaMask === 'true' ? (
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
                  // <button
                  //   className="btn deposit_btn flex-row"
                  //   onClick={() => {
                  //     setIsWalletModalOpen(true)
                  //   }}
                  // >
                  //   <IoMdWallet />
                  //   Connect Wallet
                  // </button>
                  <w3m-connect-button />
                ) : Number(chain?.id) !== Number(l1ChainInfo.chainId) ? (
                  <button
                    className="btn deposit_btn flex-row"
                    onClick={() =>
                      switchChain({
                        chainId: Number(l1ChainInfo.chainId),
                      })
                    }
                  >
                    <HiSwitchHorizontal />
                    Switch to {l1ChainInfo.name}
                  </button>
                ) : checkDisabled ? (
                  <button
                    className="btn deposit_btn deposit_btn_disabled flex-row"
                    disabled={true}
                  >
                    Deposit
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
                    onClick={handleDeposit}
                    disabled={
                      isPending ||
                        isConfirming ||
                        isWriteContractConfirming ||
                        isWriteContractPending
                        ? true
                        : false
                    }
                  >
                    {isConfirming ||
                      isPending ||
                      isWriteContractConfirming ||
                      isWriteContractPending ? (
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden btn deposit_btn_disabled">
                          Loading...
                        </span>
                      </Spinner>
                    ) : (
                      <span>
                        {' '}
                        {ethValue && Number(ethValue) > 0
                          ? 'Deposit'
                          : 'Enter an amount'}{' '}
                      </span>
                    )}
                  </button>
                )}
                {!l2ChainInfo.testnet ? (
                  <p
                    style={{
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      textAlign: 'left',
                      marginTop: '20px',
                      marginBottom: '0px',
                    }}
                  >
                    {/* Warning: This is a mainnet transaction involving real Ethereum */}
                  </p>
                ) : (
                  <></>
                )}

                {/* <button
                onClick={() =>
                  // console.log(chainInfoFromConfig[1].rpcUrls.default.http[0])
                  // console.log(chainInfoFromConfig)
                  {
                    console.log(l1ChainInfo)
                    console.log(l2ChainInfo)
                    console.log(balance)
                  }
                }
              >
                My Button
              </button> */}
              </div>{' '}
              {showModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 999,
                  }}
                  onClick={() => setShowModal(false)}
                />
              )}
            </section>
            {/* <button
          onClick={() => {
            console.log('pending', isPending)
            console.log('confirming', isConfirming)
            
          }}
        >
          TEST
        </button> */}
            {/* <p>{status}</p> */}
          </div>
          <ThirdParty />
        </div>
      </>
    )
  } else return <div>Loading...</div>
}

export default Deposit
