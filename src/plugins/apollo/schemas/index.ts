import { gql } from '@apollo/client'

/* -------------------------------------------------------------------------- */
/*                                  XX => ETH                                 */
/* -------------------------------------------------------------------------- */

// Subscription for proposal events
export type SubProposalEvents = {
  proposal: {
    status: boolean
  }[]
}

const SUBSCRIBE_PROPOSAL_EVENTS_QUERY = `
    subscription SubProposalEvents($where: proposal_bool_exp!){
        proposal(where: $where) {
            status
        }
    }
`

export const SUB_PROPOSAL_EVENTS = gql([SUBSCRIBE_PROPOSAL_EVENTS_QUERY])

// Subscribe deposit nonce
export type SubDepositNonce = {
  deposit: {
    nonce: string
    blockNumber: string
  }[]
}

const SUB_DEPOSIT_NONCE_QUERY = `
  subscription SubDepositNonce($where: deposit_bool_exp!){
    deposit(where: $where) {
      nonce
      blockNumber: block_number
    }
  }
`

export const SUB_DEPOSIT_NONCE = gql([SUB_DEPOSIT_NONCE_QUERY])

/* -------------------------------------------------------------------------- */
/*                                  ETH => XX                                 */
/* -------------------------------------------------------------------------- */

// Subscription for bridge event
export type SubBridgeEvents = {
  event: {
    blockNumber: string
  }[]
}

const SUBSCRIBE_BRIDGE_EVENTS_QUERY = `
    subscription SubBridgeEvents($where: event_bool_exp!){
      event(where: $where) {
        blockNumber: block_number
      }
    }
`

export const SUB_BRIDGE_EVENTS = gql([SUBSCRIBE_BRIDGE_EVENTS_QUERY])
