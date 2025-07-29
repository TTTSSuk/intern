//pages\create-video.tsx

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface VideoCreationStatus {
  _id: string;
  executionId: string | null;
  status: 'idle' | 'starting' | 'running' | 'succeeded' | 'error' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

export default function CreateVideo() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<VideoCreationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [extractPath, setExtractPath] = useState<string | null>(null);

  const pollingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingTimeout.current) clearTimeout(pollingTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (id) {
      checkExistingStatus(id as string);
    }
  }, [id]);

  async function checkExistingStatus(fileId: string) {
    try {
      console.log('Checking status for fileId:', fileId); // debug log
      
      const res = await fetch(`/api/status-wf?id=${fileId}&t=${Date.now()}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          // ถ้าไม่เจอ document หรือยังไม่มี executionId
          console.log('No existing workflow found, setting to idle');
          setStatus({
            _id: fileId,
            executionId: null,
            status: 'idle',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return;
        }
        
        // สำหรับ error อื่นๆ
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('API Response:', data); // debug log

      if (!data.executionId) {
        setStatus({
          _id: fileId,
          executionId: null,
          status: 'idle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      setStatus({
        _id: fileId,
        executionId: data.executionId,
        status: data.status || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ถ้ายังไม่ finished ให้เริ่ม polling
      if (!data.finished) {
        startStatusPolling(data.executionId);
      }
    } catch (err) {
      console.error('checkExistingStatus error:', err);
      
      // แทนที่จะ setError ทันที ให้ตั้งเป็น idle ก่อน
      setStatus({
        _id: fileId,
        executionId: null,
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // เฉพาะ error ที่ไม่ใช่ 404 ถึงจะแสดง error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (!errorMessage.includes('404')) {
        setError('Failed to check video status: ' + errorMessage);
      }
    }
  }

  async function startVideoCreation() {
    if (!id) {
      setError('Missing id');
      return;
    }

    setLoading(true);
    setError(null);

    setStatus({
      _id: id as string,
      executionId: null,
      status: 'starting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const res = await fetch('/api/start-wf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id }),
      });

      const result = await res.json();

      if (res.ok && result.executionId) {
        setStatus({
          _id: id as string,
          executionId: result.executionId,
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        startStatusPolling(result.executionId);
      } else {
        setError(result.error || 'Failed to start workflow');
        setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to start workflow');
      setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
    } finally {
      setLoading(false);
    }
  }

  function startStatusPolling(executionId: string) {
    if (pollingTimeout.current) clearTimeout(pollingTimeout.current);

    const poll = async () => {
      try {
        const res = await fetch(`/api/status-wf?executionId=${executionId}&t=${Date.now()}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Polling API error:', res.status, errorText);
          setError(`API error: ${res.status} ${errorText}`);
          setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
          return; // หยุด polling
        }

        const data = await res.json();
        console.log('Polling response:', data); // debug log

        const currentStatus: VideoCreationStatus['status'] = data.status || 'unknown';
        const finished: boolean = data.finished || false;

        setStatus(prev => {
          if (prev?.status === currentStatus) return prev;
          return {
            ...prev!,
            status: currentStatus,
            updatedAt: new Date().toISOString(),
            executionId,
          };
        });

        if (finished || currentStatus === 'error' || currentStatus === 'succeeded') {
          // หยุด polling เมื่อ workflow เสร็จหรือเกิด error
          console.log('Polling stopped. Final status:', currentStatus);
          return;
        }

        // ต่อ polling ถ้ายังไม่เสร็จ
        pollingTimeout.current = setTimeout(poll, 5000);
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Error polling status: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
        return; // หยุด polling
      }
    };

    poll();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Video</h1>

      {id && (
        <div className="mb-6">
          <p className="text-gray-600">File ID: {id}</p>
        </div>
      )}

      {status && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Workflow Status</h3>
          <p>
            Status:{' '}
            <span
              className={`font-semibold ${
                status.status === 'succeeded'
                  ? 'text-green-600'
                  : status.status === 'error'
                  ? 'text-red-600'
                  : status.status === 'running'
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              {status.status}
            </span>
          </p>
          {status.executionId && <p>Execution ID: {status.executionId}</p>}
          <p className="text-sm text-gray-500">
            Last updated: {new Date(status.updatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}


      <button
  disabled={loading || status?.status === "running" || status?.status === "succeeded"}
  className={`px-6 py-3 rounded-lg font-semibold
    ${
      status?.status === "running" || status?.status === "succeeded"
        ? "bg-gray-400 text-gray-500 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700 text-white"
    }`}
  onClick={startVideoCreation}
>
  เริ่มสร้างวิดีโอ
</button>


    </div>
  );
}