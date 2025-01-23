import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BsDiscord } from 'react-icons/bs'
import { AiFillLinkedin, AiFillTwitterCircle } from 'react-icons/ai'
import { FaFacebook } from 'react-icons/fa'

const Footer: React.FunctionComponent = () => {
  const router = useRouter()
  const handleOptionSelect = (destination: string) => {
    // const selectedOption = event.target.value
    // router.push(event.target.value)
    // event.target.value = ''

    router.push(destination)
  }
  return (
    <>
      <footer className="app_footer">
        <div className="footer_text_wrap">
          <span className="commit_hash">{process.env.COMMIT_HASH}</span>
          <ul>
            {/* <li>
              <Link
                href="https://discord.gg/swanchain"
                target="_blank"
                rel="noopener noreferrer"
              >
                Help center
              </Link>
            </li>
            <li>
              <span>v0.1.5</span>
            </li> */}
          </ul>
        </div>
        <div className="page-select-conatainer">
          <button
            className="btn footer_btn flex-row "
            onClick={() => {
              router.pathname == '/withdraw-history'
                ? handleOptionSelect('/deposit')
                : handleOptionSelect('/withdraw-history')
            }}
          >
            {/* <HiSwitchHorizontal /> */}
            <span>
              {router.pathname == '/withdraw-history'
                ? 'Bridge'
                : 'Withdraw History'}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 256 256"
              className="fill-zinc-400 -translate-x-1"
            >
              <path d="M216.49 168.49a12 12 0 01-17 0L128 97l-71.51 71.49a12 12 0 01-17-17l80-80a12 12 0 0117 0l80 80a12 12 0 010 17z"></path>
            </svg>
          </button>
        </div>
        <div className="footer_icn_wrap">
          <ul>
            {/* <li>
              <Link href="/">
                <FaFacebook />
              </Link>
            </li> */}
            <li>
              <Link
                href="https://twitter.com/swan_chain"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AiFillTwitterCircle />
              </Link>
            </li>
            {/* <li>
              <Link href="https://ca.linkedin.com/company/swancloud">
                <AiFillLinkedin />
              </Link>
            </li> */}
            <li>
              <Link
                href="https://discord.gg/swanchain"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsDiscord />
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </>
  )
}

export default Footer
