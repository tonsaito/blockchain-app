const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Blockchain = require('./blockchain');
const uuid = require('uuid');
const { restart } = require('nodemon');

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

app.listen(8080, function(){
    console.log('Listening on port 8080...')
});
