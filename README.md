# Solana Devnet Account Watchlist

A simple command-line tool that checks multiple Solana Devnet public addresses and displays their account information.

## Requirements

- Node.js 20 or later
- Internet connection

## How to Run

Open your terminal in this project folder and run:

```bash
node account-viewer.mjs ADDRESS_1 ADDRESS_2
```

You can check multiple addresses in one command.

Example:

```bash
node account-viewer.mjs 11111111111111111111111111111111 S5ATcHvSLDm8mDxzjjkAbbWwKecZsXE2m6nd1BLStup
```

The watchlist displays:
- Account address
- SOL balance
- Owner program
- Executable status

Invalid addresses and RPC errors are handled independently, so one failed request does not stop other results.

## Run Tests

```bash
node --test account-viewer.test.mjs
```

## What I Learned

I learned that Solana accounts have different properties. For example, the System Program is an executable account owned by the Native Loader, while a regular wallet account is non-executable and owned by the System Program.