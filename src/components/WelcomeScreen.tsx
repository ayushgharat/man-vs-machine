import HfIcon from "./HfIcon";
import GlassContainer from "./GlassContainer";
import GlassButton from "./GlassButton";
import { GLASS_EFFECTS } from "../constants";
import PromptInput from "./PromptInput";
import UserQuery from "./UserQuery";
import { Conversation } from "@elevenlabs/client";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';
import { useEffect, useState } from "react";


// interface WelcomeScreenProps {
//   onStart: () => void;
// }

export default function WelcomeScreen({ onStart, db }: any) {

  const [rags, setRags] = useState([]);

  const Dictaphone = () => {
    const {
      transcript,
      listening,
      resetTranscript,
      browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    if (!browserSupportsSpeechRecognition) {
      return <span>Browser doesn't support speech recognition.</span>;
    }

    useEffect(() => {
      console.log(rags);
    }, [rags]);

    async function handle_stopping_recording() {
      SpeechRecognition.stopListening();
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      // console.log(transcript)
      if(!extractor) {
        console.log("Extractor not loaded")
      }
      
       const tensor = await extractor(transcript, { pooling: 'mean', normalize: true });
      let embedding = tensor.tolist();
      if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
        embedding = embedding[0];
      }
      const result =  await db.queryManualVectors(embedding);
      setRags(result);
    }

    return (
      <div>
        <GlassButton
            onClick={() => SpeechRecognition.startListening()}
            className="px-4 py-4 rounded-2xl"
            aria-label="Start live captioning with AI model"
            disabled={listening ? true : false}
          >
            <span className="font-semibold text-lg">Begin Speaking</span>
          </GlassButton>
          <GlassButton
            onClick={() => handle_stopping_recording()}
            className="px-4 py-4 rounded-2xl"
            aria-label="Start live captioning with AI model"
          >
            <span className="font-semibold text-lg">Stop Speaking</span>
          </GlassButton>
          <GlassButton
            onClick={resetTranscript}
            className="px-4 py-4 rounded-2xl"
            aria-label="Start live captioning with AI model"
          >
            <span className="font-semibold text-lg">Reset</span>
          </GlassButton>

        <p>{transcript}</p>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Title Card */}
        <GlassContainer
          className="rounded-3xl shadow-2xl"
          role="banner"
        >
          <div className="p-8 text-center">
            <h1 className="text-5xl font-bold text-gray-100 mb-4">ViewSense</h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              AI to help visually impaired people understand their surroundings by:
              <br></br>- transcribing live feeds every second
              <br></br>- allowing speech-enabled RAG.
            </p>
            <br></br><br></br>
            <p className="text-xl text-gray-300 leading-relaxed"><b>ALL ON THE EDGE</b></p>
            <br></br>
            <br></br>
            <p className="text-xl text-gray-300 leading-relaxed"><b>User Flow:</b>
            <br></br> 1. Click "Start Live Recording"
            <br></br> 2. FastVLM generates transcriptions (runs in-browser)
            <br></br> 3. Transcriptions stored in VectorDB
            <br></br> 4. For retrieval, use speech to record your query
            <br></br> 5. RAG results will be displayed to you
            </p>
          </div>
        </GlassContainer>

        <GlassContainer
          className="rounded-2xl shadow-2xl p-4 space-y-3"
          role="region"
        >
          <h2 className="text-xl font-semibold text-gray-100">RAG Results</h2>

          <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {rags.map((rag, i) => (
              <li 
                key={i} 
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition"
              >
                <p className="text-sm text-gray-400">Result {i + 1}</p>
                <p className="text-gray-200 font-medium">
                  {typeof rag === "string" ? rag : rag.text?.[0] ?? JSON.stringify(rag)}
                </p>
              </li>
            ))}
          </ul>
        </GlassContainer>

        <div className="w-full">
          <Dictaphone/>
        </div>

        {/* Webcam Status Card */}
        <GlassContainer
          bgColor={GLASS_EFFECTS.COLORS.SUCCESS_BG}
          className="rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-200"
          role="status"
          aria-label="Camera status"
        >
          <div className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-green-400 font-medium">Camera ready</p>
            </div>
          </div>
        </GlassContainer>


        {/* Start Button */}
        <div className="flex flex-col items-center space-y-4">
          <GlassButton
            onClick={onStart}
            className="px-8 py-4 rounded-2xl"
            aria-label="Start live captioning with AI model"
          >
            <span className="font-semibold text-lg">Start Live Recording</span>
          </GlassButton>

          <p className="text-sm text-gray-400 opacity-80">AI model will load when you click start</p>
        </div>
      </div>
    </div>
  );
}
