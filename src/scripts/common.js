import {Messages} from "./messages.js";
import {AnswerStream} from "./answer_stream.js";

export {whisper_api, chatgpt_api, answer_stream, messages, language_dict};

var answer_stream = new AnswerStream();
var messages = new Messages();

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

async function chatgpt_api(messages, model) {
    document.querySelector("#gpt3_5").disabled = true;
    document.querySelector("#gpt4").disabled = true;

    const api_url = "https://api.openai.com/v1/chat/completions";
    const param = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("API_KEY")}`,
            "type": "json_object"
        },
        body: JSON.stringify({model: model, messages: messages, stream: true})
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
                document.querySelector("#gpt3_5").disabled = false;
                document.querySelector("#gpt4").disabled = false;
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
