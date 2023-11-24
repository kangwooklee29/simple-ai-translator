import {whisper_api, messages, language_dict, textContents, user_lang} from './common.js';

let mediaRecorder = null, chunks = [];
let recordTimer = null, timerTime = 0;
let start_recording_indicator = false;

async function run_tts() {
    const selection = window.getSelection();
    let target_text = document.querySelector("#translate_result").textContent;
    if (selection) {
        const selection_str = selection.toString();
        if (selection_str && target_text.includes(selection_str))
            target_text = selection_str;
    }

    let blob_url = localStorage.getItem(target_text);
    if (!blob_url) {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("API_KEY")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: target_text,
                voice: 'alloy'
            })
        });

        blob_url = URL.createObjectURL(await response.blob());
        localStorage.setItem(target_text, blob_url);
    }

    const audio = new Audio(blob_url);
    audio.play();
    audio.addEventListener('ended', () => {
        document.querySelector("#tts").disabled = false;
    });    
}

async function start_recording() {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    document.querySelector("div.record_button button").classList.add("pushing");

    start_recording_indicator = true;
    document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["waiting"]}...`;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    start_recording_indicator = false;

    timerTime = Date.now();
    recordTimer = setInterval(() => {
        document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["recording"]}... ${new Date(Date.now() - timerTime).toISOString().substr(14, 5)}`;
    }, 1000);

    mediaRecorder = new MediaRecorder(stream, {type: 'audio/webm'});
    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
        var blob = new Blob(chunks, { 'type' : 'audio/webm' });
        var file = new File([blob], "audio.webm", { type: "audio/webm;" });
        chunks = [];
        mediaRecorder = null;
        stream.getTracks().forEach(track => track.stop());

        clearInterval(recordTimer);
        document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["waiting"]}...`;
        document.querySelector("#translate_result").innerHTML = '';
        document.querySelector("#pronunciation").innerHTML = '';
        var time_before_whisper_api = new Date().getTime();
        setTimeout(() => {
            if (document.querySelector("div.api_status").innerHTML === `${textContents[user_lang]["waiting"]}...`) 
                document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["timeout"]}`;
        }, 8000);
        var result = await whisper_api(file);
        if (new Date().getTime() - time_before_whisper_api < 8000) {
            if (result.text) {
                document.querySelector("textarea.record_script").value = result.text;
                messages.send_chatgpt(result.text, document.querySelector("#default_model").value);
            }
            else
                document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["no_message"]}`;
        }
    };

    mediaRecorder.start();
}

document.querySelector("div.record_button > button").addEventListener("touchstart", () => start_recording());

document.body.addEventListener("touchend", () => {
    if (mediaRecorder && !start_recording_indicator) {
        document.querySelector("div.record_button button").classList.remove("pushing");
        mediaRecorder.stop();
    }
});

document.querySelector("div.record_button > button").addEventListener("mousedown", () => start_recording());

document.body.addEventListener("mouseup", () => {
    if (mediaRecorder && !start_recording_indicator) {
        document.querySelector("div.record_button button").classList.remove("pushing");
        mediaRecorder.stop();
    }
});

document.querySelector("div.lang_select img").addEventListener("click", () => {
    const prev_source = document.querySelector("#source_language").value;
    const prev_target = document.querySelector("#target_language").value;
    if (prev_source === "auto") return;
    document.querySelector("#source_language").value = prev_target;
    document.querySelector("#target_language").value = prev_source;

    localStorage.setItem("source_language", prev_target);
    localStorage.setItem("target_language", prev_source);

    document.querySelector("textarea.record-script").value = document.querySelector("#translate_result").textContent;
    document.querySelector("#translate_result").innerHTML = '';
    document.querySelector("#pronunciation").innerHTML = '';
});

document.querySelector("div.result_buttons").addEventListener("click", e => {
    if (document.querySelector("#tts").contains(e.target) && !document.querySelector("#tts").disabled) {
        document.querySelector("#tts").disabled = true;
        run_tts();
    }

    if (e.target.id === "gpt3_5")
        messages.send_chatgpt(document.querySelector("textarea.record_script").value, "gpt-3.5-turbo-1106");

    if (e.target.id === "gpt4")
        messages.send_chatgpt(document.querySelector("textarea.record_script").value, "gpt-4-1106-preview");
});

document.querySelector("div.title button").addEventListener("click", () => {
    document.querySelector("#options").style.display = 'block';
});

document.querySelector("#options").addEventListener("click", e => {
    if (e.target === document.querySelector("div.API_KEY button"))
        localStorage.setItem("API_KEY", document.querySelector("#api_key").value);

    if (e.target.classList.contains("options-close")) {
        if (localStorage.getItem("API_KEY"))
            document.querySelector("#options").style.display = 'none';
    }
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
        source_option.text = `${value.Native} (${value.English})`;

        target_option.value = key;
        target_option.text = `${value.Native} (${value.English})`;

        source_lang_element.appendChild(source_option);
        target_lang_element.appendChild(target_option);
    }

    const source_language = localStorage.getItem("source_language");
    const target_language = localStorage.getItem("target_language");

    document.querySelector("#source_language").value = source_language ? source_language : "auto";
    document.querySelector("#target_language").value = target_language ? target_language : "en";

    const API_KEY = localStorage.getItem("API_KEY");
    if (API_KEY)
        document.querySelector("div.API_KEY input").value = API_KEY;
    else
        document.querySelector("#options").style.display = 'block';

    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = textContents[user_lang][element.getAttribute('data-i18n')];
    });
});
