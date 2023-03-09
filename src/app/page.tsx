'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from 'next/image';
// darcula.;
function CodeBlock(p: any) {
  let lang = p.className ? p.className.replace('language-', '') : '';
  if (lang) {
    // let code = p.node?.children[0];
    return <SyntaxHighlighter className={styles.code} style={darcula} language={lang}>
      {p.children}
    </SyntaxHighlighter>
  }
  return p.children;
}

async function generateResponse(messages: Array<Msg>) {
  let list = messages.length > 3 ? messages.slice(-3) : messages;
  if (Date.now() - list[list.length - 1].time > 5 * 60 * 1000) {
    list = [list[0]];
  }
  let req = list.map(({ role, content }) => ({ role, content }));
  const response = await axios.post('/api/gpt', req, {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${API_KEY}`
    },
    timeout: 15000,
    // proxy:
  });
  if (response.status !== 200) {
    throw response.statusText;
  }
  const message = response.data;
  // return message;
  console.log(message);
  return message;

}

let id = 0;
type Msg = { id: string | number; time: number; role: 'user' | 'system'; loading?: boolean; err?: boolean; content: string };
export default function Home() {
  const [loading, setLoading] = useState(true);
  const msgRef = useRef<Array<Msg>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const history = localStorage.getItem('history');
    if (history) {
      msgRef.current = JSON.parse(history);
    }
    // setInput('');
    setLoading(false);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current?.scrollHeight });
      inputRef.current?.focus();
    }, 800);
  }, []);
  const sendMessage = async () => {
    const ipt = inputRef.current?.value.replace(/(^\s*)|(\s*$)/g, '');

    if (!ipt) {
      return;
    }

    id = id + 1;
    let src = {
      time: Date.now(),
      role: 'user',
      content: ipt,
      err: false,
      id,
      loading: true,
    };
    // alert(srcs);
    msgRef.current.push(src as any);
    inputRef.current!.value = '';
    setLoading(true);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current?.scrollHeight });
    }, 10);
    try {
      const res = await generateResponse(msgRef.current);
      msgRef.current.push({
        time: Date.now(),
        id,
        role: 'system',
        content: res.map((item: any) => item.text).join(''),
      });

      if (msgRef.current.length > 100) {
        msgRef.current = msgRef.current.slice(-100);
      }
      localStorage.setItem('history', JSON.stringify(msgRef.current.map(({ id, time, role, content }) => ({ id, time, role, content }))));
  } catch (e) {
    src.err = true;
    console.error(e);
  }
  src.loading = false;
  setLoading(false);
  setTimeout(() => {
    listRef.current?.scrollTo({ top: listRef.current?.scrollHeight });
    inputRef.current?.focus();
  }, 10);
};

const reSend = (id: string | number) => {
  const msg = msgRef.current.find((item) => item?.id === id);
  if (!msg) {
    return;
  }

  delete msgRef.current[msgRef.current.indexOf(msg)];
  const m = msg.content;
  inputRef.current!.value = m;
  // setTimeout(() => {
  // trigger
  sendMessage();
  // }, 500);
}
const onKeyUP = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.keyCode === 13 && !e.shiftKey) {
    sendMessage();
  }
};


return (
  <div className={styles.main}>
    <div ref={listRef} className={styles.msg}>
      {msgRef.current.map((message) => (
        <>
          <div key={message.id} className={(message.role == 'user' ? styles.me : '') + (message.err ? ' ' + styles.err : '')}>
            {message.role == 'system' ? <ReactMarkdown components={{
              code: CodeBlock,
            }}>{message.content}</ReactMarkdown> : <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {message.err ? <img onClick={() => reSend(message.id)} className={styles.r} src="/r.svg" alt={''} /> : ''}
              {message.content}
            </>}
          </div>
          {message.loading ? <div className={styles.loading}>...</div> : ''}
        </>))}
    </div>
    <div className={styles.input}>
      <input className={styles.ipt} ref={inputRef} autoFocus onKeyUpCapture={onKeyUP} disabled={loading} />
      <button disabled={loading} onClick={sendMessage as any}>Send</button>
    </div>
  </div>
);
}