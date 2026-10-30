import assert from "node:assert/strict";
import test from "node:test";
import { describeAccount, formatSol, getAccountInfo, validateAddress } from "./account-viewer.mjs";

const address = "11111111111111111111111111111111";

test("formats lamports without floating-point rounding", () => {
  assert.equal(formatSol(1_500_000_001), "1.500000001");
  assert.equal(formatSol(0), "0");
});

test("rejects malformed addresses before making an RPC request", async () => {
  assert.throws(() => validateAddress("not-an-address"), /Invalid address/);
  let called = false;
  await assert.rejects(
    getAccountInfo("not-an-address", { fetchImpl: () => { called = true; } }),
    /Invalid address/,
  );
  assert.equal(called, false);
});

test("reads a valid RPC account response", async () => {
  const account = await getAccountInfo(address, {
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        result: { value: { lamports: 1_500_000_001, owner: address, executable: false } },
      }),
    }),
  });
  const output = describeAccount(address, account);
  assert.match(output, /1\.500000001 SOL/);
  assert.match(output, /Owner program:/);
  assert.match(output, /cluster=devnet/);
});

test("explains an account with no onchain data", () => {
  assert.match(describeAccount(address, null), /no onchain data found yet/);
});
