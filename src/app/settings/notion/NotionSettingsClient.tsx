'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export default function NotionSettingsClient(){

const [databaseUrl, setDatabaseUrl] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);
const [message, setMessage] = useState<string>('');
const [notionConnected, setNotionConnected] = useState<boolean>(false);
const [dbConnected, setDbConnected] = useState<boolean>(false);
const [messageColor, setMessageColor] = useState<string>('red');

useEffect(()=>{ loadStatus() }, [])

  return (

    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between mt-4">
      <h1 className="text-2xl font-bold">Notion 설정</h1>
      <div className="self-end bg-blue-100 border border-blue-300 rounded-md p-2 w-fit">
      <p className="text-sm text-muted-foreground">Notion 계정 연결 상태 : {notionConnected ? '🟢' : '🔴'}</p>
      <p className="text-sm text-muted-foreground">Notion 데이터 연결 상태 : {dbConnected ? '🟢' : '🔴'}</p>
      </div>
      </div>
      <p className="text-sm text-muted-foreground">Notion 데이터베이스 URL을 입력하세요.</p>
      <Input className="mt-2" type="text" value={databaseUrl} onChange={(e) => setDatabaseUrl(e.target.value)} placeholder="Database URL" />
      <Button className="w-16 mt-3" disabled={loading} onClick={handleSave}>{loading ? '연결중...' : '연결'}</Button>
      <p className={`text-sm text-${messageColor}-500 mt-2`}>{message}</p>
    </div>

  )

  async function loadStatus(){
    const response = await fetch('/api/notion/status');
    const data = await response.json();
    setNotionConnected(data.notionConnected);
    setDbConnected(data.dbConnected);
  }

  async function handleSave(){
    console.log(messageColor);
    if(!databaseUrl || databaseUrl.trim() === ''){
      setMessage('데이터베이스 URL을 입력해주세요.');
      return;
    }
    if (!databaseUrl.startsWith('https://')) {
      setMessage('올바른 URL 형식이 아닙니다');
      return;
    }
    if (!databaseUrl.includes('notion.so')) {
      setMessage('Notion URL이 아닙니다');
      return;
    }
    const match = databaseUrl.match(/[0-9a-f]{32}/);
    const databaseId = match ? match[0] : null;
    if(!databaseId){
      setMessage('올바른 데이터베이스 ID 형식이 아닙니다.')
      return;
    }
    setLoading(true);
    const response = await fetch('/api/notion/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({databaseUrl})
    })

    if(response.ok){
      const data = await response.json();
      setMessageColor('green');
      setMessage(data.message || '데이터베이스 URL 저장 완료');
    }else{
      setLoading(false);
      setMessage('데이터베이스 URL 저장 중 오류가 발생했습니다.');
    }
    setLoading(false);
    await loadStatus();
  }
}