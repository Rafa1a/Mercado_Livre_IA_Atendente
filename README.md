# Projeto - Integração IA Gemini com Mercado Livre

Este é um projeto que foi desenvolvido para a empresa Allnec, e agora está sendo disponibilizado para que outras pessoas possam implementar soluções semelhantes. O projeto é um backend em Node.js, utilizando Google Cloud Functions, que integra mensagens de clientes no Mercado Livre com uma IA (Gemini) para responder perguntas sobre produtos.

## Considerações sobre Escalabilidade

**Escalabilidade:** Este projeto é recomendado para empresas que possuam menos de 10 a 15 produtos ou quando esses produtos são complexos e exigem documentação detalhada para que a IA possa responder corretamente. No caso da empresa para a qual prestei o serviço, não há necessidade de escalabilidade, pois ela possui apenas 8 produtos que exigem resposta complexas e documentação detalhada.

Caso seja necessário escalar o projeto para uma empresa com um catálogo maior, e os produtos forem mais simples (como roupas, batons, etc.), recomenda-se utilizar a API do Mercado Livre para obter a descrição dos produtos diretamente do anúncio, de modo a compor as respostas da IA de maneira eficiente. Consulte a documentação em: [Itens e Buscas](https://developers.mercadolivre.com.br/pt_br/itens-e-buscas) e faça as alterações necessárias no código.

## Como Obter a API Key do Gemini

Para obter a API key do Gemini, siga os seguintes passos:

1. Acesse o Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/).
2. Crie a chave em "Get API Key". O site fornecerá instruções detalhadas sobre como proceder.

## Pré-requisitos

1. Ativar o Google Firestore e Google Cloud Functions no Google Cloud Platform (GCP).
2. Seguir a documentação do Mercado Livre para criar uma conta de desenvolvedor e obter as credenciais necessárias: [Guia Crie uma aplicação no Mercado Livre](https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre).
3. Acessar o Google AI Studio e obter a API key do Gemini.
4. Obter uma chave de senha de e-mail para enviar notificações por e-mail (opcional, é possível escolher outra forma de notificar).

## Configuração de Variáveis de Ambiente

Configurar as variáveis de ambiente no Cloud Run Functions com os seguintes nomes:

```env
# Para envio de e-mail:
EMAIL_USER=EMAIL_USER
EMAIL_PASSWORD=EMAIL_PASSWORD

# Gemini:
API_KEY=API_KEY

# Mercado Livre:
CLIENT_ID=CLIENT_ID
CLIENT_SECRET=CLIENT_SECRET
REDIRECT_URI=REDIRECT_URI
```

Preencher cada variável corretamente com os dados obtidos anteriormente.

## Instalação de Dependências

No arquivo `package.json`, certifique-se de que as seguintes dependências estejam instaladas:

```json
{
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "firebase-admin": "^9.0.0",
    "axios": "^1.4.0",
    "@google-cloud/storage": "^6.10.0",
    "form-data": "^4.0.0",
    "@google-cloud/vertexai": "^0.4.0",
    "@google/generative-ai": "^0.11.4",
    "nodemailer": "*"
  }
}
```

## Funções Principais

O arquivo `servidor.js` contém a função principal que lida com as notificações do Mercado Livre. Abaixo estão as funções principais implementadas:

- **contarLetras**: Conta o número de caracteres da resposta da IA para garantir que não ultrapasse o limite de 2000 caracteres permitido pelo Mercado Livre.
- **Enviar\_Resposta**: Verifica a quantidade de caracteres da resposta da IA. Caso exceda o limite, a função envia o texto para a IA Gemini resumir. Caso esteja dentro do limite, a resposta é enviada diretamente e salva no banco de dados para manter o histórico da conversa.
- **sendEmail**: Envia um e-mail de notificação ao funcionário da empresa com a pergunta e a resposta gerada pela IA.
- **salvar\_pergunta\_resposta**: Chamada dentro da função Enviar\_Resposta para salvar as perguntas e respostas no banco de dados.

O fluxo verifica se existe um token (`code`) no banco de dados. Caso não exista, chama a função `permissao` para fazer a primeira autenticação. Caso já exista, verifica o ID da pergunta e, se ela ainda não foi respondida, inicia o processo de resposta. A função `refresh` é usada para atualizar o token do Mercado Livre a cada requisição.

## Funções Auxiliares

As funções auxiliares precisam ser adicionadas ao projeto dentro do Cloud Functions, cada uma em seu próprio arquivo:


- **`permissao.js`**: Lida com a autenticação inicial e salva o token no banco de dados.
- **`refresh.js`**: Atualiza o token do Mercado Livre a cada requisição.
- **`gemini.js`**: Contém as funções para criar respostas da IA. São duas funções principais: `gemini` (chat da IA para responder perguntas) e `gemini_g` (IA para resumir respostas que excedem o limite de caracteres).

## Interface do Sistema

O sistema utiliza as seguintes coleções no Firestore (os nomes fornecidos são apenas exemplos, e podem ser alterados conforme necessário):

### Coleção `seu_bd`

```json
{
  "seu_bd": {
    "code_tokens": {
      "access_token": "string",
      "code": "string"
    },
    "questions": "string[]", // IDs das perguntas
    "users": {
      "useris_id": {
        "chavedouser_id": [
          {
            "input": "string", // pergunta
            "output": "string" // resposta
          }
        ]
      }
    } // Histórico dos usuários
  }
}
```

### Coleção `seu_bd_ia_users`

```json
{
  "seu_bd_ia_users": {
    "prompts": {
      "nome_do_anuncio": {
        "ia": "string", // Qual IA Gemini utilizar
        "temperatura": "number", // De 0 a 1
        "prompt_doc": [
          {
            "title": "string",
            "content": "string"
          }
        ], // Documentações
        "prompt_perg": [
          {
            "title": "string",
            "content": "string"
          }
        ] // Exemplos de perguntas e respostas
      }
    }
  }
}
```

## Conclusão

Este projeto oferece uma solução integrada de atendimento automático usando IA para responder perguntas de clientes no Mercado Livre, fornecendo contexto suficiente com base nas informações do produto e da empresa. Sinta-se à vontade para adaptar e escalar conforme suas necessidades.

