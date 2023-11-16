import { chatgpt_api, language_dict } from "./common.js";

export class Messages{
    constructor() {
    }

    async send_chatgpt(content) {
        console.log(localStorage.getItem("target_language"), content);
        const target_language = localStorage.getItem("target_language");
        const prompt = [
            {role:"user", content:""}, 
            {role: "user", content: `Translate this text into ${language_dict[target_language].English}: "${content}"`}
        ];

        if (target_language !== "English")
            prompt.push({role: "user", content: "Please write the pronunciation of the translated result in English alphabet after writing it."});

        await chatgpt_api(prompt);
    }
}
