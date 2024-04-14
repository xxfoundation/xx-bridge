import { gql } from '@apollo/client'

/* -------------------------------------------------------------------------- */
/*                           ETH Indexer: XX => ETH                           */
/* -------------------------------------------------------------------------- */

// Subscription for proposal events
export type SubProposalEvents = {
  proposal: {
    status: boolean
  }[]
}

const SUBSCRIBE_PROPOSAL_EVENTS_QUERY = `
    query SubProposalEvents($where: proposal_bool_exp!){
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
  query SubDepositNonce($where: deposit_bool_exp!){
    deposit(where: $where) {
      nonce
      blockNumber: block_number
    }
  }
`

export const SUB_DEPOSIT_NONCE = gql([SUB_DEPOSIT_NONCE_QUERY])

/* -------------------------------------------------------------------------- */
/*                            XX Indexer: ETH => XX                           */
/* -------------------------------------------------------------------------- */

// Subscription for bridge event
export type SubBridgeEvents = {
  event: {
    blockNumber: string
    phase: string
  }[]
}

const SUBSCRIBE_BRIDGE_EVENTS_QUERY = `
    query SubBridgeEvents($where: event_bool_exp!){
      event(where: $where) {
        blockNumber: block_number
        phase
      }
    }
`

export const SUB_BRIDGE_EVENTS = gql([SUBSCRIBE_BRIDGE_EVENTS_QUERY])

// Get Latest Bridge Transfers
export type GetBridgeTransfers = {
  extrinsic: {
    index: string
    block: string
    timestamp: string
  }[]
}
const GET_LATEST_BRIDGE_TRANSFERS_QUERY = `
  query GetBridgeTransfers($account: String!, $limit: Int! = 10) {
    extrinsic(
      where: {_and: [{signer: {_eq: $account}}, {module: {_eq: "swap"}}, {success: {_eq: true}}]}
      order_by: {block_number: desc}
      limit: $limit
    ) {
      index: extrinsic_index
      block: block_number
      timestamp
    }
  }
`
export const GET_BRIDGE_TRANSFERS = gql([GET_LATEST_BRIDGE_TRANSFERS_QUERY])
