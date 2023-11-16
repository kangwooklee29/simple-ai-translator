export class AnswerStream {
    constructor() {
        this.now_streaming = false;
        this.now_answer = "";
        this.answer_set = "";
    }
    
    start() {
        if (this.now_streaming === false) {
            this.answer_set = "";
            this.now_answer = "";
            this.now_streaming = true;
        }
    }
    
    async add_answer(answer_generated) {
        this.answer_set += answer_generated;
        document.querySelector("div.answer").innerText = this.answer_set;
        this.now_answer += answer_generated;
    }
    
    end() {
        this.now_streaming = false;
    }
}
