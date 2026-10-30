// Devnet uses test SOL. This public endpoint is enough for the workshop;
// students can replace it with a free-tier devnet RPC URL.
const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000n;

export function validateAddress(address) {
  // A quick base58 shape check catches common copy/paste mistakes.
  // The RPC node performs the final check that the address is valid.
  if (typeof address !== "string" || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new Error("Invalid address: enter a Solana public address (base58, 32–44 characters).");
  }
  return address;
}

export function formatSol(lamports) {
  // Keep the calculation in integers: floating-point math can round balances.
  if (!Number.isSafeInteger(lamports) || lamports < 0) {
    throw new Error("RPC returned an invalid or unsafe lamport amount.");
  }
  const amount = BigInt(lamports);
  const whole = amount / LAMPORTS_PER_SOL;
  const fraction = String(amount % LAMPORTS_PER_SOL).padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export async function getAccountInfo(address, { rpcUrl = DEFAULT_RPC_URL, fetchImpl = fetch } = {}) {
  validateAddress(address);
  // RPC is an HTTP API. This method reads an account; it does not sign or send
  // a transaction. We pass the address and ask for a confirmed view of devnet.
  const response = await fetchImpl(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      // base64 tells RPC how to encode account data if the account has any.
      params: [address, { encoding: "base64", commitment: "confirmed" }],
    }),
  });
  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}. Check your connection or try again later.`);
  }
  const body = await response.json();
  // An HTTP 200 can still contain a JSON-RPC error, so check both layers.
  if (body.error) {
    throw new Error(`RPC error: ${body.error.message ?? "unknown error"}`);
  }
  if (!body.result || !Object.hasOwn(body.result, "value")) {
    throw new Error("RPC returned an unexpected response.");
  }
  return body.result.value;
}

export function describeAccount(address, account) {
  // Explorer and the script must point to the same cluster for comparison.
  const lines = [
    "Cluster: devnet",
    `Address: ${address}`,
    `Explorer: https://explorer.solana.com/address/${address}?cluster=devnet`,
  ];
  if (account === null) {
    // A new wallet address may be valid even before an onchain account exists.
    lines.push("Account: no onchain data found yet");
    return lines.join("\n");
  }
  if (
    !Number.isSafeInteger(account.lamports) ||
    account.lamports < 0 ||
    typeof account.owner !== "string" ||
    typeof account.executable !== "boolean"
  ) {
    throw new Error("RPC returned account data in an unexpected shape.");
  }
  lines.push(
    `Balance: ${account.lamports} lamports (${formatSol(account.lamports)} SOL)`,
    // The owner is the program allowed to modify the account's data.
    `Owner program: ${account.owner}`,
    `Executable: ${account.executable ? "yes" : "no"}`,
  );
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const addresses = process.argv.slice(2);

  if (addresses.length < 2) {
    console.error("Usage: node account-viewer.mjs ADDRESS_1 ADDRESS_2");
    process.exitCode = 1;
  } else {
    const rpcUrl = process.env.SOLANA_DEVNET_RPC_URL || DEFAULT_RPC_URL;

    const results = await Promise.allSettled(
      addresses.map(async (address) => {
        const account = await getAccountInfo(address, { rpcUrl });
        return describeAccount(address, account);
      })
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(result.value);
      } else {
        console.log(`Address: ${addresses[index]}`);
        console.log(`Error: ${result.reason.message}`);
      }

      console.log("--------------------");
    });
  }
}