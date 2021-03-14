'use strict';

const request = require('request');
const apiVersion='v6.0';

class FBeamer {
  constructor({ pageAccessToken, VerifyToken, appSecret }) {
    try {
      this.pageAccessToken = pageAccessToken;
      this.VerifyToken = VerifyToken;
      this.appSecret = appSecret;
    }
    catch (error) {
      console.log('Big error');
    }
  }

  registerHook(req, res) {
    const params = req.query;
    const mode = params['hub.mode'],
      token = params['hub.verify_token'],
      challenge = params['hub.challenge'];
    try {
      if (mode === 'subscribe' && token === this.VerifyToken) {
        console.log('The webhook is registered');
        return res.send(challenge);
      }
      else {
        //console.log('Could not register webhook !');
        return res.sendStatus(200);
      }
    }
    catch (e) {
      console.log('error');
    }
  }

  verifySignature(req, res, buf) {
    const crypto = require('crypto');
    return (req, res, buf) => {
      if (req.method === 'POST') {
        try {
          //we create a randomly generated HEX code (7f048a900e9001ed0b5a6ea324cdbfe2), you can change it with your own code
          let tempo_hash = crypto.createHmac('sha1', '7f048a900e9001ed0b5a6ea324cdbfe2').update(buf, 'utf-8');
          let hash = tempo_hash.digest('hex');
        }
        catch (e) {
          console.log(e);
        }
      }
    }
  }

  messageHandler(obj) {
    let sender = obj.sender.id;
    let message = obj.message;
    if(message.text) {
      let temp = message.nlp; 
      var newobj = {
        sender,
        type: 'text',
        content: message.text
      }
    }
    return newobj;
  }

  incoming(req, res, cb) {
    res.sendStatus(200);
    if(req.body.object === 'page' && req.body.entry) {
      let data = req.body;
      data.entry.forEach(obj=> {
        obj.messaging.forEach(elm => {
          if (obj.messaging.postback) {
            //handle postbacks
          }
          else {
            return cb(elm);
          }
        });
      });
    }
  }

  sendMessage(payload){
    return new Promise((resolve, reject)=>{
      request({
        uri:`https://graph.facebook.com/${apiVersion}/me/messages`,
        qs:{
          access_token: this.pageAccessToken
        },
        method:'POST',
        json:payload
      }, (error, response, body)=>{
        if(!error && response.statusCode === 200){
          resolve({
            mid:body.message_id
          });
        }else{
          reject(error);
        }
      });
    });
  }
  
  txt(id, text, messaging_type='RESPONSE'){

    let obj = {
      messaging_type,
      recipient:{
        id
      },
      message:{
        text
      }
    }
    console.log('sending :',obj);
    return this.sendMessage(obj);
  }

  img(id, url, messaging_type='RESPONSE'){
    let obj = {
      messaging_type,
      recipient:{
        id
      },
      message:{
        attachment:{
          type:'image',
          payload:{
            url,
            is_reusable: true
          }
        }
      }
    }
    return this.sendMessage(obj);
  }
}

module.exports = FBeamer;