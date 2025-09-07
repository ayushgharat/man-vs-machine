import HfIcon from "./HfIcon";
import GlassContainer from "./GlassContainer";
import GlassButton from "./GlassButton";
import { GLASS_EFFECTS } from "../constants";
import PromptInput from "./PromptInput";
import UserQuery from "./UserQuery";
import { Conversation } from "@elevenlabs/client";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';
import { useVLMContext } from "../context/useVLMContext";
import Anthropic from '@anthropic-ai/sdk';

// interface WelcomeScreenProps {
//   onStart: () => void;
// }

export default function WelcomeScreen({ onStart, db }: any) {
  const { loadModel, isLoading, isLoaded, runInference, responseCompleted } = useVLMContext();

  const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true
  });

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
      console.log(result)

      if(!result || result.length === 0) {
        alert("No diary entries found to summarize")
        return;
      } 

      const dairyEntriesToSummarize = result.map((e: { text: any; }) => e.text).join('\n')
      const summaryPrompt = `
        You are assisting a visually impaired user by answering their questions based on their diary entries. 
        The diary entries may include details about the user’s daily life, objects they interact with, or their surroundings. 

        Your goal is to:
        - Use only the information contained in the diary entries to answer the user’s request. 
        - Be as clear, descriptive, and helpful as possible. 
        - If the answer cannot be determined from the diary entries, say so in a straightforward way. 
        - Do NOT reference or interpret any images in your response. Focus only on the text.
        
        User transcript: ${transcript}

        Here are the diary entries for context:
        \n\n${dairyEntriesToSummarize}
        `;


      try {
        const msg = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{ role: "user", content: summaryPrompt }],
        });
        console.log(msg);
      } catch(e){
        console.error(e)
      }

    }



    return (
      <div>
        <p>Microphone: {listening ? 'on' : 'off'}</p>
        <button onClick={() => SpeechRecognition.startListening()}>Start</button>
        <button onClick={() => handle_stopping_recording()}>Stop</button>
        <button onClick={resetTranscript}>Reset</button>
        <p>{transcript}</p>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Title Card */}
        <GlassContainer
          className="rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-200"
          role="banner"
        >
          <div className="p-8 text-center">
            <h1 className="text-5xl font-bold text-gray-100 mb-4">ViewSense</h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              A diary for the visually impaired, so they can look back at what they encountered
            </p>
          </div>
        </GlassContainer>

        <div className="w-full">
          <UserQuery/>
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

        </div>
      </div>
    </div>
  );
}
