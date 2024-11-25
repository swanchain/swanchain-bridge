import React, { useState, useEffect } from 'react';

interface Bridge {
  name: string;
  description: string;
  url: string;
  icon: string;
}

const dummyData: Bridge[] = [
  {
    name: 'Comet Bridge',
    description: 'Bridge to Swan Chain and verify your transaction to earn Comet\'s XP',
    url: 'https://cometbridge.app/?original=Arbitrum&target=Morph%20Mainnet&symbol=ETH&channel=NP7rF5',
    icon: '/assets/images/comet.png',
  },
  {
    name: 'Meme Bridge',
    description: 'Move any assets across the crypto universe without the constraints of traditional bridges.',
    url: 'https://www.memebridge.xyz/#/bridge/?original=Ethereum&target=Swan&symbol=ETH',
    icon: '/assets/images/meme.png',
  },
  {
    name: 'Owltto Finance',
    description: 'Earn extra 150 Owltto Points per transaction bridging to Swan Chain',
    url: 'https://owlto.finance/?channel=3431&to=Swan',
    icon: '/assets/images/owlto.png',
  },
  {
    name: 'Superbridge',
    description: 'Native bridging for rollups',
    url: 'https://superbridge.app/swan-chain',
    icon: '/assets/images/super.png',
  }
];

const ThirdParty: React.FC = () => {
  const [list, setList] = useState<Bridge[]>(dummyData);
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setList(dummyData);
    setLoaded(true)
  }, []);

  useEffect(() => {
    if (loaded) {
      console.log('load complete')
    }
  }, [loaded])

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="loaded or">
        <div className="or-line"></div>
        <div className="or-main">Or</div>
        <div className="or-line"></div>
      </div>
      <div className="loaded third-party">
        <div className="title">
          Using third-party bridges
        </div>
        <div className='content'>
          {list.map((item, index) => (
            <div
              key={index}
              onClick={() => openLink(item.url)}
              className={`third-party-card ${item.url?'pointer':'is-disabled'}`}
            >
              <div className="card-wrapper">
                <img
                  src={item.icon}
                  alt={item.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    transition: 'opacity 0.3s ease',
                  }}
                />
                <div>
                  <div className="card-name">{item.name}</div>
                  <div className="card-description">{item.description}</div>
                </div>
              </div>
              <div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M15.4996 0H10.4996C10.4006 0 10.3037 0.029052 10.2213 0.0839806C10.139 0.138909 10.0747 0.217064 10.0368 0.308538C9.99889 0.400011 9.98899 0.500683 10.0084 0.597791C10.0277 0.6949 10.0755 0.784071 10.1456 0.854001L11.9386 2.646L6.29259 8.293C6.19708 8.38525 6.1209 8.49559 6.06849 8.6176C6.01608 8.7396 5.9885 8.87082 5.98734 9.0036C5.98619 9.13638 6.01149 9.26806 6.06177 9.39096C6.11205 9.51385 6.18631 9.6255 6.2802 9.7194C6.37409 9.81329 6.48574 9.88754 6.60864 9.93782C6.73154 9.9881 6.86321 10.0134 6.99599 10.0123C7.12877 10.0111 7.25999 9.98351 7.382 9.9311C7.504 9.87869 7.61435 9.80251 7.70659 9.707L13.3536 4.061L15.1456 5.854C15.1921 5.9004 15.2473 5.93718 15.3081 5.96223C15.3688 5.98728 15.4339 6.00012 15.4996 6C15.5651 5.99967 15.6299 5.98677 15.6906 5.962C15.782 5.92421 15.8602 5.86013 15.9152 5.77789C15.9702 5.69565 15.9996 5.59894 15.9996 5.5V0.500001C15.9996 0.367393 15.9469 0.240216 15.8531 0.146447C15.7594 0.0526792 15.6322 0 15.4996 0Z"
                    fill="white"
                  />
                  <path
                    d="M13 9C12.7348 9 12.4804 9.10536 12.2929 9.29289C12.1054 9.48043 12 9.73478 12 10V14H2V4H6C6.26522 4 6.51957 3.89464 6.70711 3.70711C6.89464 3.51957 7 3.26522 7 3C7 2.73478 6.89464 2.48043 6.70711 2.29289C6.51957 2.10536 6.26522 2 6 2H2C1.46957 2 0.960859 2.21071 0.585786 2.58579C0.210714 2.96086 0 3.46957 0 4L0 14C0 14.5304 0.210714 15.0391 0.585786 15.4142C0.960859 15.7893 1.46957 16 2 16H12C12.5304 16 13.0391 15.7893 13.4142 15.4142C13.7893 15.0391 14 14.5304 14 14V10C14 9.73478 13.8946 9.48043 13.7071 9.29289C13.5196 9.10536 13.2652 9 13 9Z"
                    fill="white"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ThirdParty;
