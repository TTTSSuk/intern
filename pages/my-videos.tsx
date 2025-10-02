//pages\my-videos.tsx
import { useEffect, useState } from "react";
import { XMarkIcon, CalendarIcon, FunnelIcon } from "@heroicons/react/24/outline";

// Define interfaces
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
  createdAt: string | { $date: string } | null;
  tokenDeducted?: boolean;
}

interface ExecutionHistory {
  executionId: string;
  startTime?: string | { $date: string } | null;
  endTime?: string | { $date: string } | null;
  workflowStatus: string;
  error?: string;
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

const BASE_VIDEO_URL = "http://192.168.70.166:8080";

// Helper function to parse dates safely
function parseDate(value: string | { $date: string } | null | undefined): Date {
  if (!value) {
    return new Date(); // Return current date as fallback
  }
  
  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  if (typeof value === "object" && value.$date) {
    const date = new Date(value.$date);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  return new Date();
}

function formatDateTime(date: Date): string {
  const datePart = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

// Function to get source image and prompt file for a clip
function getClipSource(video: HistoryVideo, clipIndex: number) {
  if (!video.folders?.subfolders?.length) {
    return { sourceImage: "N/A", promptFile: "N/A" };
  }

  const parentFolder = video.originalName.replace(/\.zip$/i, "");
  const subfolders = video.folders.subfolders[0].subfolders ?? [];
  const subfolder = subfolders[clipIndex];

  if (!subfolder) {
    return { sourceImage: "N/A", promptFile: "N/A" };
  }

  const imageFile =
    subfolder.files?.find((f) => f.match(/\.(jpg|jpeg|png|gif)$/i)) ?? "";
  const txtFile = subfolder.files?.find((f) => f.endsWith(".txt")) ?? "";

  const basePath = video.extractPath.replace("./uploads/extracted/", "");
  const sourceImage = imageFile
    ? `${BASE_VIDEO_URL}/${basePath}/${parentFolder}/${subfolder.name}/${imageFile}`
    : "N/A";

  return { sourceImage, promptFile: txtFile };
}

function GeneratedClips({
  video,
  openModal,
}: {
  video: HistoryVideo;
  openModal: (clip: Clip, video: HistoryVideo, index: number) => void;
}) {
  const clips = video.clips ?? [];
  const hasClips = clips.some((c) => c.video);
  const videoId = video._id.$oid;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!hasClips) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
        ยังไม่มีคลิปที่สร้างขึ้นสำหรับวิดีโอนี้
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-lg border border-indigo-200 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h5 className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
              Generated Clips
            </h5>
            <p className="text-xs text-slate-500">
              {clips.filter((c) => c.video).length} clips available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full font-medium">
            {clips.filter((c) => c.video).length}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 animate-in slide-in-from-top duration-300">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clips
              .filter((c) => c.video)
              .map((clip, idx) => {
                const videoUrl = `${BASE_VIDEO_URL}/${clip.video}`;
                return (
                  <div
                    key={`${videoId}-clip-${idx}`}
                    className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors"
                  >
                    <video
                      src={videoUrl}
                      controls
                      className="w-full rounded-md mb-2 shadow-sm"
                      style={{ maxHeight: "160px" }}
                    />
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      <p className="text-xs text-slate-600 font-medium">
                        Clip {idx + 1}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Created: {clip.createdAt ? formatDateTime(parseDate(clip.createdAt)) : "Unknown"}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(clip, video, idx);
                      }}
                      className="w-full mt-1 px-2 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-xs text-slate-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      รายละเอียดเพิ่มเติม
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// FinalVideo Component
function FinalVideo({ video }: { video: HistoryVideo }) {
  const clips = video.clips ?? [];
  const hasFinal = clips.some((c) => c.finalVideo);

  if (!hasFinal) {
    return (
      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
        ยังไม่มี Final Video สำหรับวิดีโอนี้
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-lg border border-emerald-200">
      <h5 className="text-sm font-semibold text-slate-700 mb-2">Final Video</h5>
      <div className="grid md:grid-cols-2 gap-3">
        {clips
          .filter((c) => c.finalVideo)
          .map((clip, idx) => {
            const videoUrl = `${BASE_VIDEO_URL}/${clip.finalVideo}`;
            return (
              <div
                key={`final-${idx}`}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-semibold text-emerald-700">
                    Final Result
                  </span>
                </div>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-md mb-2 shadow-sm"
                  style={{ maxHeight: "180px" }}
                />
                <p className="text-xs text-emerald-600 font-medium">
                  Completed: {clip.createdAt ? formatDateTime(parseDate(clip.createdAt)) : "Unknown"}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// Main HistoryVideos Component
export default function HistoryVideos() {
  const [videos, setVideos] = useState<HistoryVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(""); // ค้นหาชื่อหรือ ID
  const [dateFrom, setDateFrom] = useState<string>(""); // วันที่เริ่มต้น
  const [dateTo, setDateTo] = useState<string>(""); // วันที่สิ้นสุด
  const [statusFilter, setStatusFilter] = useState<string>("all"); // สถานะ (all, completed, running, error)
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false); // Modal สำหรับตัวกรอง
  const [selectedClip, setSelectedClip] = useState<{
    index: number;
    clip: Clip;
    video: HistoryVideo;
  } | null>(null);

  const openModal = (clip: Clip, video: HistoryVideo, index: number) => {
    setSelectedClip({ clip, video, index });
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedClip(null);
    document.body.style.overflow = "unset";
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // ฟังก์ชันสำหรับกรองวิดีโอ
  const filteredVideos = videos.filter((video) => {
    const matchesSearchTerm =
      video.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.executionIdHistory?.executionId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const videoDate = parseDate(video.createdAt);
    const matchesDateFrom = dateFrom ? videoDate >= new Date(dateFrom) : true;
    const matchesDateTo = dateTo
      ? videoDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999))
      : true;

    const matchesStatus =
      statusFilter === "all" ||
      video.executionIdHistory?.workflowStatus === statusFilter ||
      video.status === statusFilter;

    return matchesSearchTerm && matchesDateFrom && matchesDateTo && matchesStatus;
  });

  useEffect(() => {
    const fetchHistory = async () => {
      const user = localStorage.getItem("loggedInUser");
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/history-videos?userId=${user}`);
        if (!res.ok) throw new Error("Failed to fetch history videos");

        const data: HistoryVideo[] = await res.json();
        const generatedVideos = data.filter((v) => v.executionIdHistory);
        setVideos(generatedVideos);
        
        console.log('Fetched videos:', generatedVideos);
        generatedVideos.forEach((video, index) => {
          console.log(`Video ${index + 1} clips:`, video.clips);
          console.log(`Video ${index + 1} has clips with video:`, video.clips.some(c => c.video));
        });
      } catch (error) {
        console.error(error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  // Clean up body overflow when component unmounts and on modal close
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedClip) {
        closeModal();
      }
    };

    if (selectedClip) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [selectedClip]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">
            Loading your videos...
          </p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No videos found
          </h3>
          <p className="text-slate-500">Start creating some amazing content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Video History
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อไฟล์หรือ ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm bg-white/70 backdrop-blur-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          {(searchTerm || dateFrom || dateTo || statusFilter !== "all") && (
            <div className="flex items-center justify-between">
              <p className="text-slate-600 ml-13">Track your video processing journey</p>
              <p className="text-sm text-slate-500">
                แสดง {filteredVideos.length} จาก {videos.length} วิดีโอ
              </p>
            </div>
          )}
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FunnelIcon className="w-6 h-6" />
                    <h2 className="text-xl font-bold">ตัวกรองวิดีโอ</h2>
                  </div>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จากวันที่
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        statusFilter === "all"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setStatusFilter("completed")}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        statusFilter === "completed"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      สำเร็จ
                    </button>
                    <button
                      onClick={() => setStatusFilter("running")}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        statusFilter === "running"
                          ? "bg-amber-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      กำลังดำเนินการ
                    </button>
                    <button
                      onClick={() => setStatusFilter("error")}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        statusFilter === "error"
                          ? "bg-rose-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ผิดพลาด
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setStatusFilter("all");
                    setShowFilterModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ล้างตัวกรอง
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                  ใช้ตัวกรอง
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map((video, index) => {
            const videoId = video._id.$oid;
            return (
              <div
                key={videoId}
                className="group bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl rounded-2xl border border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200 mb-2">
                        {video.originalName}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {video.createdAt ? formatDateTime(parseDate(video.createdAt)) : "Unknown date"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          video.executionIdHistory?.workflowStatus === "completed"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : video.executionIdHistory?.workflowStatus === "running"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : video.executionIdHistory?.workflowStatus === "error"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {video.executionIdHistory?.workflowStatus || video.status}
                      </span>
                    </div>
                  </div>

                  {video.executionIdHistory && (
                    <div className="mb-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-5 h-5 text-slate-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <h4 className="font-semibold text-slate-700">
                          Workflow Details
                        </h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">
                              ID:
                            </span>
                            <code className="bg-slate-200/50 px-2 py-1 rounded text-xs font-mono">
                              {video.executionIdHistory.executionId}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">
                              Status:
                            </span>
                            <span className="text-slate-700">
                              {video.executionIdHistory.workflowStatus}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">
                              Started:
                            </span>
                            <span className="text-slate-700">
                              {formatDateTime(
                                parseDate(video.executionIdHistory.startTime)
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium w-20">
                              Ended:
                            </span>
                            <span className="text-slate-700">
                              {formatDateTime(
                                parseDate(video.executionIdHistory.endTime)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <GeneratedClips video={video} openModal={openModal} />
                  <FinalVideo video={video} />
                </div>
              </div>
            );
          })}
        </div>

        {searchTerm && filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              ไม่พบวิดีโอที่ค้นหา
            </h3>
            <p className="text-slate-500 mb-4">
              ลองค้นหาด้วยคำอื่น หรือล้างการค้นหาเพื่อดูวิดีโอทั้งหมด
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}

        {selectedClip && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-4"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: "auto",
            }}
            onClick={handleBackdropClick}
          >
            <div
              className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white rounded-t-xl border-b border-slate-200 p-6 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">
                    รายละเอียดคลิป {selectedClip.index + 1}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 pt-4 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Source Image
                  </h4>
                  {(() => {
                    const { sourceImage } = getClipSource(
                      selectedClip.video,
                      selectedClip.index
                    );
                    return sourceImage !== "N/A" ? (
                      <img
                        src={sourceImage}
                        alt="Source"
                        className="w-full rounded-lg shadow border"
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                    ) : (
                      <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                        No source image available
                      </p>
                    );
                  })()}
                </div>
                {/* <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Prompt
                  </h4>
                  {(() => {
                    const parentFolder = selectedClip.video.originalName.replace(
                      /\.zip$/i,
                      ""
                    );
                    const subfolders =
                      selectedClip.video.folders?.subfolders?.[0]?.subfolders ??
                      [];
                    const subfolder = subfolders[selectedClip.index];
                    const txtFile = subfolder?.files?.find((f) =>
                      f.endsWith(".txt")
                    );
                    if (!txtFile) {
                      return (
                        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                          No prompt file available
                        </p>
                      );
                    }
                    const basePath = selectedClip.video.extractPath.replace(
                      "./uploads/extracted/",
                      ""
                    );
                    const promptUrl = `${BASE_VIDEO_URL}/${basePath}/${parentFolder}/${subfolder.name}/${txtFile}`;
                    return (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-600 mb-2">
                          Prompt file:{" "}
                          <code className="text-xs bg-slate-200 px-1 py-0.5 rounded">
                            {txtFile}
                          </code>
                        </p>
                        <iframe
                          src={promptUrl}
                          className="w-full rounded border bg-white text-sm overflow-hidden"
                          style={{ height: "100px" }}
                          title="Prompt content"
                        />
                      </div>
                    );
                  })()}
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
