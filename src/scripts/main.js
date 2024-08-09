import {whisper_api, messages, language_dict, textContents, user_lang, run_tts} from './common.js';

let mediaRecorder = null, chunks = [];
let recordTimer = null, timerTime = 0;
let start_recording_indicator = false;
let typingTimer = null;

async function start_recording() {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    document.querySelector("div.record_button button").classList.add("pushing");

    start_recording_indicator = new Date().getTime();
    document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["waiting"]}...`;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
        document.querySelector("#verify_result").innerHTML = '';
        var result = await whisper_api(file);
        if (result.text) {
            document.querySelector("textarea.record_script").value = result.text;
            messages.send_chatgpt(result.text, document.querySelector("#default_model").value);
        }
        else
            document.querySelector("div.api_status").innerHTML = `${textContents[user_lang]["no_message"]}`;
    };

    mediaRecorder.onstart = () => {
        start_recording_indicator = false;
    };
    mediaRecorder.start();
}

document.querySelector("div.record_button > button").addEventListener("touchstart", () => start_recording());

document.body.addEventListener("touchend", () => {
    let registerRecordingStopper = setInterval(() => {
        if (!mediaRecorder || start_recording_indicator) {
            if (new Date().getTime() - start_recording_indicator > 8000)
                clearInterval(registerRecordingStopper);
            return;
        }
        document.querySelector("div.record_button button").classList.remove("pushing");
        mediaRecorder.stop();
        clearInterval(registerRecordingStopper);
    }, 200);
});

document.querySelector("div.record_button > button").addEventListener("mousedown", () => start_recording());

document.body.addEventListener("mouseup", () => {
    let registerRecordingStopper = setInterval(() => {
        if (!mediaRecorder || start_recording_indicator) {
            if (new Date().getTime() - start_recording_indicator > 8000)
                clearInterval(registerRecordingStopper);
            return;
        }
        document.querySelector("div.record_button button").classList.remove("pushing");
        mediaRecorder.stop();
        clearInterval(registerRecordingStopper);
    }, 200);
});

document.querySelector("div.lang_select img").addEventListener("click", () => {
    const prev_source = document.querySelector("#source_language").value;
    const prev_target = document.querySelector("#target_language").value;
    if (prev_source === "auto") return;
    document.querySelector("#source_language").value = prev_target;
    document.querySelector("#target_language").value = prev_source;

    localStorage.setItem("source_language", prev_target);
    localStorage.setItem("target_language", prev_source);

    document.querySelector("textarea.record_script").value = document.querySelector("#translate_result").textContent;
    document.querySelector("#translate_result").innerHTML = '';
    document.querySelector("#pronunciation").innerHTML = '';
    document.querySelector("#verify_result").innerHTML = '';
    document.querySelector("div.regenerate-buttons").style.display = '';
    document.querySelector("#verify").style.display = '';
});

document.querySelector("#verify").addEventListener("click", () => {
    document.querySelector("#verify").style.display = 'none';
    messages.send_chatgpt(document.querySelector("#translate_result").textContent, document.querySelector("#default_model").value, true);
});

document.querySelector("textarea.record_script").addEventListener("input", e => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout( () => {
        messages.send_chatgpt(e.target.value, document.querySelector("#default_model").value);
    }, 3000);
});

document.querySelector("div.result_buttons").addEventListener("click", e => {
    if (document.querySelector("#tts").contains(e.target) && !document.querySelector("#tts").disabled) {
        run_tts();
    }

    if (e.target.id === "gpt4")
        messages.send_chatgpt(document.querySelector("textarea.record_script").value, "gpt-4o");
});

document.querySelector("div.title button").addEventListener("click", () => {
    document.querySelector("#options").style.display = 'block';
});

document.querySelector("#options").addEventListener("click", e => {
    if (e.target === document.querySelector("div.API_KEY button"))
        localStorage.setItem("API_KEY", document.querySelector("#api_key").value);
    if (e.target === document.querySelector("div.GOOGLE_API_KEY button"))
        localStorage.setItem("GOOGLE_API_KEY", document.querySelector("#google_api_key").value);

    if (e.target.classList.contains("options-close")) {
        if (localStorage.getItem("API_KEY"))
            document.querySelector("#options").style.display = 'none';
    }
});

document.querySelector("#source_language").addEventListener("change", e => localStorage.setItem("source_language", e.target.value));
document.querySelector("#target_language").addEventListener("change", e => localStorage.setItem("target_language", e.target.value));
document.querySelector("#check_tts").addEventListener("change", e => localStorage.setItem("check_tts", e.target.checked));
document.querySelector("#use_google_tts").addEventListener("change", e => localStorage.setItem("use_google_tts", e.target.checked));

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
    if (API_KEY) {
        document.querySelector("div.API_KEY input").value = API_KEY;
        document.querySelector("div.GOOGLE_API_KEY input").value = localStorage.getItem("GOOGLE_API_KEY");
        document.querySelector("#use_google_tts").checked = JSON.parse(localStorage.getItem("use_google_tts"));
    }
    else
        document.querySelector("#options").style.display = 'block';

    const check_tts = JSON.parse(localStorage.getItem("check_tts"));
    if (check_tts === null)
        localStorage.setItem("check_tts", true);
    else if (!check_tts)
        document.querySelector("#check_tts").checked = false;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = textContents[user_lang][element.getAttribute('data-i18n')];
    });
});
