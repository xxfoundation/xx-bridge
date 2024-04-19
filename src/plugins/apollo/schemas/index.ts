import { gql } from '@apollo/client'

/* -------------------------------------------------------------------------- */
/*                           ETH Indexer: XX => ETH                           */
/* -------------------------------------------------------------------------- */

// Query for proposal events
export type QueryProposalEvents = {
  proposal: {
    votes: {
      txHash: string
    }[]
  }[]
}

const PROPOSAL_EVENTS_QUERY = `
  query GetProposalEvents($where: proposal_bool_exp!){
    proposal(where: $where) {
      status
      votes {
        txHash: txn_hash
      }
    }
  }
`

export const QUERY_PROPOSAL_EVENTS = gql([PROPOSAL_EVENTS_QUERY])

// Query deposit nonce
export type QueryDepositNonce = {
  deposit: {
    nonce: string
    blockNumber: string
  }[]
}

const QUERY_DEPOSIT_NONCE_QUERY = `
  query GetDepositNonce($where: deposit_bool_exp!){
    deposit(where: $where) {
      nonce
      blockNumber: block_number
    }
  }
`

export const QUERY_DEPOSIT_NONCE = gql([QUERY_DEPOSIT_NONCE_QUERY])

/* -------------------------------------------------------------------------- */
/*                            XX Indexer: ETH => XX                           */
/* -------------------------------------------------------------------------- */

// Query for bridge event
export type QueryBridgeEvents = {
  event: {
    blockNumber: string
    phase: string
  }[]
}

const QUERY_BRIDGE_EVENTS_QUERY = `
    query GetBridgeEvents($where: event_bool_exp!){
      event(where: $where) {
        blockNumber: block_number
        phase
      }
    }
`

export const QUERY_BRIDGE_EVENTS = gql([QUERY_BRIDGE_EVENTS_QUERY])

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
