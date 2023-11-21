import { chatgpt_api, language_dict } from "./common.js";

export class Messages{
    constructor() {
    }

    async send_chatgpt(content, model) {
        document.querySelector("#translate_result").innerHTML = '';
        document.querySelector("#pronunciation").innerHTML = '';

        const target_language = document.querySelector("#target_language").value;
        const prompt = [
            {role: "user", content: ""}, 
            {role: "user", content: `Translate this text into ${language_dict[target_language].English}: "${content}"`}
        ];
        console.log(prompt);

        prompt.push({role: "user", content: "Please write a JSON message that has the 'result' attribute and the 'pronunciation' attribute(the pronunciation of the translated result in English alphabet)."});

        await chatgpt_api(prompt, model);
    }
}
