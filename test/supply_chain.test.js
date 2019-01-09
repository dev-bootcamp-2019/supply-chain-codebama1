/*

This test file has been updated for Truffle version 5.0. If your tests are failing, make sure that you are
using Truffle version 5.0. You can check this by running "trufffle version"  in the terminal. If version 5 is not
installed, you can uninstall the existing version with `npm uninstall -g truffle` and install the latest version (5.0)
with `npm install -g truffle`.

*/

var SupplyChain = artifacts.require('SupplyChain')

contract('SupplyChain', function(accounts) {

    const owner = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    var sku
    const price = "1000"

    it("should add an item with the provided name and price", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false
        const name = "book"
	
	const tx = await supplyChain.addItem(name, price, {from: alice})
	
	if (tx.logs[0].event) {
		sku = tx.logs[0].args.sku.toString(10)
		eventEmitted = true
	}
        
        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(result[0], name, 'the name of the last added item does not match the expected value')
        assert.equal(result[2].toString(10), price, 'the price of the last added item does not match the expected value')
        assert.equal(result[3].toString(10), 0, 'the state of the item should be "For Sale", which should be declared first in the State Enum')
        assert.equal(result[4], alice, 'the address adding the item should be listed as the seller')
        assert.equal(result[5], emptyAddress, 'the buyer address should be set to 0 when an item is added')
        assert.equal(eventEmitted, true, 'adding an item should emit a For Sale event')
    })

    it("should allow someone to purchase an item", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false
        var amount = "1000" 

        var aliceBalanceBefore = await web3.eth.getBalance(alice)
        var bobBalanceBefore = await web3.eth.getBalance(bob)

        const tx = await supplyChain.buyItem(sku, {from: bob, value: amount})
	
	if (tx.logs[0].event) {
		sku = tx.logs[0].args.sku.toString(10)
		eventEmitted = true
	}

        var aliceBalanceAfter = await web3.eth.getBalance(alice)
        var a = add(aliceBalanceBefore, amount)
        console.log(a)
        var bobBalanceAfter = await web3.eth.getBalance(bob)

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(result[3].toString(10), 1, 'the state of the item should be "Sold", which should be declared second in the State Enum')
        assert.equal(result[5], bob, 'the buyer address should be set bob when he purchases an item')
        assert.equal(eventEmitted, true, 'adding an item should emit a Sold event')
        assert.equal(parseInt(aliceBalanceAfter), add(aliceBalanceBefore , price), "alice's balance should be increased by the price of the item")
        assert.isBelow(parseInt(bobBalanceAfter), parseInt(bobBalanceBefore, 10) - parseInt(price, 10), "bob's balance should be reduced by more than the price of the item (including gas costs)")
    })

    it("should allow the seller to mark the item as shipped", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false

        const tx = await supplyChain.shipItem(sku, {from: alice})
	
	if (tx.logs[0].event) {
		sku = tx.logs[0].args.sku.toString(10)
		eventEmitted = true
	}

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(eventEmitted, true, 'adding an item should emit a Shipped event')
        assert.equal(result[3].toString(10), 2, 'the state of the item should be "Shipped", which should be declared third in the State Enum')
    })

    it("should allow the buyer to mark the item as received", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false

        const tx = await supplyChain.receiveItem(sku, {from: bob})
	
	if (tx.logs[0].event) {
		sku = tx.logs[0].args.sku.toString(10)
		eventEmitted = true
	}

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(eventEmitted, true, 'adding an item should emit a Shipped event')
        assert.equal(result[3].toString(10), 3, 'the state of the item should be "Received", which should be declared fourth in the State Enum')
    })

});
//Big number addition when it exceeds max allowed int value in js
function add(str1, str2) {

    let sum = "";  // our result will be stored in a string.

    // we'll need these in the program many times.
    let str1Length = str1.length;
    let str2Length = str2.length;

    // if s2 is longer than s1, swap them.
    if(str2Length > str1Length ){
        let temp = str2;
        str2 = str1;
        str1 = temp;
    }

    let carry = 0;  // number that is carried to next decimal place, initially zero.
    let a;
    let b;
    let temp;
    let digitSum;
    for (let i = 0; i < str1.length; i++) {
        a = parseInt(str1.charAt(str1.length - 1 - i));      // get ith digit of str1 from right, we store it in a
        b = parseInt(str2.charAt(str2.length - 1 - i));      // get ith digit of str2 from right, we store it in b
        b = (b) ? b : 0;                                    // make sure b is a number, (this is useful in case, str2 is shorter than str1
        temp = (carry + a + b).toString();                  // add a and b along with carry, store it in a temp string.
        digitSum = temp.charAt(temp.length - 1);            //
        carry = parseInt(temp.substr(0, temp.length - 1));  // split the string into carry and digitSum ( least significant digit of abSum.
        carry = (carry) ? carry : 0;                        // if carry is not number, make it zero.

        sum = (i === str1.length - 1) ? temp + sum : digitSum + sum;  // append digitSum to 'sum'. If we reach leftmost digit, append abSum which includes carry too.

    }
    return sum;     // return sum

}
