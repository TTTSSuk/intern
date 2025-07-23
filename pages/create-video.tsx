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
      const res = await fetch(`/api/status-wf?id=${fileId}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to fetch workflow status');
      const data = await res.json();

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

      startStatusPolling(data.executionId);
    } catch (err) {
      console.error(err);
      setError('Failed to check video status');
    }
  }

  async function startVideoCreation() {
    if (!id) return;

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
          setError(`API error: ${res.status} ${errorText}`);
          setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
          return; // หยุด polling
        }

        const data = await res.json();

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

        if (finished || currentStatus === 'error') {
          // หยุด polling เมื่อ workflow เสร็จหรือเกิด error
          return;
        }

        pollingTimeout.current = setTimeout(poll, 5000);
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Error polling status');
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
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <button
        onClick={startVideoCreation}
        disabled={loading || status?.status === 'running' || status?.status === 'starting'}
        className={`px-6 py-3 rounded-lg font-semibold ${
          loading || status?.status === 'running' || status?.status === 'starting'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading || status?.status === 'starting' ? 'Starting...' : 'เริ่มสร้างวิดีโอ'}
      </button>
    </div>
  );
}
