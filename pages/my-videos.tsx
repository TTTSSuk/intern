// pages/my-videos.tsx
import { useEffect, useState } from "react";

interface Subfolder {
  name: string;
  files?: string[];
  subfolders?: Subfolder[];
}

interface Folders {
  subfolders: Subfolder[];
}

interface Clip {
  video?: string;
  finalVideo?: string;
  createdAt: string | { $date: string };
}

interface ExecutionHistory {
  executionId: string;
  startTime: string | { $date: string };
  endTime: string | { $date: string };
  workflowStatus: string;
}

interface HistoryVideo {
  _id: { $oid: string };
  userId: string;
  originalName: string;
  extractPath: string;
  status: string;
  createdAt: string | { $date: string };
  folders?: Folders;  
  clips: Clip[];
  executionIdHistory?: ExecutionHistory;
}

const BASE_VIDEO_URL = 'http://192.168.70.166:8080/';

// ฟังก์ชันช่วยแปลงวันที่
function parseDate(value: string | { $date: string }): Date {
  if (typeof value === "string") return new Date(value);
  return new Date(value.$date);
}

// ฟังก์ชันดึง sourceImage และ promptFile ของ clip
function getClipSource(video: HistoryVideo, clip: Clip) {
  if (!video.folders?.subfolders?.length) return { sourceImage: "N/A", promptFile: "N/A" };

  const videoClips = video.clips.filter(c => c.video);
  const clipIndex = videoClips.indexOf(clip);
  const subfolders = video.folders.subfolders[0].subfolders ?? [];
  const subfolder = subfolders[clipIndex];
  if (!subfolder) return { sourceImage: "N/A", promptFile: "N/A" };

  const imageFile = subfolder.files?.find(f => f.match(/\.(jpg|png|jpeg|gif)$/)) ?? "N/A";
  const txtFile = subfolder.files?.find(f => f.endsWith(".txt")) ?? "N/A";

  const basePath = video.extractPath.replace("./uploads/", "");
  const sourceImage = `${BASE_VIDEO_URL}/${basePath}/${subfolder.name}/${imageFile}`;
  const promptFile = `${BASE_VIDEO_URL}/${basePath}/${subfolder.name}/${txtFile}`;

  return { sourceImage, promptFile };
}

// Component แสดง Generated Clips
function GeneratedClips({ video, expandedClips, setExpandedClips }: {
  video: HistoryVideo;
  expandedClips: Record<string, boolean>;
  setExpandedClips: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const hasClips = video.clips.some(c => c.video);
  if (!hasClips) return null;

  const videoId = video._id.$oid;

  return (
    <div>
      <button
        onClick={() =>
            setExpandedClips(prev => ({ ...prev, [videoId]: !prev[videoId] }))
        }
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-xl border border-indigo-200 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-left">
            <h5 className="font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
              Generated Clips
            </h5>
            <p className="text-sm text-slate-500">{video.clips.filter(c => c.video).length} clips available</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-600 text-xs px-3 py-1 rounded-full font-medium">
            {video.clips.filter(c => c.video).length}
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedClips[videoId] ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expandedClips[videoId] && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 animate-in slide-in-from-top duration-300">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {video.clips.filter(c => c.video).map((clip) => {
  const videoUrl = `${BASE_VIDEO_URL}/${clip.video}`;
  const { sourceImage, promptFile } = getClipSource(video, clip);

  // ใช้ clip.video เป็น key แทน idx เพื่อให้ React ไม่ warning
  return (
    <div key={clip.video} className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
      <video src={videoUrl} controls className="w-full rounded-lg mb-2 shadow-sm" style={{ maxHeight: '200px' }} />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
        <p className="text-xs text-slate-600 font-medium">Clip</p>
      </div>
      <p className="text-xs text-slate-500 mt-1">Created: {parseDate(clip.createdAt).toLocaleString()}</p>
      <div className="mt-1 text-xs text-slate-500">
        <p>📸 Source Image: {sourceImage}</p>
        <p>📝 Prompt File: {promptFile}</p>
      </div>
    </div>
  );
})}
          </div>
        </div>
      )}
    </div>
  );
}

// Component แสดง Final Video
function FinalVideo({ video }: { video: HistoryVideo }) {
  const hasFinal = video.clips.some(c => c.finalVideo);
  if (!hasFinal) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-xl border border-emerald-200">
      <h5 className="font-semibold text-slate-700 mb-3">Final Video</h5>
      <div className="grid md:grid-cols-2 gap-4">
        {video.clips.filter(c => c.finalVideo).map((clip, idx) => {
          const videoUrl = `${BASE_VIDEO_URL}/${clip.finalVideo}`;
          return (
            <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-semibold text-emerald-700">Final Result</span>
              </div>
              <video src={videoUrl} controls className="w-full rounded-lg mb-3 shadow-sm" style={{ maxHeight: "250px" }} />
              <p className="text-xs text-emerald-600 font-medium">Completed: {parseDate(clip.createdAt).toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HistoryVideos() {
  const [videos, setVideos] = useState<HistoryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClips, setExpandedClips] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      const user = localStorage.getItem("loggedInUser");
      if (!user) return;

      try {
        const res = await fetch(`/api/history-videos?userId=${user}`);
        if (!res.ok) throw new Error("Failed to fetch history videos");

        const data: HistoryVideo[] = await res.json();
        const generatedVideos = data.filter(v => v.executionIdHistory);
        setVideos(generatedVideos);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">Loading your videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No videos found</h3>
          <p className="text-slate-500">Start creating some amazing content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Video History
            </h1>
          </div>
          <p className="text-slate-600 ml-13">Track your video processing journey</p>
        </div>

        <div className="grid gap-6">
          {videos.map((video, index) => {
            const videoId = video._id.$oid;
            return (
              <div key={videoId} className="group bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl rounded-2xl border border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02] overflow-hidden" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200 mb-2">
                        {video.originalName}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Uploaded {parseDate(video.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        video.executionIdHistory?.workflowStatus === "completed"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : video.executionIdHistory?.workflowStatus === "running"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : video.executionIdHistory?.workflowStatus === "error"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}>
                        {video.executionIdHistory?.workflowStatus || video.status}
                      </span>
                    </div>
                  </div>

                  {/* Workflow Details */}
                  {video.executionIdHistory && (
                    <div className="mb-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h4 className="font-semibold text-slate-700">Workflow Details</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">ID:</span>
                            <code className="bg-slate-200/50 px-2 py-1 rounded text-xs font-mono">{video.executionIdHistory.executionId}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">Status:</span>
                            <span className="text-slate-700">{video.executionIdHistory.workflowStatus}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">Started:</span>
                            <span className="text-slate-700">{parseDate(video.executionIdHistory.startTime).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">Ended:</span>
                            <span className="text-slate-700">{parseDate(video.executionIdHistory.endTime).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clips */}
                  <GeneratedClips video={video} expandedClips={expandedClips} setExpandedClips={setExpandedClips} />

                  {/* Final Video */}
                  <FinalVideo video={video} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
