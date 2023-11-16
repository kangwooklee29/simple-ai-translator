import {whisper_api, answer_stream, messages, language_dict} from './common.js';

let mediaRecorder = null, chunks = [];

function run_tts() {
    if (!window.getSelection) return;
    console.log(window.getSelection().toString());
}

async function start_recording() {
    if (mediaRecorder && mediaRecorder.state === "recording") return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    document.querySelector("div.api_status").innerHTML = "Recording...";

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

document.querySelector("div.lang_select img").addEventListener("click", () => {
    const prev_source = document.querySelector("#source_language").value;
    const prev_target = document.querySelector("#target_language").value;
    document.querySelector("#source_language").value = prev_target;
    document.querySelector("#target_language").value = prev_source;

    localStorage.setItem("source_language", prev_target);
    localStorage.setItem("target_language", prev_source);
});

document.querySelector("div.result_buttons").addEventListener("click", e => {
    if (e.target.id === "tts") 
        run_tts();

    if (e.target.id === "gpt4")
        messages.send_chatgpt(document.querySelector("div.record_script").innerHTML, "gpt-4");
});

document.querySelector("#source_language").addEventListener("change", e => localStorage.setItem("source_language", e.target.value));
document.querySelector("#target_language").addEventListener("change", e => localStorage.setItem("target_language", e.target.value));

document.addEventListener("DOMContentLoaded", () => {
    const source_lang_element = document.getElementById('source_language');
    const target_lang_element = document.getElementById('target_language');

    for (const [key, value] of Object.entries(language_dict)) {
        const source_option = document.createElement('option');
        const target_option = document.createElement('option');

        source_option.value = key;
        source_option.text = value.Native;

        target_option.value = key;
        target_option.text = `${value.Native} (${value.English})`;

        source_lang_element.appendChild(source_option);
        target_lang_element.appendChild(target_option);
    }

    const source_language = localStorage.getItem("source_language");
    const target_language = localStorage.getItem("target_language");

    document.querySelector("#source_language").value = source_language ? source_language : "auto";
    document.querySelector("#target_language").value = target_language ? target_language : "en";
});
