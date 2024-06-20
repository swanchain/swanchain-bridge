import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import Head from 'next/head'

import { Spinner } from 'react-bootstrap'
import { GrSend } from 'react-icons/gr'
import { IoMdTime } from 'react-icons/io'
import { LuShield } from 'react-icons/lu'
import { HiDownload, HiDotsVertical, HiSwitchHorizontal } from 'react-icons/hi'
import { useAccount, useSwitchChain } from 'wagmi'
import axios from 'axios'
import ReactPaginate from 'react-paginate'
import { useChainConfig } from '../hooks/useChainConfig'

const { ethers } = require('ethers')
const optimismSDK = require('@eth-optimism/sdk')
// const Web3 = require('web3')

const OUTPUT_ORACLE_ABI = [
  {
    inputs: [],
    name: 'latestBlockNumber',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const WithdrawHistory: React.FC = (walletAddress: any) => {
  const { address, isConnected, chain } = useAccount()
  const [withdrawals, setWithdrawals] = useState([])
  const [loader, setLoader] = useState<boolean>(false)
  const [modalData, setModalData] = useState<any>(null)
  const [offset, setOffset] = useState<Number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalRows, setTotalRows] = useState<number>(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { chains, switchChain } = useSwitchChain()
  const { chainInfoFromConfig, chainInfoAsObject } = useChainConfig()

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        setLoader(true)
        // const page = searchParams.get('page') ?? '1'
        const offset = 10 * (currentPage - 1)
        // router.push(
        //   {
        //     pathname: '/withdraw-history',
        //     query: { page: currentPage },
        //   },
        //   undefined,
        //   { shallow: true },
        // )
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_ROUTE}/withdraw_transactions?wallet_address=${address}&limit=10&offset=${offset}`,
          // `http://localhost:3001/withdraw-history/${address}`,
        ) // Replace '/api/withdrawals' with your API endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        let data = await response.json()
        // console.log(data)
        let withdrawal_data = data.data
        let withdrawal_list = withdrawal_data.withdraw_transaction_list

        const providers = chainInfoFromConfig
          .slice(1)
          .reduce((acc: any, chainInfo: any) => {
            const provider = new ethers.providers.JsonRpcProvider(
              chainInfoAsObject[chainInfo.id].rpcUrl,
              'any',
            )

            acc[chainInfo.id] = provider

            return acc
          }, {})

        // let saturnUrl = process.env.NEXT_PUBLIC_L2_SATURN_RPC_URL
        // let proximaUrl = process.env.NEXT_PUBLIC_L2_PROXIMA_RPC_URL
        // const saturnProvider = new ethers.providers.JsonRpcProvider(
        //   saturnUrl,
        //   'any',
        // )
        // const proximaProvider = new ethers.providers.JsonRpcProvider(
        //   proximaUrl,
        //   'any',
        // )

        withdrawal_list = await Promise.all(
          withdrawal_list.map(async (w: any) => {
            let tx_hash = w.withdraw_tx_hash
            // w.withdraw_tx_hash.slice(0, 2) == '0x'
            //   ? w.withdraw_tx_hash
            //   : `0x${w.withdraw_tx_hash}`

            // let receipt = null
            // let block = null

            // if (w.chain_id == '2024') {
            //   receipt = await saturnProvider.getTransaction(tx_hash)
            //   block = await saturnProvider.getBlock(receipt.blockNumber)
            // } else if (w.chain_id == '20241133') {
            //   receipt = await proximaProvider.getTransaction(tx_hash)
            //   block = await proximaProvider.getBlock(receipt.blockNumber)
            // }
            let receipt = await providers[w.chain_id].getTransaction(tx_hash)
            let block = await providers[w.chain_id].getBlock(
              receipt.blockNumber,
            )
            return {
              ...w,
              tx_hash,
              amount: ethers.utils.formatEther(receipt.value),
              timestamp: block.timestamp,
              block_number: receipt.blockNumber,
              // receipt: await l2Provider.getTransaction(tx_hash),
            }
          }),
        )

        // let receipt = await l2Provider.getTransaction(
        //   withdrawal_list[0].tx_hash,
        // )

        // console.log(await l2Provider.getBlock(receipt.blockNumber))

        setTotalRows(withdrawal_data.total)

        // console.log(withdrawal_list)
        setWithdrawals(withdrawal_list)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoader(false)
    }

    if (address && isConnected && chainInfoAsObject) fetchData()
  }, [address, isConnected, currentPage, chainInfoAsObject])

  const closeModal = () => {
    setModalData(null)
  }

  const checkModalClick = (e: any) => {
    if (e.target.className == 'modal-container') {
      closeModal()
    }
  }

  const handlePageClick = (event: any) => {
    // const newOffset = (event.selected * itemsPerPage) % items.length
    setLoader(true)
    console.log(`User requested page number ${event.selected + 1}`)
    setCurrentPage(event.selected + 1)
  }

  const getModalData = async (rowData: any) => {
    let l1Url = chainInfoAsObject[chainInfoFromConfig[0].id].rpcUrl
    const l1Provider = new ethers.providers.JsonRpcProvider(l1Url, 'any')

    let L2OutputOracle =
      chainInfoAsObject[rowData.chain_id].contracts.l2OutputOracle

    const outputOracleContract = new ethers.Contract(
      L2OutputOracle,
      OUTPUT_ORACLE_ABI,
      l1Provider,
    )

    try {
      rowData.latestOutputtedBlockNumber = Number(
        await outputOracleContract.latestBlockNumber(),
      )
      // console.log(
      //   'Result of the view function:',
      //   rowData.latestOutputtedBlockNumber,
      // )
      // console.log(rowData)

      // rowData.status = 'initiated'

      if (
        rowData.latestOutputtedBlockNumber < Number(rowData.block_number) ||
        rowData.status == 'finalized'
      ) {
        rowData.isButtonDisabled = true
      } else {
        rowData.isButtonDisabled = false
      }

      // Get withdraw transaction details
      // const transaction = await l2Provider.getTransaction(rowData.tx_hash)

      // // If transaction is found and has a value, return the value
      // if (transaction && transaction.value) {
      //   rowData.amount = ethers.utils.formatEther(transaction.value) // Convert value from Wei to Ether
      // } else {
      //   rowData.amount = 'unknown amount'
      // }
    } catch (error) {
      console.error('Error:', error)
      return 'Error occurred while fetching transaction value'
    }

    setModalData(rowData)
  }

  const handleModalButton = async () => {
    let l1Url = chainInfoAsObject[chainInfoFromConfig[0].id].rpcUrl
    let l2Url = chainInfoAsObject[modalData.chain_id].rpcUrl
    let AddressManager =
      chainInfoAsObject[modalData.chain_id].contracts.addressManager
    let L1CrossDomainMessenger =
      chainInfoAsObject[modalData.chain_id].contracts.l1CrossDomainMessenger
    let L1StandardBridge =
      chainInfoAsObject[modalData.chain_id].contracts.l1StandardBridge
    let L2OutputOracle =
      chainInfoAsObject[modalData.chain_id].contracts.l2OutputOracle
    let OptimismPortal =
      chainInfoAsObject[modalData.chain_id].contracts.optimismPortal

    const l1Provider = new ethers.providers.Web3Provider(window.ethereum)
    const l2Provider = new ethers.providers.JsonRpcProvider(l2Url, 'any')
    const l1Signer = l1Provider.getSigner(address)
    const l2Signer = l2Provider.getSigner(address)
    const zeroAddr = '0x'.padEnd(42, '0')
    const l1Contracts = {
      StateCommitmentChain: zeroAddr,
      CanonicalTransactionChain: zeroAddr,
      BondManager: zeroAddr,
      AddressManager,
      L1CrossDomainMessenger,
      L1StandardBridge,
      OptimismPortal,
      L2OutputOracle,
    }
    const crossChainMessenger = new optimismSDK.CrossChainMessenger({
      contracts: {
        l1: l1Contracts,
      },
      // bridges: bridges,
      l1ChainId: Number(chainInfoFromConfig[0].id),
      l2ChainId: Number(modalData.chain_id),
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer,
      // bedrock: true,
    })
    console.log(address)

    try {
      setLoader(true)

      let response = null
      if (modalData.status == 'initiated') {
        response = await crossChainMessenger.proveMessage(modalData.tx_hash)
      } else if (modalData.status == 'proven') {
        response = await crossChainMessenger.finalizeMessage(modalData.tx_hash)
      }
      await response.wait()

      console.log('sdk response:', response)

      // const crossChainMessage = await crossChainMessenger.toCrossChainMessage(
      //   response,
      // )

      // console.log('crosschain message:', crossChainMessage)
      // const transactionHash = crossChainMessage.transactionHash
      const transactionHash = response.hash

      if (transactionHash !== null) {
        if (modalData.status == 'initiated') {
          setModalData({ ...modalData, status: 'proven' })
        } else if (modalData.status == 'proven') {
          setModalData({
            ...modalData,
            status: 'finalized',
            isButtonDisabled: true,
          })
        }
        setLoader(false)
      }

      // let result = await axios.post(url, formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // })

      // console.log(result.data)
    } catch (error:any) {
      setLoader(false)
      if (
        error.reason ===
        'execution reverted: OptimismPortal: withdrawal hash has already been proven'
      ) {
        console.error('Withdrawal hash has already been proven')
        setModalData({ ...modalData, status: 'proven' })
      } else if (
        error.reason ===
        'execution reverted: OptimismPortal: withdrawal has already been finalized'
      ) {
        console.error('Withdrawal hash has already been finalized')
        setModalData({
          ...modalData,
          status: 'finalized',
          isButtonDisabled: true,
        })
      } else {
        console.error('Error:', error.reason)
        // Handle other errors
      }
    }
  }

  if (chainInfoAsObject) {
    return (
      <>
        <Head>
          <title>Withdraw History</title>
          <meta name="description" content="Withdraw History" />
        </Head>

        <div className="history_wrap">
          <div>
            <h2>Withdrawal History {isConnected}</h2>
            {loader && !modalData ? (
              <div className="loading">
                <div className="loading-text">Loading...</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Network</th>
                    <th>Transaction Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal: any, index) => (
                    <tr
                      key={index}
                      onClick={async (e: any) => {
                        if (e.target.className != 'tx_hash')
                          getModalData(withdrawal)
                      }}
                    >
                      <td>
                        {new Date(withdrawal.timestamp * 1000).toLocaleString()}
                      </td>
                      <td>{withdrawal.amount}</td>
                      <td>
                        {chainInfoAsObject[withdrawal.chain_id]
                          ? chainInfoAsObject[withdrawal.chain_id].name
                          : withdrawal.chain_id}
                      </td>
                      <td>
                        <a
                          className="tx_hash"
                          target="_blank"
                          href={
                            `${
                              chainInfoAsObject[withdrawal.chain_id]
                                .blockExplorer
                            }/tx/${withdrawal.tx_hash}`
                            // withdrawal.chain_id == '2024'
                            //   ? `https://saturn-explorer.swanchain.io/tx/${withdrawal.tx_hash}`
                            //   : `https://proxima-explorer.swanchain.io/tx/${withdrawal.tx_hash}`
                          }
                          rel="noopener noreferrer"
                        >
                          {withdrawal.tx_hash.slice(0, 6)}...
                          {withdrawal.tx_hash.slice(-4)}{' '}
                        </a>
                      </td>
                      <td>{withdrawal.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ReactPaginate
            className="pagination"
            pageClassName="page-number"
            activeClassName="active page-number"
            previousClassName="page-number"
            nextClassName="page-number"
            disabledClassName="disabled"
            breakLabel="..."
            nextLabel=">"
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={Math.ceil(totalRows / 10)}
            previousLabel="<"
            renderOnZeroPageCount={null}
          />
        </div>
        {modalData && (
          <div className="modal-container" onClick={checkModalClick}>
            <div className="modal">
              <div className="modal-content">
                <div className="modal-content-header">
                  <h2>Withdrawal</h2>
                  <span className="close" onClick={closeModal}>
                    &times;
                  </span>
                </div>
                <div className="modal-amoumt">
                  <span className="title">Amount to withdraw</span>
                  <span className="text">{modalData.amount} swanETH</span>
                </div>
                <div className="withdraw-flow">
                  <ul>
                    <li
                      className="withdraw-step done"
                      onClick={() => console.log(modalData.isButtonDisabled)}
                    >
                      <GrSend size={28} />
                      Initiate withdraw
                    </li>
                    <li className="vertical-dots">
                      <HiDotsVertical />
                    </li>
                    <li
                      className={
                        modalData.isButtonDisabled &&
                        modalData.status == 'initiated'
                          ? 'withdraw-step'
                          : 'withdraw-step done'
                      }
                    >
                      <IoMdTime size={28} />
                      Wait for the published withdraw on L1
                    </li>
                    <li className="vertical-dots">
                      <HiDotsVertical />
                    </li>
                    <li
                      className={
                        modalData.status == 'proven' ||
                        modalData.status == 'finalized'
                          ? 'withdraw-step done'
                          : 'withdraw-step'
                      }
                    >
                      <LuShield size={28} />
                      Prove withdrawal
                    </li>
                    <li className="vertical-dots">
                      <HiDotsVertical />
                    </li>
                    <li
                      className={
                        modalData.status == 'proven' ||
                        modalData.status == 'finalized'
                          ? 'withdraw-step done'
                          : 'withdraw-step'
                      }
                    >
                      <IoMdTime size={28} />
                      Wait the fault challenge period
                    </li>
                    <li className="vertical-dots">
                      <HiDotsVertical />
                    </li>
                    <li
                      className={
                        modalData.status == 'finalized'
                          ? 'withdraw-step done'
                          : 'withdraw-step'
                      }
                    >
                      <HiDownload size={28} />
                      Claim withdrawal
                    </li>
                  </ul>
                </div>
                <div className="modal-btn-container">
                  {chain?.id == chainInfoFromConfig[0].id ? (
                    <button
                      className={
                        modalData.isButtonDisabled
                          ? 'modal-btn disabled'
                          : 'modal-btn'
                      }
                      disabled={modalData.isButtonDisabled}
                      onClick={() => handleModalButton()}
                    >
                      {loader ? (
                        <Spinner animation="border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </Spinner>
                      ) : modalData.status == 'initiated' ? (
                        'Prove withdrawal'
                      ) : modalData.status == 'finalized' ? (
                        'Withdrawal claimed'
                      ) : (
                        'Claim withdrawal'
                      )}
                    </button>
                  ) : (
                    <button
                      className={'modal-btn'}
                      onClick={() =>
                        switchChain({
                          chainId: Number(chainInfoFromConfig[0].id),
                        })
                      }
                    >
                      <HiSwitchHorizontal />
                      Switch to {chainInfoFromConfig[0].name}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  } else return <div>Loading...</div>
}

export default WithdrawHistory
