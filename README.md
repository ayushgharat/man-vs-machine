# ViewSense
This is a Visual Diary for blind people so that they can always know current and past information about their environments

- If they forgot where they left something, they can ask visual sense to help them find it
- Visual sense can describe where they were at any given point in time (last weekend, 5 mins ago)

The best part!! It all runs locally on the edge so that your data and security is continuously protected, and you are not dependent on the internet. 

Uses FastVLM as a vlm and EntityDB for the in-browser vector store

Instructions to run the code
```
npm install
npm run dev
```

The best way we'd recommend using this (if you have apple devices) is to use your iphone as a camera to record your surroundings

Our goal isn't to actually provide these tools within the browser, but to show that we can run llms and vector stores on the edge, in very confined and restricted environments.
The ultimate vision would be to actually have this run on much smaller hardware, like phones, smart glasses and maybe other forms of specialized hardware.
