const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Blockchain = require('./blockchain');
const uuid = require('uuid');
const rp = require('request-promise');
const port = process.argv[2];
const { restart } = require('nodemon');
const { json } = require('body-parser');

const nodeAddress = uuid.v1().split('-').join('');

const blockchain = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/blockchain', function(req, res){
    res.send(blockchain);
});

app.post('/transaction', function(req, res){
    const blockIndex = blockchain.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({note: `Transaction will be added in block ${blockIndex}`});
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

    //reward for the miner
    blockchain.createNewTransaction(12.5, "00", nodeAddress);

    const newBlock = blockchain.createNewBlock(nonce, previousBlockHash, blockHash);
    res.json({
        note: "New block has been mined successfully!",
        block: newBlock
    });
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
})


app.listen(port, function(){
    console.log(`Listening on port ${port}...`)
});
