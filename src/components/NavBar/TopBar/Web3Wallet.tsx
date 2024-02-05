import { Stack } from '@mui/material'
// import { useWeb3Modal } from '@web3modal/wagmi/react'
import React from 'react'
import { useAccount } from 'wagmi'
// import { shortenHash } from '@/utils'

const Web3Wallet: React.FC = () => {
  const { address } = useAccount()
  // const { open } = useWeb3Modal()

  return (
    <Stack direction="row" gap="10px" key={address}>
      {/* <Button
        sx={{
          fontWeight: 'bold',
          backgroundColor: 'background.paper',
          borderRadius: '20px',
          '&:hover': { backgroundColor: 'background.grey' },
          '&:focus': { outline: 'none' }
        }}
        onClick={() => open()}
      >
        {shortenHash(!address ? '0x...' : address)}
      </Button> */}
      <div
        onClick={() => {
          const modal = document.querySelector('body > w3m-modal:nth-child(5)')
          if (modal) {
            ;(modal as HTMLElement).style.zIndex = '10000'
            ;(modal as HTMLElement).style.backgroundColor = 'rgb(0,0,0,0.7)'
          }

          const router = modal?.shadowRoot?.querySelector('w3m-router')
          const accountView =
            router?.shadowRoot?.querySelector('w3m-account-view')
          const listItem = accountView?.shadowRoot?.querySelector(
            'wui-flex:nth-child(2) > wui-list-item:nth-child(2)'
          )

          if (listItem) {
            ;(listItem as HTMLElement).style.display = 'none'
          }
        }}
      >
        <w3m-account-button />
      </div>
    </Stack>
  )
}

export default Web3Wallet
