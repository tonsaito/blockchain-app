const sha256 = require('sha256');
const uuid = require('uuid');
const currentNodeUrl = process.argv[3];

function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    //Genesis Block - a.k.a. First block
    this.createNewBlock(100, '0', '0');
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash){
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };
    
    this.pendingTransactions = [];
    this.chain.push(newBlock);
    
    return newBlock;
}

Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient){
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid.v1().split('-').join('')
    }

    return newTransaction;
}

Blockchain.prototype.addTransactiontoPendingTransactions = function(transactionObj){
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    return sha256(dataAsString);
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0,4) !== '0000'){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
}

//validate other chains inside the network
Blockchain.prototype.chainIsValid = function(blockchain){
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const corretPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const corretHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    //check if genesis block is correct
    if(!correctNonce || !corretPreviousBlockHash || !corretHash || !correctTransactions){
        return false;
    }

    for(var i=1; i < blockchain.length; i++){
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i-1];
        const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index']}, currentBlock['nonce']);
        //check proof of work
        if(blockHash.substring(0,4) !== '0000'){
            return false;
        }
        //check hashes
        if(currentBlock['previousBlockHash'] !== prevBlock['hash']){
            return false;
        }
    }


    return true;
};

Blockchain.prototype.getBlock = function(blockHash){
    let correctBlock = null;
    this.chain.forEach(block => {
        if(block.hash === blockHash){
            correctBlock = block;
        }
    });
    return correctBlock;
};

Blockchain.prototype.getTransaction = function(transactionId){
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.transactionId === transactionId){
                correctTransaction = transaction;
                correctBlock = block;
            }
        });
    });
    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};

Blockchain.prototype.getAddressData = function(address){
    const addressTransactions = [];
    let balance = 0;
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.sender === address){
                addressTransactions.push(transaction);
                balance -= transaction.amount;
            } else if(transaction.recipient === address){
                addressTransactions.push(transaction);
                balance += transaction.amount;
            }
        });
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance: balance
    }
};

module.exports = Blockchain;
