# Renewable Energy Credits Trading Platform

A blockchain-based platform for trading renewable energy credits on the Stacks network. This platform enables:

- Creation and tracking of renewable energy credit batches
- Listing credits for sale with expiration dates
- Purchasing credits from active listings
- Transferring credits between accounts
- Complete traceability of credit origins and lifecycle

## Features

- Fungible token representation of renewable energy credits
- Batch-based credit issuance and tracking
- Marketplace functionality with time-limited listings
- Owner-only minting of new credit batches
- Direct transfer capabilities
- Balance tracking for all participants
- Credit source and generation date tracking

## Contract Functions

- create-credit-batch: Create a new batch of credits with source information
- list-credits: List credits for sale with expiration date
- buy-credits: Purchase credits from an active listing
- transfer-credits: Transfer credits to another account
- get-credit-balance: Check credit balance
- get-credit-listing: View details of a credit listing
- get-credit-batch: Get information about a credit batch

## Credit Batches

Credits are now issued in batches with the following information:
- Source identification
- Generation date
- Total quantity
- Remaining quantity

## Listing Expiration

Credit listings now include expiration dates to ensure market relevance:
- Listings automatically become invalid after expiration
- Prevents trading of stale listings
- Ensures market prices remain current
