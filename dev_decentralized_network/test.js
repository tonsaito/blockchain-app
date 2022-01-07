const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();
const previousBlockHash = '3213DDASDSA12';
const currentBlockData = [
    {
        amount: 101,
        sender: 'ALEX015DSTESAE',
        recipient: 'JENN0312DASD'
    }
]


console.log(bitcoin.chain);