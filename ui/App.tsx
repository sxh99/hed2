import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  async function greet() {
    const newGreetMsg: string = await invoke('greet', { name });
    setGreetMsg(newGreetMsg);
  }

  return (
    <div className="h-screen w-screen bg-gray-700">
      <input
        id="greet-input"
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder="Enter a name..."
      />
      <button type="submit" onClick={greet}>
        Greetfefef
      </button>
      <p className="text-cyan-100">{greetMsg}</p>
    </div>
  );
}
