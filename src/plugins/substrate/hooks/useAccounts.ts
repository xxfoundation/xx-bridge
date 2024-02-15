import { useContext } from 'react'
import AccountsContext from '../components/AccountsContext'

const useAccounts = () => useContext(AccountsContext)

export default useAccounts
