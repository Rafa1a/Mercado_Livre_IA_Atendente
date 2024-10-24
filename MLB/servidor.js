const functions = require('@google-cloud/functions-framework');
const per = require('./permissao');
const ref = require('./refresh');
const admin = require('firebase-admin');
const ge= require('./gemini');
const axios = require('axios');
const prompts = require('./prompts');
const nodemailer = require('nodemailer');
admin.initializeApp();

functions.http('index', async (req, res) => {
    try {
        ////////////////Funcoes/////////////////////////////////////////////////////////////////////////////////////
        function contarLetras(texto) {
            // Remove espaços em branco e quebras de linha
            var textoSemEspacos = texto.replace(/\s/g, "");
            
            // Conta o número de letras na string sem espaços e quebras de linha
            var numLetras = textoSemEspacos.length;
            
            return numLetras;
        }

        const Enviar_Resposta = async (prompresumo, textgemini, question_id, token, numLetras, docRefQuestions, arrayquestions, user_id, question, anuncio,promptcorrecao) => {
            if (numLetras > 1950) {
                if(textgemini){
                    /////////////////Teste Axios Post questions/////////////////////////////////////////////////////////////////////////
                    try{
                        const responsesresumo = await ge.gemini_g(prompresumo,textgemini);
                        const correcao = await ge.gemini_g(promptcorrecao,responsesresumo);
                        console.log('entrou até aqui 5 gemini resumo')
                        const headerss = {
                            "content-type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                        const data = {
                            "question_id": question_id,
                            "text": correcao
                        }
                        await axios.post('https://api.mercadolibre.com/answers', data, { headers: headerss });
                        
                        arrayquestions.push(question_id);
                        await docRefQuestions.set({ questions: arrayquestions });
                        await salvar_pergunta_resposta(user_id, question, correcao, anuncio);
                        sendEmail(`Resposta feita pela IA`,`Pergunta: ${question}\nResposta: ${correcao}\nAnúncio: ${anuncio}\n`).catch(console.error);
                    }catch (error) {
                        console.error('Erro ao executar a função ml enviar:', error);
                    }
                }
            }else { 
                if(textgemini){
                    /////////////////Teste Axios Post questions/////////////////////////////////////////////////////////////////////////
                    try{
                        const correcao = await ge.gemini_g(promptcorrecao,textgemini);
                        const headerss = {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${token}`
                        }
                        const data = {
                            "question_id": question_id,
                            "text": correcao
                        }
                        await axios.post('https://api.mercadolibre.com/answers', data, { headers: headerss });

                        arrayquestions.push(question_id);
                        await docRefQuestions.set({ questions: arrayquestions });
                        await salvar_pergunta_resposta(user_id, question, correcao, anuncio);
                        sendEmail(`Resposta feita pela IA`,`Pergunta: ${question}\nResposta: ${correcao}\nAnúncio: ${anuncio}\n`).catch(console.error);

                    }catch (error) {
                        console.error('Erro ao executar a função ml enviar:', error);
                    }
                }
            }
        }
       
        ////////////////////////enviar email/////////////////////////////////////////////////////////////////////////////////////
        async function sendEmail(assunto,textoemail) {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER, // seu email
                    pass: process.env.EMAIL_PASSWORD // sua senha
                }
            });
    
            let info = await transporter.sendMail({
                from: '"IA MLB" <process.env.EMAIL_USER>', // remetente
                to: "email_destino@destino.com.br", // destinatário
                subject: assunto, // Assunto
                text: textoemail, // corpo do email
            });
            
            console.log("Email enviado: %s", info.messageId);
        }
        
        ////////////////Firebase/////////////////////////////////////////////////////////////////////////////////////
        
        //questions
        const docRefQuestions = admin.firestore().collection('seu_bd').doc('questions');
        const getdocQuestions = await docRefQuestions.get();
        const dadosQuestions = getdocQuestions.data();
        //users
        const docRefUsers = admin.firestore().collection('seu_bd').doc('users');
        const getdocUsers = await docRefUsers.get();
        const dadosUsers = getdocUsers.data();
        const users_id = dadosUsers && dadosUsers.users_id ? dadosUsers.users_id : {};
        // funcao para salvar pergunta e resposta do usuario
        const salvar_pergunta_resposta = async ( user_id, textoinput, textooutput, anuncio) => {
            const prompt_anuncio = `Esta pergunta foi feita no anúncio:${anuncio}\npergunta:${textoinput}`
            if (users_id[user_id]) {
                const arrayquestions = users_id[user_id];
                arrayquestions.push({input: prompt_anuncio, output: textooutput});
                users_id[user_id] = arrayquestions;
                await docRefUsers.set({ users_id: users_id });
            } else {
                const arrayquestions = [{input: prompt_anuncio, output: textooutput}];
                users_id[user_id] = arrayquestions;
                await docRefUsers.set({ users_id: users_id });
            }
        }
        //tokens
        const docReftokens = admin.firestore().collection('seu_bd').doc('code_tokens');
        const getdoctokens = await docReftokens.get();
        const dadostokens = getdoctokens.data();
        
        const code = dadostokens && dadostokens.code ? dadostokens.code : '';
    
        if (!code) {
            per.permissao(req, res, admin);
        } 
        else {
            if(req.body.topic === 'questions'){
                const question_id = req.body.resource.split('/')[2];
                const arrayquestions = dadosQuestions && dadosQuestions.questions ? dadosQuestions.questions : [];
                const includequestion_id = arrayquestions.includes(question_id);
                
                if (includequestion_id) {
                    res.status(200).send('ok')
                    } 
                else {
                    res.status(200).send('ok')

                    const resultado = await ref.refresh(req, res, admin);
                    const accessToken = resultado.access_token;
                    console.log('accessToken',accessToken)
                    /////////////////Testes axios Get questions//////////////////////////////////////////////////////////////////////
                    try {
                        const headers = {
                            "content-type": "application/json",
                            "Authorization": `Bearer ${accessToken}`}
                        const response = await axios.get(`https://api.mercadolibre.com${req.body.resource}`, { headers: headers });
                        const dadosquestionget = response.data;
                        console.log('dados da pergunta : ',dadosquestionget)
                        // pegar o nome do cliente
                        const user_id = dadosquestionget.from.id;
                        const responseuser = await axios.get(`https://api.mercadolibre.com/users/${user_id}`, { headers: headers });
                        const dadosuser = responseuser.data;
                        const name = dadosuser.nickname;
                        ///////////////BLOQUEIO///////////////////////////////////////////////////////////////////////////
                        //Verificação de bloqueio
                        const docRefbloqueio = admin.firestore().collection('mlb_s_ia').doc('users');
                        const getdocbloqueio = await docRefbloqueio.get();
                        const dadosbloqueio = getdocbloqueio.data();
                        const user_bloqueio = dadosbloqueio && dadosbloqueio[user_id] ? dadosbloqueio[user_id] : {};

                        console.log('dadosbloqueio', dadosbloqueio)
                        console.log('user_bloqueio', user_bloqueio)

                        if (user_bloqueio.bloqueio === true) {
                            console.log('bloqueado')
                            //adicionar no question 
                            // arrayquestions.push(question_id);
                            // await docRefQuestions.set({ questions: arrayquestions });
                            return;
                        };
                        
                        // resumo
                        const prompresumo = prompts.resumo();
                        //tpa2k sem
                        if(dadosquestionget.item_id === 'MLB1111111111111' ||  dadosquestionget.item_id === 'MLB222222222222'){
                            const docRefdados_gemini_prompts = admin.firestore().collection('seu_bd_ia_users').doc('prompts');
                            const getdocdados_gemini_prompts = await docRefdados_gemini_prompts.get();
                            const dadosdados_gemini_prompts = getdocdados_gemini_prompts.data();
                            const tpa2ksem_data = dadosdados_gemini_prompts && dadosdados_gemini_prompts.tpa2ksem? dadosdados_gemini_prompts.tpa2ksem:{}
                            console.log('tpa2ksem_data', tpa2ksem_data)

                            const textoquestion = dadosquestionget.text;

                            const prompttpa2ksem = prompts.tpa2ksem(tpa2ksem_data.prompt_doc,tpa2ksem_data.prompt_perg,name);
                            console.log('prompttpa2ksem', prompttpa2ksem)
                            // console.log('promptcompleto : ',prompttpa2ksem)

                            const responses = await ge.gemini(prompttpa2ksem,textoquestion,users_id[user_id], tpa2ksem_data.ia, tpa2ksem_data.temperatura);
                            // console.log('entrou até aqui 3 gemini')
                            
                            const numLetras = contarLetras(responses);
                            console.log('numLetras', numLetras)

                            const promptcorrecao = prompts.correcao(name);
                            const anuncio = 'tpa2k sem certificado';
                            Enviar_Resposta(prompresumo, responses, question_id, accessToken, numLetras, docRefQuestions, arrayquestions, user_id, textoquestion, anuncio, promptcorrecao);
                        }
                        //tpa2k com
                        else if(dadosquestionget.item_id === 'MLB3333333333333' ||  dadosquestionget.item_id === 'MLB4444444444444' ){
                            const docRefdados_gemini_prompts = admin.firestore().collection('seu_bd_ia_users').doc('prompts');
                            const getdocdados_gemini_prompts = await docRefdados_gemini_prompts.get();
                            const dadosdados_gemini_prompts = getdocdados_gemini_prompts.data();
                            const tpa2kcom_data = dadosdados_gemini_prompts && dadosdados_gemini_prompts.tpa2kcom? dadosdados_gemini_prompts.tpa2kcom:{}

                            const textoquestion = dadosquestionget.text;

                            const prompttpa2kcom = prompts.tpa2kcom( tpa2kcom_data.prompt_doc,tpa2kcom_data.prompt_perg,name);
                            console.log('tpa2kcom_data', prompttpa2kcom);

                            const responses = await ge.gemini(prompttpa2kcom,textoquestion,users_id[user_id], tpa2kcom_data.ia, tpa2kcom_data.temperatura);
                            
                            const numLetras = contarLetras(responses);

                            const promptcorrecao = prompts.correcao(name);
                            const anuncio = 'tpa2k com certificado';
                            Enviar_Resposta(prompresumo, responses, question_id, accessToken, numLetras, docRefQuestions, arrayquestions, user_id, textoquestion, anuncio, promptcorrecao);
                        }
                        
                    } catch (error) {
                        console.error('Erro ao executar a função responder:', error);
                    }
                } 

            }
            else {
                res.status(200).send('ok')
            }
        }
        
    } catch (error) {
        // ref.refresh(req, res, admin);
        // console.error('Erro ao executar a função:', error);
        res.status(500).send('Erro ao executar a função principal : '+ error);
    }
});
