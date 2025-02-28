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
    name: "Ensures invalid price listings are rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        chain.mineBlock([
            Tx.contractCall('energy-credits', 'create-credit-batch', [
                types.ascii("Solar Farm A"),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        let block = chain.mineBlock([
            Tx.contractCall('energy-credits', 'list-credits', [
                types.uint(100),
                types.uint(0),
                types.uint(30),
                types.some(types.uint(1))
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectErr(104);
    }
});

Clarinet.test({
    name: "Ensures partial purchases update listings correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const buyer = accounts.get('wallet_2')!;
        
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
                types.uint(30),
                types.some(types.uint(1))
            ], deployer.address)
        ]);
        
        let block = chain.mineBlock([
            Tx.contractCall('energy-credits', 'buy-credits', [
                types.uint(1),
                types.uint(50)
            ], buyer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
        
        let listing = chain.callReadOnlyFn(
            'energy-credits',
            'get-credit-listing',
            [types.uint(1)],
            deployer.address
        ).result.expectSome();
        
        assertEquals(listing['quantity'], types.uint(50));
    }
});
