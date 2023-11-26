import {textContents, user_lang, run_tts} from "./common.js";

export class AnswerStream {
    constructor() {
        this.now_streaming = false;
        this.now_answer = "";
        this.result = "";
        this.pronounciation = "";
        this.mode_history = new Set();
        this.current_mode = "";
    }
    
    start() {
        if (this.now_streaming === false) {
            this.now_answer = "";
            this.result = "";
            this.pronounciation = "";
            this.mode_history = new Set();
            this.current_mode = "";
            this.now_streaming = true;
            document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["generating"]}...`;
        }
    }

    findPropertyValue(jsonString, propertyName) {
        var match = new RegExp('"' + propertyName + '"\\s*:\\s*"([^"]*)"').exec(jsonString);
        return match ? match[1] : "";
    }

    async add_answer(answer_generated, is_verifying) {
        this.now_answer += answer_generated;

        if (this.findPropertyValue(this.now_answer, "result") && !document.querySelector("#tts").disabled && !is_verifying && JSON.parse(localStorage.getItem("check_tts"))) {
            run_tts();
        }

        const val_result = this.findPropertyValue(this.now_answer + `"`, "result");
        if (!is_verifying) {
            document.querySelector(`#translate_result`).innerText = val_result;
            const val_pronun = this.findPropertyValue(this.now_answer + `"`, "pronunciation");
            document.querySelector(`#pronunciation`).innerText = val_pronun;
        } else {
            document.querySelector(`#verify_result`).innerText = val_result;
        }
    }
    
    end() {
        this.now_streaming = false;
        document.querySelector("div.api_status").innerHTML = ``;
        document.querySelector("textarea.record_script").disabled = false;
        document.querySelector("div.record_button button").disabled = false;
    }
}
