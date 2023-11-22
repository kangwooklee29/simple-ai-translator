import { chatgpt_api, language_dict } from "./common.js";

export class Messages{
    constructor() {
    }

    async send_chatgpt(content, model) {
        document.querySelector("div.api_status").innerHTML = `Waiting for response...`;
        document.querySelector("#translate_result").innerHTML = '';
        document.querySelector("#pronunciation").innerHTML = '';

        const target_language = document.querySelector("#target_language").value;
        const prompt = [
            {role: "user", content: ""}, 
            {role: "user", content: `Translate this text into ${language_dict[target_language].English} and write a JSON message containing the result in the 'result' property. Also, include a 'pronunciation' property in the JSON message and express the pronunciation of the translated result in English alphabet: "${content}"`}
        ];
        await chatgpt_api(prompt, model);
    }
}
