import React from "react";
import { getSession } from "../lib/workos";

export default async function Tenant({
  params,
}: {
  params: { tenant: string };
}) {
  const s = await getSession();

  return (
    <div>
      <p>Tenant - {params.tenant}</p>
      <pre>{JSON.stringify(s, null, 2)}</pre>
    </div>
  );
}
