import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WalletPage from './Wallet.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletPage />
  </StrictMode>,
)
