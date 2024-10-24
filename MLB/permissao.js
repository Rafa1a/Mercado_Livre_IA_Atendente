const axios = require('axios');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// Link de para confirmar Solicitar permissio do app ML:
const link = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}`

exports.permissao = async (req, res, admin) => {
  const docRef = admin.firestore().collection('seu_bd').doc('code_tokens');
  const code = req.query.code;

  const data = {
    "grant_type": 'authorization_code',
    "client_id": clientId,
    "client_secret": clientSecret,
    "code": code,
    "redirect_uri": process.env.REDIRECT_URI,
    
  };
  const headers = {
    "accept" : "application/json",
    "content-type": "application/x-www-form-urlencoded",
  }


  axios
    .post('https://api.mercadolibre.com/oauth/token', data,  {headers: headers})
    .then(async (response) => {

      const resultado = response.data;

      const data = {
        code: resultado.refresh_token,
        access_token: resultado.access_token  
      };
      
      await docRef.set(data);

      console.log('resultado:', [resultado]);
      console.log('Access Token:', resultado.access_token);
      console.log('Code:', resultado.refresh_token);

     
      
      res.status(200).send('Autorização concluída. Tudo Pronto para funcionar');
    })
    .catch((error) => {
      // console.error('Erro:', error);
      res.status(500).json(error);
    });
};
