const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

async function genHashPassWord(inPassWord){
    try {
        const saltRound = bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(inPassWord, saltRound);
        return hashPassword;
    }
    catch(err){
        console.error('해시 오류 발생 : ', err);
    }
}

async function compareHashPassWord(inPassWord, hashPassword){
    try {
       const match = await bcrypt.compare(inPassWord, hashPassword);
       return match;
    }
    catch(err){
        console.error('해시 오류 발생 : ', err);
    }
}

module.exports = router;