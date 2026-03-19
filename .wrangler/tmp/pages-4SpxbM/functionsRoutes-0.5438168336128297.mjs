import { onRequest as __api_accounts__id__ts_onRequest } from "C:\\Users\\Ruan\\Documents\\Github\\Gnomo\\functions\\api\\accounts\\[id].ts"
import { onRequest as __api_transactions__id__ts_onRequest } from "C:\\Users\\Ruan\\Documents\\Github\\Gnomo\\functions\\api\\transactions\\[id].ts"
import { onRequest as __api_accounts_ts_onRequest } from "C:\\Users\\Ruan\\Documents\\Github\\Gnomo\\functions\\api\\accounts.ts"
import { onRequest as __api_clear_all_ts_onRequest } from "C:\\Users\\Ruan\\Documents\\Github\\Gnomo\\functions\\api\\clear-all.ts"
import { onRequest as __api_transactions_ts_onRequest } from "C:\\Users\\Ruan\\Documents\\Github\\Gnomo\\functions\\api\\transactions.ts"

export const routes = [
    {
      routePath: "/api/accounts/:id",
      mountPath: "/api/accounts",
      method: "",
      middlewares: [],
      modules: [__api_accounts__id__ts_onRequest],
    },
  {
      routePath: "/api/transactions/:id",
      mountPath: "/api/transactions",
      method: "",
      middlewares: [],
      modules: [__api_transactions__id__ts_onRequest],
    },
  {
      routePath: "/api/accounts",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_accounts_ts_onRequest],
    },
  {
      routePath: "/api/clear-all",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_clear_all_ts_onRequest],
    },
  {
      routePath: "/api/transactions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_transactions_ts_onRequest],
    },
  ]