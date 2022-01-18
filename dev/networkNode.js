const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Blockchain = require('./blockchain');
const uuid = require('uuid');
const rp = require('request-promise');
const port = process.argv[2];
const { restart } = require('nodemon');
const { json } = require('body-parser');
const { get } = require('request-promise');

const nodeAddress = uuid.v1().split('-').join('');

const blockchain = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/blockchain', function(req, res){
    res.send(blockchain);
});

//create a new transaction
app.post('/transaction', function(req, res){
    const newTransaction = req.body;
    const blockIndex = blockchain.addTransactiontoPendingTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}`});
});

//create a new transaction and broadcast to the network
app.post('/transaction/broadcast', function(req, res){
    const newTransaction = blockchain.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    blockchain.addTransactiontoPendingTransactions(newTransaction);

    const requestPromises = [];
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl+'/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        res.json({ note: 'Transaction created and broadcast successfully.'});
    });
});

app.get('/mine', function(req, res){
    const lastBlock = blockchain.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: lastBlock['index'] + 1
    }
    const nonce = blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);

    const newBlock = blockchain.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    //send new block to the network
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    //reward for the miner after broadcast the new block
    Promise.all(requestPromises)
    .then(data => {
        const requestOptions = {
            uri: blockchain.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 12.5,
                sender: '00',
                recipient: nodeAddress
            },
            json: true
        };
        return rp(requestOptions);
    })
    .then(data => {
        res.json({
            note: "New block mined & broadcast successfully!",
            block: newBlock
        });
    });
});

app.post('/receive-new-block', function(req, res){
    const newBlock = req.body.newBlock;
    const lastBlock = blockchain.getLastBlock();
    const hasCorrectLastBlock = lastBlock.hash === newBlock.previousBlockHash;
    const hasCorrectIndex = lastBlock['index'] +1 === newBlock['index'];

    if(hasCorrectLastBlock && hasCorrectIndex){
        blockchain.chain.push(newBlock);
        blockchain.pendingTransactions = [];
        res.json({ 
            note: 'New block received and accepted.',
            newBlock: newBlock    
        });
    } else{
        res.json({ 
            note: 'New block rejected',
            newBlock: newBlock    
        });
    }
});

//register a node and broadcast it the network
app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    if(blockchain.networkNodes.indexOf(newNodeUrl) == -1){
        blockchain.networkNodes.push(newNodeUrl);
    }
    const requestPromises = [];
    blockchain.networkNodes.forEach(networkNodeUrl => {

        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        }
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: { allNetworkNodes: [ ...blockchain.networkNodes, blockchain.currentNodeUrl]},
            json: true
        }
        return rp(bulkRegisterOptions);
    }).then(data => {
        res.json({ note: 'New Node registered successfully!'});
    });
});

//register a node with the network
app.post('/register-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = blockchain.networkNodes.indexOf(newNodeUrl) == -1;
    const nodeNotCurrentNode = blockchain.currentNodeUrl !== newNodeUrl;
    if(nodeNotAlreadyPresent && nodeNotCurrentNode) {
        blockchain.networkNodes.push(newNodeUrl);
        res.json({ note: 'New node registered successfully.'});
    } else{
        res.json({ note: 'Node already exists.'});
    }
});

//register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res){
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = blockchain.networkNodes.indexOf(networkNodeUrl) == -1;
        const nodeNotCurrentNode = blockchain.currentNodeUrl !== networkNodeUrl;
        if(nodeNotAlreadyPresent && nodeNotCurrentNode){
            blockchain.networkNodes.push(networkNodeUrl);
        }
    });
    res.json({ note: 'Bulk registration successful'});
});

app.get('/consensus', function(req, res){
    const requestPromises = [];
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(blockchainList => {
        const currentChainLength = blockchain.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;
        blockchainList.forEach(blockchainItem => {
            if(blockchainItem.chain.length > maxChainLength){
                maxChainLength = blockchainItem.chain.length;
                newLongestChain = blockchainItem.chain;
                newPendingTransactions = blockchainItem.pendingTransactions;
            }
        });

        if(!newLongestChain || (newLongestChain && !blockchain.chainIsValid(newLongestChain))){
            res.json({
                note: 'Current chain has not been replaced.',
                chain: blockchain.chain
            });
        } else{
            blockchain.chain = newLongestChain;
            blockchain.pendingTransactions = newPendingTransactions;
            res.json({
                note: 'This chain has been updated!',
                chain: blockchain.chain
            });
        }
    });
});

app.get('/block/:blockHash', function(req, res){
    const blockHash = req.params.blockHash;
    res.json({
        block: blockchain.getBlock(blockHash)
    }); 
});

app.get('/transaction/:transactionId', function(req, res){
    const transactionId = req.params.transactionId;
    const transactionData = blockchain.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    })
});

app.get('/address/:address', function(req, res){
    const address = req.params.address;
    const addressData = blockchain.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

app.get('/block-explorer', function(req, res){
    res.sendFile('./block-explorer/index.html', { root: __dirname});
});


app.listen(port, function(){
    console.log(`Listening on port ${port}...`)
});
