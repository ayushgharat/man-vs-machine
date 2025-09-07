import React, { createContext, useState, useRef, useCallback } from "react";
import { AutoProcessor, AutoModelForImageTextToText, RawImage, TextStreamer } from "@huggingface/transformers";
import type { LlavaProcessor, PreTrainedModel, Tensor } from "@huggingface/transformers";
import type { VLMContextValue } from "../types/vlm";

const VLMContext = createContext<VLMContextValue | null>(null);

const MODEL_ID = "onnx-community/FastVLM-0.5B-ONNX";
const MAX_NEW_TOKENS = 512;

export { VLMContext };

export const VLMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processorRef = useRef<LlavaProcessor | null>(null);
  const modelRef = useRef<PreTrainedModel | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const inferenceLock = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [responseCompleted, setResponseCompleted] = useState(false)

  const loadModel = useCallback(
    async (onProgress?: (msg: string) => void) => {
      if (isLoaded) {
        onProgress?.("Model already loaded!");
        return;
      }

      if (loadPromiseRef.current) {
        return loadPromiseRef.current;
      }

      setIsLoading(true);
      setError(null);

      loadPromiseRef.current = (async () => {
        try {
          onProgress?.("Loading processor...");
          processorRef.current = await AutoProcessor.from_pretrained(MODEL_ID);
          onProgress?.("Processor loaded. Loading model...");
          modelRef.current = await AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
            dtype: {
              embed_tokens: "fp16",
              vision_encoder: "q4",
              decoder_model_merged: "q4",
            },
            device: "webgpu",
          });
          onProgress?.("Model loaded successfully!");
          setIsLoaded(true);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setError(errorMessage);
          console.error("Error loading model:", e);
          throw e;
        } finally {
          setIsLoading(false);
          loadPromiseRef.current = null;
        }
      })();

      return loadPromiseRef.current;
    },
    [isLoaded],
  );

  const runInference = useCallback(
    
    async (video: HTMLVideoElement | null, systemPrompt: string, instruction: string, onTextUpdate?: (text: string) => void): Promise<string> => {
      setResponseCompleted(false);
      
      if (inferenceLock.current) {
        console.log("Inference already running, skipping frame");
        return ""; // Return empty string to signal a skip
      }
      inferenceLock.current = true;

      if (!processorRef.current || !modelRef.current) {
        throw new Error("Model/processor not loaded");
      }

      
      let rawImg
      let content
      if(video != null) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.drawImage(video, 0, 0);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        rawImg = new RawImage(frame.data, frame.width, frame.height, 4);
        content = `<image>${instruction}`
      } else {
        // make raw image completely blank
        const width = 25;   // Define these or use a default size
        const height = 25;
        const blankData = new Uint8ClampedArray(width * height * 4); // all zeros (transparent)
        rawImg = new RawImage(blankData, width, height, 4);
        content = instruction
      }
      console.log(systemPrompt)
      
      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: content },
      ];
      const prompt = processorRef.current.apply_chat_template(messages, {
        add_generation_prompt: true,
      });
      const inputs = await processorRef.current(rawImg, prompt, {
        add_special_tokens: false,
      });

      let streamed = "";
      const streamer = new TextStreamer(processorRef.current.tokenizer!, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (t: string) => {
          streamed += t;
          onTextUpdate?.(streamed.trim());
        },
      });

      const outputs = (await modelRef.current.generate({
        ...inputs,
        max_new_tokens: MAX_NEW_TOKENS,
        do_sample: false,
        streamer,
        repetition_penalty: 1.2,
      })) as Tensor;

      const decoded = processorRef.current.batch_decode(outputs.slice(null, [inputs.input_ids.dims.at(-1), null]), {
        skip_special_tokens: true,
      });
      inferenceLock.current = false;
      setResponseCompleted(true)
      return decoded[0].trim();
    },
    [],
  );

  return (
    <VLMContext.Provider
      value={{
        isLoaded,
        isLoading,
        error,
        loadModel,
        runInference,
        responseCompleted
      }}
    >
      {children}
    </VLMContext.Provider>
  );
};
