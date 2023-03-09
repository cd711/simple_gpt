import axios from "axios";

const API_URL = "https://api.openai.com/v1/chat/completions";
// evn
const API_KEY = process.env.OPENAI_API_KEY;
const model = "gpt-3.5-turbo";
const max_tokens = 5120;

export type ChatGPTAgent = "user" | "system";
export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface OpenAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  stream?: boolean;
  n?: number;
}

async function generateResponse(messages: any) {
  // try {
  // let res = await fetch(API_URL, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     context,
  //     message: msg,
  //     model: model,
  //     max_length: max_length
  //   })
  // });
  // let data = await res.json();
  const args: OpenAIStreamPayload = {
    model,
    messages: messages,
    temperature: 0.5,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0,
    max_tokens,
    // stream: false,
    // n: 1,
  };
  const response = await axios.request({
    url:
      "https://xiu4frlel3nlkbduklxbke4kmi0bfrtb.lambda-url.ap-southeast-1.on.aws",
    method: "POST",
    data: { key: API_KEY, data: JSON.stringify(args) },

    // proxy: {
    //   host: '127.0.0.1',
    //   port: 7890,
    //   protocol: 'https'
    // },
    // responseType: 'text',
    headers: {
      // Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 25000,
    // proxy:
  });

  console.log(response.data);
  if (response.status !== 200) {
    throw response.statusText;
  }
  const {
    id,
    choices,
  } = response.data;
  // const res =
  const res = choices.map(({ message, index }: any) => {
    // console.log(message, index)
    return {
      text: message.content,
      id: `${id}-${index}`,
    };
  });
  console.log(res);
  return res;
}

export async function POST(request: Request) {
  const messages = await request.json();
  // console.log()
  let res = await generateResponse(messages);
  return new Response(JSON.stringify(res));
}
