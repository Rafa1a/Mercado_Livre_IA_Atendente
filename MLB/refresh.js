const axios = require('axios');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

exports.refresh = async (req, res, admin) => {
  const docRef = admin.firestore().collection('seu_bd').doc('code_tokens');
  const getdoc = await docRef.get();
       
  const dados = getdoc.data();
    
  const code = dados.code;
 
  const data_ = {
    "grant_type": 'refresh_token',
    "client_id": clientId,
    "client_secret": clientSecret,
    "refresh_token": code,
  };
  const headers = {
    "accept" : "application/json",
    "content-type": "application/x-www-form-urlencoded",
  }
  
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', data_, {headers: headers});
    const resultado = response.data;

    const data = {
      code: resultado.refresh_token,
      access_token: resultado.access_token  
    };
      
    await docRef.set(data);

    console.log('Access Token:', resultado.access_token);
    console.log('Code:', resultado.refresh_token);

    return {
      access_token: resultado.access_token,
      code: resultado.refresh_token
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};
