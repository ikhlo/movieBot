'use strict';

require('dotenv').config();
const express = require('express');
const bodyparser = require('body-parser');
const config = require('./config');
const FBeamer = require('./fbeamer');
const tmdb = require('./tmdb');

const f = new FBeamer(config.FB);

const server = express();
const PORT = process.env.PORT || 3000;

var hi_list = ['hello ','hi ','bonjour ','hola '];
var when = ['released','published', ' date '];

server.post('/', bodyparser.json({
  verify: f.verifySignature.call(f)
}));


server.get('/', (req, res) => f.registerHook(req, res));

server.listen(PORT, () => console.log(`The bot server is running on port ${PORT}`));

server.post('/', (req, res, next) => {
  return f.incoming(req, res, async data =>{
    try{
      var infos = "- To use me, you can ask for general informations about a movie like the following : 'tell me about (your movie)' \n- If you want to know who directed a movie, just ask me : 'who directed (your movie) ?' \n- Finally, if you want to know when your movie was published, ask me : 'when was (your movie) published ?' \n";

      if (hi_list.some(sub=>data.message.text.includes(sub))){
        await f.txt(data.sender.id, 'Hello ! Ask me a question about a movie you like :D');
        await f.txt(data.sender.id, infos);
      }
      //our little easter egg
      else if (data.message.text === 'sten'){
        await f.img(data.sender.id, 'https://i.ytimg.com/vi/HqeGgtSlJyo/maxresdefault.jpg');
      }
      else {
        var nlp_result = await tmdb(data);
        //console.log(nlp_result);

        if (when.some(sub => data.message.text.includes(sub))){
          var response = `Here is the release date of ${nlp_result.title} : ${nlp_result.release_date}`;
          await f.txt(data.sender.id, response);
          await f.img(data.sender.id, nlp_result.poster_path);
        }
        else if (nlp_result.id) {
          var sendback = `Here are the infos for your movie : \nMovie id: ${nlp_result.id}\nTitle: ${nlp_result.title}\nOverview: ${nlp_result.overview}\nDate of release: ${nlp_result.release_date}\n`;
          
          await f.txt(data.sender.id, sendback);
          await f.img(data.sender.id, nlp_result.poster_path);
        }
        else if (nlp_result != "[object Object]"){
          var response = `The director of this movie is ${nlp_result}`;
          await f.txt(data.sender.id, response);
        }
        else {
          var response = "sorry I'm a bit lost... Try with something else !";
          await f.txt(data.sender.id, response);
          await f.txt(data.sender.id, infos);
        }
      }
      

    }
    catch(e){
      console.log(e);
    }
  });
});