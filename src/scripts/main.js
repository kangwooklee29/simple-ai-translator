import {whisper_api, answer_stream, messages} from './common.js';

let mediaRecorder = null, chunks = [];

async function start_recording() {
    if (!mediaRecorder || mediaRecorder.state === "recording") return;

    document.querySelector("div.api_status").innerHTML = "Recording...";

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    answer_stream.signal = true;
      
    mediaRecorder = new MediaRecorder(stream, {type: 'audio/webm'});
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
  
    mediaRecorder.onstop = async () => {
        var blob = new Blob(chunks, { 'type' : 'audio/webm' });
        var file = new File([blob], "audio.webm", { type: "audio/webm;" });
        chunks = [];
        mediaRecorder = null;
        stream.getTracks().forEach(track => track.stop());
      
        document.querySelector("div.api_status").innerHTML = `Waiting for response...`;
        var time_before_whisper_api = new Date().getTime();
        setTimeout(() => {
            if (document.querySelector("div.api_status").innerHTML === `Waiting for response...`) 
                document.querySelector("div.api_status").innerHTML = `Timeout! Try it again.`;
        }, 8000);
        var result = await whisper_api(file);
        if (new Date().getTime() - time_before_whisper_api < 8000) {
            if (result.text) {
                document.querySelector("div.api_status").innerHTML = ``;
                document.querySelector("div.record_script").innerHTML = result.text;
                answer_stream.signal = false;
                messages.send_chatgpt(result.text);
            }
            else
                document.querySelector("div.api_status").innerHTML = `No messages. Check mic setup.`;
       }
    };

    mediaRecorder.start();
}

document.querySelector("div.record_button > button").addEventListener("touchstart", () => start_recording());

document.querySelector("div.record_button > button").addEventListener("touchend", () => {
    if (mediaRecorder) mediaRecorder.stop();
});

document.querySelector("div.record_button > button").addEventListener("mousedown", () => start_recording());

document.querySelector("div.record_button > button").addEventListener("mouseup", () => {
    if (mediaRecorder) mediaRecorder.stop();
});

document.querySelector("#target_language").addEventListener("input", e => localStorage.setItem("target_language", e.target.value));

document.addEventListener("DOMContentLoaded", () => {
    const target_language = localStorage.getItem("target_language");
    document.querySelector("#target_language").value = target_language ? target_language : "English";
});
