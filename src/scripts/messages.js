import { chatgpt_api } from "./common.js";

export class Messages{
    constructor() {
    }

    async send_chatgpt(content) {
        console.log(localStorage.getItem("target_language"), content);
        await chatgpt_api([
            {role:"user", content:""}, 
            {role: "user", content: `Translate this text into ${localStorage.getItem("target_language")}: "${content}"`}]);
    }
}
