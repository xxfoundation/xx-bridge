import { gql } from '@apollo/client'

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
