const axios= require('axios');

const getLanguageById= (lang) => {
    const language= {
        "c++": 41, //54 in judge0
        "java": 62,
        "javascript": 102
    }
    return language[lang.toLowerCase()];
}

const submitBatch= async(submissions) => {
    
    const options = {
        method: 'POST',
        url: process.env.JUDGE0_URL,
        params: {base64_encoded: 'false'},
        headers: {
        'x-rapidapi-key': process.env.JUDGE0_RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.JUDGE0_HOST,
        'Content-Type': 'application/json'
        },
        data: {
            submissions
        }
    };

    async function fetchData() {
	    try {
		    const response = await axios.request(options);
		    return response.data;
	    } 
        catch (error) {
            console.error(error);
            // throw error;
            }
    }
    return await fetchData();
}

const waiting = async(timer)=> {
    setTimeout(()=> {
        return 1;
    },timer);
}

const submitToken = async(resultToken) => {

const options = {
  method: 'GET',
  url: process.env.JUDGE0_URL,
  params: {
    tokens: resultToken.join(","),
    base64_encoded: 'false',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_RAPIDAPI_KEY,
    'x-rapidapi-host': process.env.JUDGE0_HOST,
    // 'Content-Type': 'application/json'
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

while(true) {
    const result= await fetchData();

    const isResultObtained= result.submissions.every((r)=>r.status_id>2);
    if(isResultObtained) return result.submissions;
    await waiting(1000);
}
}

module.exports= {getLanguageById,submitBatch, submitToken};



