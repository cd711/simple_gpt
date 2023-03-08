'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

async function generateResponse(messages: any) {
  const list = messages.length > 3 ? messages.slice(-3) : messages;
  const response = await axios.post('/api/gpt', list, {
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

export default function Home() {

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const msgRef = useRef<Array<{ role: 'user' | 'system', content: string }>>([]);
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
    const ipt = input.replace(/(^\s*)|(\s*$)/g, '');
    if (!ipt) {
      return;
    }

    msgRef.current.push({
      role: 'user',
      content: ipt,
    });
    setInput('');
    setLoading(true);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current?.scrollHeight });
    }, 10);
    try {
      const res = await generateResponse(msgRef.current);
      msgRef.current.push({
        role: 'system',
        content: res.map((item: any) => item.text).join(''),
      });

      if (msgRef.current.length > 100) {
        msgRef.current = msgRef.current.slice(-100);
      }
      localStorage.setItem('history', JSON.stringify(msgRef.current));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current?.scrollHeight });
      inputRef.current?.focus();
    }, 10);
  };
  const onKeyUP = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      sendMessage();
    }
  };
  return (
    <div className={styles.main}>
      <div ref={listRef} className={styles.msg}>
        {msgRef.current.map((message, index) => (
          <div key={index} className={message.role == 'user' ? styles.me : ''}>
            {message.role == 'system' ? <ReactMarkdown components={{
              code: CodeBlock,
            }}>{message.content}</ReactMarkdown> : message.content}
          </div>
        ))}
      </div>
      <div className={styles.input}>
        <input className={styles.ipt} ref={inputRef} autoFocus onKeyUp={onKeyUP} disabled={loading} value={input} onChange={(event) => setInput(event.target.value)} />
        <button disabled={loading} onClick={sendMessage as any}>Send</button>
      </div>
    </div>
  );
}