import { runQuery } from "~/node_common/data/utilities";

export default async ({ did }) => {
  return await runQuery({
    label: "GET_USER_BY_DID",
    queryFn: async (DB) => {
      const hasDID = (did) => DB.raw(`?? @> ?::jsonb`, ["data", JSON.stringify({ did })]);

      const query = await DB.select("*").from("users").where(hasDID(did)).first();

      if (!query || query.error) {
        return null;
      }

      if (query.id) {
        return JSON.parse(JSON.stringify(query));
      }

      return null;
    },
    errorFn: async (e) => {
      return {
        error: true,
        decorator: "GET_USER_BY_DID",
      };
    },
  });
};
