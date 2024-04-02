import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  from,
  split,
  InMemoryCache
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { RetryLink } from '@apollo/client/link/retry'
import { getMainDefinition } from '@apollo/client/utilities'
import { OperationDefinitionNode } from 'graphql'
import { createClient } from 'graphql-ws'

const graphqlHost =
  `${process.env.ETH_INDEXER_URL}/v1/graphql` ||
  'http://localhost:4350/v1/graphql'

const httpLink = new HttpLink({ uri: graphqlHost })
const wsLink = new GraphQLWsLink(
  createClient({
    retryAttempts: 3,
    url: `wss://${graphqlHost.replace('http://', '').replace('https://', '')}`,
    disablePong: true
  })
)
const retryLink = new RetryLink()

const links = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(
      query
    ) as OperationDefinitionNode
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  ApolloLink.from([retryLink, httpLink])
)

const client = new ApolloClient({
  link: from([links]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        queryType: true,
        subscriptionType: true,
        fields: {
          account_by_pk: {
            keyArgs: ['id'],
            merge: (existing = {}, incoming = {}) => ({
              ...existing,
              ...incoming
            })
          }
        }
      }
    }
  })
})

export default client
