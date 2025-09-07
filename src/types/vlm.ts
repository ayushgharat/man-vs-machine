export type VLMContextValue = {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadModel: (onProgress?: (msg: string) => void) => Promise<void>;
  responseCompleted: boolean;
  runInference: (
    video: HTMLVideoElement | null,
    systemPrompt: string,
    instruction: string,
    onTextUpdate?: (text: string) => void,
  ) => Promise<string>;
};
