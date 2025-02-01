import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensures credit batches can be created and tracked",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('energy-credits', 'create-credit-batch', [
                types.ascii("Solar Farm A"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1);
        
        let batchBlock = chain.mineBlock([
            Tx.contractCall('energy-credits', 'get-credit-batch', [
                types.uint(1)
            ], deployer.address)
        ]);
        
        let batch = batchBlock.receipts[0].result.expectSome();
        assertEquals(batch['source'], types.ascii("Solar Farm A"));
        assertEquals(batch['total-quantity'], types.uint(1000));
    }
});

Clarinet.test({
    name: "Ensures credits can be listed with expiration and batch info",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        
        // Create batch and mint credits
        chain.mineBlock([
            Tx.contractCall('energy-credits', 'create-credit-batch', [
                types.ascii("Solar Farm A"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // List credits with expiration and batch
        let block = chain.mineBlock([
            Tx.contractCall('energy-credits', 'list-credits', [
                types.uint(100),
                types.uint(10),
                types.uint(30),
                types.some(types.uint(1))
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk();
    }
});

Clarinet.test({
    name: "Ensures expired listings cannot be purchased",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const buyer = accounts.get('wallet_2')!;
        
        // Create listing with immediate expiration
        chain.mineBlock([
            Tx.contractCall('energy-credits', 'create-credit-batch', [
                types.ascii("Solar Farm A"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        chain.mineBlock([
            Tx.contractCall('energy-credits', 'list-credits', [
                types.uint(100),
                types.uint(10),
                types.uint(1),
                types.some(types.uint(1))
            ], deployer.address)
        ]);
        
        // Advance chain
        chain.mineEmptyBlock(10);
        
        // Attempt purchase
        let block = chain.mineBlock([
            Tx.contractCall('energy-credits', 'buy-credits', [
                types.uint(1),
                types.uint(50)
            ], buyer.address)
        ]);
        
        block.receipts[0].result.expectErr(105);
    }
});
