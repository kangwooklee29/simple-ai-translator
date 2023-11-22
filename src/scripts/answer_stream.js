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
            document.querySelector("div.api_status").innerHTML = `Generating...`;
        }
    }

    findPropertyValue(jsonString, propertyName) {
        var match = new RegExp('"' + propertyName + '"\\s*:\\s*"([^"]*)"').exec(jsonString);
        return match ? match[1] : "";
    }

    async add_answer(answer_generated) {
        this.now_answer += answer_generated;
        const val_result = this.findPropertyValue(this.now_answer + `"`, "result");
        document.querySelector(`#translate_result`).innerText = val_result;
        const val_pronun = this.findPropertyValue(this.now_answer + `"`, "pronunciation");
        document.querySelector(`#pronunciation`).innerText = val_pronun;
    }
    
    end() {
        this.now_streaming = false;
        document.querySelector("div.api_status").innerHTML = ``;
    }
}
