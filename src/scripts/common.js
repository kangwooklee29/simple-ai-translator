import {Messages} from "./messages.js";
import {AnswerStream} from "./answer_stream.js";

export {whisper_api, chatgpt_api, answer_stream, messages};

var answer_stream = new AnswerStream();
var messages = new Messages();

async function whisper_api(file) {
    var formData = new FormData();
    formData.append('model', 'whisper-1');
    formData.append('file', file);
    if (document.querySelector("#source_language").value !== "auto")
        formData.append('language', document.querySelector("#source_language").value);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("API_KEY")}`
        },
        body: formData
    });
    if (response.status === 400) return "";
    return await response.json();
}

async function chatgpt_api(messages) {
    const api_url = "https://api.openai.com/v1/chat/completions";
    const param = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("API_KEY")}`
        },
        body: JSON.stringify({model: "gpt-3.5-turbo", messages: messages, stream: true})
    };
    const response = await fetch(api_url, param).then(async response => {
        const reader = response.body.getReader();
        let buffer = '';

        return await reader.read().then(async function processResult(result) {
            if (answer_stream.signal) return "";
            buffer += new TextDecoder('utf-8').decode(result.value || new Uint8Array());
              
            var messages = buffer.split('\n\n')
            buffer = messages.pop();
            if (messages.length === 0) {
                answer_stream.end();
                return answer_stream.now_answer;
            }
  
            for (var message of messages)
               if (message.includes("data: ") && message.includes("[DONE]") === false) {
                   answer_stream.start();
                   const val = JSON.parse(message.replace("data: ", ""));
                   if (val.choices[0].delta.content)
                       await answer_stream.add_answer(val.choices[0].delta.content);
               }
            
            return await reader.read().then(processResult);
        });
    });
}
