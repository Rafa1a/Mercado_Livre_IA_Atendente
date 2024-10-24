const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
//   const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.API_KEY;
exports.gemini = async (prompt_base,texto,inputsandoutputs, model_name, temperatura) => {
  const MODEL_NAME = model_name? model_name.replace('models/', '') : "gemini-1.5-flash"
  const genAI = new GoogleGenerativeAI(API_KEY);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME ,
    systemInstruction: prompt_base,
    }); 

  console.log('MODEL_NAME',MODEL_NAME)
  console.log('temperatura',temperatura)
  
  const generationConfig = {
    temperature: temperatura || 0.5,
    topK: 64,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];
  // input e outputs anteriores []
  //estrutra do history = [{"role":"user","parts":[{"text":"textouser"}]},{"role":"model","parts":[{"text":"textomodel"}]}] transformar o input e output no history : 
  console.log('inputsandoutputs',inputsandoutputs)
  const historys = inputsandoutputs? inputsandoutputs.flatMap(io => [{role:"user",parts:[{text:io.input}]},{role:"model",parts:[{text:io.output}]}]) : [];

  console.log('historys',historys);
  // console.log(prompt_base);
  // console.log(texto);
  const chatSession = model.startChat({
      generationConfig,
      safetySettings: safetySettings,
      history: historys,
  });

  const result = await chatSession.sendMessage(texto);
  console.log(result.response.text());
  return result.response.text()
}
exports.gemini_g = async (prompt_base,texto) => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const generationConfig = {
      temperature: 0.6,
      topK: 64,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
  
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    const parts = [
      {text: prompt_base},
      {text: `input: ${texto}`},
      {text: "output: "},
    ];
      console.log(parts);
    // console.log(prompt_base);
    // console.log(texto);
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });
  
    const response = result.response;
    console.log(response.text());
    return response.text();
  
}