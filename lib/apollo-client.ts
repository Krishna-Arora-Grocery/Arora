import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"

const graphqlEndpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://ufqoblprovsdspfuviqa.hasura.ap-south-1.nhost.run/v1/graphql"

console.log("[v0] GraphQL endpoint:", graphqlEndpoint)

const httpLink = new HttpLink({
  uri: graphqlEndpoint,
})

const authLink = setContext(async (_, { headers }) => {
  return {
    headers: {
      ...headers,
      "x-hasura-admin-secret": process.env.NHOST_ADMIN_SECRET || "lAAAfJ0wpK9VJ),YcKv#Qn$R!T2A)(1h",
    },
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only", // Changed from cache-first to network-only for real-time data
    },
    query: {
      fetchPolicy: "network-only", // Changed from cache-first to network-only for real-time data
    },
  },
})

// Admin client with admin secret for server-side operations
export const adminApolloClient = new ApolloClient({
  link: new HttpLink({
    uri: graphqlEndpoint,
    headers: {
      "x-hasura-admin-secret": process.env.NHOST_ADMIN_SECRET || "lAAAfJ0wpK9VJ),YcKv#Qn$R!T2A)(1h",
    },
  }),
  cache: new InMemoryCache(),
})
