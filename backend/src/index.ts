require("dotenv").config();

import express from 'express';
import { basePrompt as reactBasePrompt } from './defaults/react';
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { BASE_PROMPT } from './prompts';
const { GoogleGenerativeAI } = require("@google/generative-ai");
import { getSystemPrompt } from './prompts';
import cors from "cors";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: getSystemPrompt() });
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b", systemInstruction: "" });


const app = express();

app.use(express.json());
app.use(cors())

app.post("/template", async (req, res) => {
    
    console.log("Hitting Template Endpoint")

    try{
        const prompt = req.body.prompt;
        const metaPrompt = `Given the below prompt, return if the project has to be node or react. 
        Just return 'node' if it is node and 'react' if it is react. Don't return anything extra before or after. The prompt: ${prompt}`
    
        const result = await model.generateContent(metaPrompt);
    
        console.log(result);
    
        const answer = result.response.text().trim();
    
        console.log(`Answer: '${answer}'`);
    
        if(answer == "node"){
            res.json({
                prompt_ui: [nodeBasePrompt]
            })
            return;
        }
        if(answer == "react"){
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                prompt_ui: [reactBasePrompt]
            })
            return;
        }
    
        res.status(403).json({message: "Sorry!! Something is wrong with your prompt"})
        return;
    }catch(error){
        console.log(`Error Occured: ${error} `)
    }

})


app.post("/chat", async (req, res) => {

    const messages = req.body.messages;

    const result = await model.generateContent({
        contents: [
            messages
        ],
    }
    );
    const generatedText = result.response.text()
    console.log(generatedText)

    res.json({
        content: generatedText
    })
})
app.listen(3000, () => {
    console.log("App Running in PORT: 3000")
});











// async function main() {
//   const prompt = "Create a simple TODO App";
// //   const result = await model.generateContent(prompt);
// //   console.log(result.response.text());

//   const streamResult = await model.generateContentStream(prompt);

//   for await (const chunk of streamResult.stream) {
//     const chunkText = chunk.text();
//     // process.stdout.write(chunkText);
//     console.log(chunkText)
//   }
// }

// main();
