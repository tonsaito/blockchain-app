const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

const bc1 = {
    "chain": [
        {
            "index": 1,
            "timestamp": 1640895943335,
            "transactions": [],
            "nonce": 100,
            "hash": "0",
            "previousBlockHash": "0"
        },
        {
            "index": 2,
            "timestamp": 1640895958487,
            "transactions": [
                {
                    "amount": 10,
                    "sender": "ALEX015DSTESAE",
                    "recipient": "JENN0312DASD",
                    "transactionId": "abb737a069ae11eca8ad47b0244baecd"
                },
                {
                    "amount": 20,
                    "sender": "ALEX015DSTESAE",
                    "recipient": "JENN0312DASD",
                    "transactionId": "ad9bd62069ae11eca8ad47b0244baecd"
                },
                {
                    "amount": 30,
                    "sender": "ALEX015DSTESAE",
                    "recipient": "JENN0312DASD",
                    "transactionId": "af49ad3069ae11eca8ad47b0244baecd"
                }
            ],
            "nonce": 9674,
            "hash": "00006e0e26feaefabfe0ce75a9ff41c455e57fe4bf31a8ef711be7a0c8e04bf7",
            "previousBlockHash": "0"
        },
        {
            "index": 3,
            "timestamp": 1640895973824,
            "transactions": [
                {
                    "amount": 12.5,
                    "sender": "00",
                    "recipient": "a9a9b46069ae11eca8ad47b0244baecd",
                    "transactionId": "b2b44f7069ae11eca8ad47b0244baecd"
                },
                {
                    "amount": 40,
                    "sender": "ALEX015DSTESAE",
                    "recipient": "JENN0312DASD",
                    "transactionId": "b642cd6069ae11eca8ad47b0244baecd"
                },
                {
                    "amount": 50,
                    "sender": "ALEX015DSTESAE",
                    "recipient": "JENN0312DASD",
                    "transactionId": "b7ef6bf069ae11eca8ad47b0244baecd"
                },
                {
                    "amount": 60,
                    "sender": "ALEX015DSTESAE",
                    "recipient": "JENN0312DASD",
                    "transactionId": "b986d4d069ae11eca8ad47b0244baecd"
                }
            ],
            "nonce": 22487,
            "hash": "00006e9dd37fed8b97c7d8a94c092c73b88b86e78fe3495eed1b7e8be4b7a7b2",
            "previousBlockHash": "00006e0e26feaefabfe0ce75a9ff41c455e57fe4bf31a8ef711be7a0c8e04bf7"
        }
    ],
    "pendingTransactions": [
        {
            "amount": 12.5,
            "sender": "00",
            "recipient": "a9a9b46069ae11eca8ad47b0244baecd",
            "transactionId": "bbd6df5069ae11eca8ad47b0244baecd"
        }
    ],
    "currentNodeUrl": "http://localhost:3000",
    "networkNodes": []
};


console.log("IS VALID: "+bitcoin.chainIsValid(bc1.chain));