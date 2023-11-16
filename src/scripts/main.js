import {whisper_api, answer_stream, messages} from './common.js';

let mediaRecorder = null, chunks = [];
const language_dict = {
    "sq": {"English": "Albanian", "Native": "Shqip"},
    "ar": {"English": "Arabic", "Native": "العربية"},
    "hy": {"English": "Armenian", "Native": "Հայերեն"},
    "eu": {"English": "Basque", "Native": "Euskara"},
    "bn": {"English": "Bengali", "Native": "বাংলা"},
    "bg": {"English": "Bulgarian", "Native": "български"},
    "ca": {"English": "Catalan", "Native": "Català"},
    "zh": {"English": "Chinese (Mandarin)", "Native": "普通话"},
    "hr": {"English": "Croatian", "Native": "Hrvatski"},
    "cs": {"English": "Czech", "Native": "Čeština"},
    "en": {"English": "English", "Native": "English"},
    "et": {"English": "Estonian", "Native": "Eesti"},
    "fi": {"English": "Finnish", "Native": "Suomi"},
    "fr": {"English": "French", "Native": "Français"},
    "ka": {"English": "Georgian", "Native": "ქართული"},
    "de": {"English": "German", "Native": "Deutsch"},
    "el": {"English": "Greek", "Native": "Ελληνικά"},
    "gu": {"English": "Gujarati", "Native": "ગુજરાતી"},
    "hi": {"English": "Hindi", "Native": "हिन्दी"},
    "hu": {"English": "Hungarian", "Native": "Magyar"},
    "id": {"English": "Indonesian", "Native": "Bahasa Indonesia"},
    "ga": {"English": "Irish", "Native": "Gaeilge"},
    "it": {"English": "Italian", "Native": "Italiano"},
    "ja": {"English": "Japanese", "Native": "日本語"},
    "jv": {"English": "Javanese", "Native": "Basa Jawa"},
    "ko": {"English": "Korean", "Native": "한국어"},
    "lv": {"English": "Latvian", "Native": "Latviešu"},
    "lt": {"English": "Lithuanian", "Native": "Lietuvių"},
    "mk": {"English": "Macedonian", "Native": "Македонски"},
    "ms": {"English": "Malay", "Native": "Bahasa Melayu"},
    "mt": {"English": "Maltese", "Native": "Malti"},
    "mr": {"English": "Marathi", "Native": "मराठी"},
    "mn": {"English": "Mongolian", "Native": "Монгол"},
    "ne": {"English": "Nepali", "Native": "नेपाली"},
    "no": {"English": "Norwegian", "Native": "Norsk"},
    "fa": {"English": "Persian", "Native": "فارسی"},
    "pl": {"English": "Polish", "Native": "Polski"},
    "pt": {"English": "Portuguese", "Native": "Português"},
    "pa": {"English": "Punjabi", "Native": "ਪੰਜਾਬੀ"},
    "ro": {"English": "Romanian", "Native": "Română"},
    "ru": {"English": "Russian", "Native": "Русский"},
    "sr": {"English": "Serbian", "Native": "Српски"},
    "sk": {"English": "Slovak", "Native": "Slovenčina"},
    "sl": {"English": "Slovenian", "Native": "Slovenščina"},
    "es": {"English": "Spanish", "Native": "Español"},
    "sw": {"English": "Swahili", "Native": "Kiswahili"},
    "sv": {"English": "Swedish", "Native": "Svenska"},
    "ta": {"English": "Tamil", "Native": "தமிழ்"},
    "tt": {"English": "Tatar", "Native": "татар теле"},
    "te": {"English": "Telugu", "Native": "తెలుగు"},
    "th": {"English": "Thai", "Native": "ไทย"},
    "tr": {"English": "Turkish", "Native": "Türkçe"},
    "uk": {"English": "Ukrainian", "Native": "Українська"},
    "ur": {"English": "Urdu", "Native": "اردو"},
    "uz": {"English": "Uzbek", "Native": "O‘zbek"},
    "vi": {"English": "Vietnamese", "Native": "Tiếng Việt"},
    "cy": {"English": "Welsh", "Native": "Cymraeg"}
};

async function start_recording() {
    if (mediaRecorder && mediaRecorder.state === "recording") return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    document.querySelector("div.api_status").innerHTML = "Recording...";
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
document.querySelector("#source_language").addEventListener("input", e => localStorage.setItem("source_language", e.target.value));

document.addEventListener("DOMContentLoaded", () => {
    const source_lang_element = document.getElementById('source_language');
    const target_lang_element = document.getElementById('target_language');

    for (const [key, value] of Object.entries(language_dict)) {
        const source_option = document.createElement('option');
        const target_option = document.createElement('option');

        source_option.value = key; 
        source_option.text = value.Native;

        target_option.value = value.English;
        target_option.text = `${value.Native} (${value.English})`;

        source_lang_element.appendChild(source_option);
        target_lang_element.appendChild(target_option);
    }

    const source_language = localStorage.getItem("source_language");
    const target_language = localStorage.getItem("target_language");

    document.querySelector("#source_language").value = source_language ? source_language : "auto";
    document.querySelector("#target_language").value = target_language ? target_language : "English";
});
