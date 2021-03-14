const extractEntity = (data, entity) => {
  if (entity === 'intent') {

    console.log("data.message.nlp :", data.message.nlp);
    var intent=null;
    data.message.nlp.intents.forEach(p=>{
      if (p.confidence>=0.8)
        intent=p.name
    });
    return intent;

  } else {
    for (let val in data.message.nlp.entities){
      if(data.message.nlp.entities[val][0].name === entity){
        //you change the confidence level (0.59) and put the one you want
        if (data.message.nlp.entities[val][0].confidence >= 0.59){
          return data.message.nlp.entities[val][0].value;
	      } 
        else{
          return null;
        }
      }
    }
    return null;
  }
}

const request = require('request');

const getMovieData = (movie, releaseYear = null) =>{
	return new Promise((resolve, reject) =>{
    request(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.API_KEY}&query=${movie}&primary_release_year=${releaseYear}`, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      const id = body.results[0].id;
      const title = body.results[0].title;
      const overview = body.results[0].overview;
      const release_date = body.results[0].release_date;
      const poster_path = `https://www.themoviedb.org/t/p/w600_and_h900_bestv2${body.results[0].poster_path}`;
      const infos = {
        'id':id,
        'title':title,
        'overview':overview,
        'release_date': release_date,
        'poster_path':poster_path
      };
      resolve(infos);
    });
	});
}

const getDirector = (id) =>{
	return new Promise((resolve, reject) =>{
    request(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${process.env.API_KEY}`, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      for (var i = 0; i < body.crew.length; i++){
        if (body.crew[i].job === 'Director') {
          resolve(body.crew[i].name);
        }
      }
    });
	});
}

module.exports = nlpData => {
	return new Promise(async function(resolve, reject) {
		let intent = extractEntity(nlpData, 'intent');
    if (intent) {
      let movie = extractEntity(nlpData, 'movie');
      let releaseYear = extractEntity(nlpData, 'year');
      try {
        let movieData = await getMovieData(movie, releaseYear);
        if (intent === 'director') {
          let movieDirector = await getDirector(movieData.id);
          resolve(movieDirector);
        }
        else {
          resolve(movieData);
        }
      } catch(error){
        reject(error);
      }
    }
    else {
      resolve({
        txt: "I'm not sure I understood what you ment !"
      });
    }
	});
}