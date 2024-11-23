import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensures owner can create credits",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('energy-credits', 'create-credits', [
                types.principal(wallet1.address),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        let balanceBlock = chain.mineBlock([
            Tx.contractCall('energy-credits', 'get-credit-balance', [
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        
        assertEquals(balanceBlock.receipts[0].result.expectOk(), types.uint(1000));
    }
});

Clarinet.test({
    name: "Ensures credits can be listed and purchased",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_2')!;
        
        // Mint credits for seller
        chain.mineBlock([
            Tx.contractCall('energy-credits', 'create-credits', [
                types.principal(seller.address),
                types.uint(1000)
            ], deployer.address)
        ]);
        
        // List credits
        let listBlock = chain.mineBlock([
            Tx.contractCall('energy-credits', 'list-credits', [
                types.uint(100),
                types.uint(10)
            ], seller.address)
        ]);
        
        listBlock.receipts[0].result.expectOk();
        
        // Buy credits
        let buyBlock = chain.mineBlock([
            Tx.contractCall('energy-credits', 'buy-credits', [
                types.uint(1),
                types.uint(50)
            ], buyer.address)
        ]);
        
        buyBlock.receipts[0].result.expectOk();
    }
});
