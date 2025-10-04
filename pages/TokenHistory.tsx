import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  CurrencyDollarIcon, FunnelIcon, XMarkIcon, CalendarIcon, 
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, MagnifyingGlassIcon, 
  ChartBarIcon, PlusCircleIcon, MinusCircleIcon, ChevronLeftIcon, ChevronRightIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";

interface TokenEntry {
  _id?: { $oid: string };
  date: string;
  change: number;
  reason: string;
  type?: string;
  executionId?: string;
  folderName?: string;
  fileName?: string;
}

export default function TokenHistoryPage() {
  const router = useRouter();
  const [tokenHistory, setTokenHistory] = useState<TokenEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<TokenEntry[]>([]);
  const [tokens, setTokens] = useState<number>(0);
  const [reservedTokens, setReservedTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<TokenEntry | null>(null);
  
  const [statistics, setStatistics] = useState({
    totalIncome: 0,
    totalExpense: 0,
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [changeType, setChangeType] = useState<'all' | 'increase' | 'decrease'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser');
    if (!userId) {
      router.push('/login');
      return;
    }

    fetch(`/api/users/token-history?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setTokens(data.tokens);
        setReservedTokens(data.reservedTokens || 0);
        const history = data.tokenHistory.filter((entry: TokenEntry) => entry.change !== 0);
        setTokenHistory(history);
        setFilteredHistory(history);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading token history:', err);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    let income = 0;
    let expense = 0;
    
    tokenHistory.forEach(entry => {
      if (entry.change > 0) {
        income += entry.change;
      } else if (entry.change < 0) {
        expense += Math.abs(entry.change); 
      }
    });

    setStatistics({
      totalIncome: income,
      totalExpense: expense,
    });
  }, [tokenHistory]);

  useEffect(() => {
    let filtered = [...tokenHistory];

    if (dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => new Date(entry.date) <= endDate);
    }

    if (changeType === 'increase') {
      filtered = filtered.filter(entry => entry.change > 0);
    } else if (changeType === 'decrease') {
      filtered = filtered.filter(entry => entry.change < 0);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [dateFrom, dateTo, changeType, tokenHistory]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setChangeType('all');
  };

  const hasActiveFilters = dateFrom || dateTo || changeType !== 'all';

  const formatDateTH = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatTimeTH = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      'video_creation': 'สร้างวิดีโอ',
      'admin_adjustment': 'ปรับโดยแอดมิน',
      'purchase': 'ซื้อ Token',
      'refund': 'คืน Token',
    };
    return type ? types[type] || type : '-';
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              ประวัติการใช้ Token
            </h1>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  กำลังกรอง
                </span>
              )}
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FunnelIcon className="w-6 h-6" />
                <span className="font-medium">ตัวกรอง</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-xl p-3">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">ยอดคงเหลือ</h3>
<div className="flex items-center gap-3">
  <div className="flex items-baseline gap-2">
    <p className="text-3xl font-bold text-blue-600">{tokens}</p>
    <span className="text-sm text-gray-500">Tokens</span>
  </div>
  {reservedTokens > 0 && (
    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-md">
      <LockClosedIcon className="w-4 h-4 text-amber-600" />
      <span className="text-sm font-semibold text-amber-700">
        จอง {reservedTokens} Tokens
      </span>
    </div>
  )}
</div>

              {/* <h3 className="text-sm font-medium text-gray-600 mb-2">ยอดคงเหลือ</h3>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-600">{tokens}</p>
                  <span className="text-sm text-gray-500">Tokens</span>
                </div>
                {reservedTokens > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 bg-amber-50 px-2 py-1 rounded-md">
                    <LockClosedIcon className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">
                      จอง {reservedTokens} Tokens
                    </span>
                  </div>
                )}
              </div> */}
            </div>
           
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 rounded-xl p-3">
                  <PlusCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Tokens ที่ได้รับ (+)</h3>
              <p className="text-3xl font-bold text-green-600">+{statistics.totalIncome}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-100 rounded-xl p-3">
                  <MinusCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Tokens ที่ใช้ไป (−)</h3>
              <p className="text-3xl font-bold text-red-600">-{statistics.totalExpense}</p>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">กรองตาม:</span>
                {dateFrom && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    จาก {formatDateTH(dateFrom)}
                  </span>
                )}
                {dateTo && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    ถึง {formatDateTH(dateTo)}
                  </span>
                )}
                {changeType !== 'all' && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {changeType === 'increase' ? 'เพิ่ม (+)' : 'ลด (-)'}
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-2"
                >
                  ล้างทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between flex-wrap gap-4 px-4 sm:px-6">
          <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            แสดง <span className="font-semibold text-blue-600">{indexOfFirstItem + 1}-{indexOfLastItem > filteredHistory.length ? filteredHistory.length : indexOfLastItem}</span> จาก <span className="text-gray-500">{filteredHistory.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                ตารางประวัติการเปลี่ยนแปลง Token
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/5 min-w-[120px]">รายการ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6 min-w-[100px]">วันที่</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6 min-w-[80px]">เวลา</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6 min-w-[100px]">จำนวน</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6 min-w-[80px]">ดูเพิ่มเติม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((entry, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-1/5 min-w-[120px]">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.type ? getTypeLabel(entry.type) : (entry.change > 0 ? 'เพิ่ม Token' : 'ลด Token')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/6 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{formatDateTH(entry.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/6 min-w-[80px]">
                        <span className="text-sm text-gray-600">{formatTimeTH(entry.date)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/6 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          {entry.change > 0 ? (
                            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                          )}
                          <span className={`text-lg font-bold ${entry.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.change > 0 ? '+' : ''}{entry.change}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center w-1/6 min-w-[80px]">
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                          ดูเพิ่มเติม
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showFilterModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2">
                      <FunnelIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">ตัวกรองข้อมูล</h2>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">จากวันที่</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ถึงวันที่</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทการเปลี่ยนแปลง</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setChangeType('all')}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${changeType === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setChangeType('increase')}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${changeType === 'increase' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      เพิ่ม +
                    </button>
                    <button
                      onClick={() => setChangeType('decrease')}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${changeType === 'decrease' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      ลด -
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => {
                    clearFilters();
                    setShowFilterModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ล้างตัวกรอง
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  ใช้ตัวกรอง
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedEntry && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div
  className={`bg-gradient-to-r ${
    selectedEntry.change > 0
      ? 'from-green-400 to-emerald-500'
      : 'from-red-400 to-rose-500'
  } text-white p-6`}
>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3">
                      {selectedEntry.change > 0 ? (
                        <ArrowTrendingUpIcon className="w-7 h-7" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">รายละเอียด</h2>
                      <p className="text-white text-opacity-90 text-sm mt-1">
                        {formatDateTH(selectedEntry.date)} • {formatTimeTH(selectedEntry.date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-white/90" />
                  </button>
                </div>

                <div className="bg-white/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm mb-1 drop-shadow-sm">จำนวนที่เปลี่ยนแปลง</p>
                    <p className="text-4xl font-bold text-white drop-shadow-sm">
                      {selectedEntry.change > 0 ? '+' : ''}{selectedEntry.change}
                      <span className="text-xl ml-2 font-normal text-white drop-shadow-sm">Tokens</span>
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm mb-1 drop-shadow-sm">สาเหตุ</p>
                    {selectedEntry.reason && selectedEntry.reason.trim() ? (
                      <p className="text-white text-sm line-clamp-3 drop-shadow-sm">{selectedEntry.reason}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {(selectedEntry.executionId?.trim() || selectedEntry.folderName?.trim() || selectedEntry.fileName?.trim() || selectedEntry._id?.$oid) && (
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)] space-y-4">
                  {(selectedEntry.executionId?.trim() || selectedEntry.folderName?.trim() || selectedEntry.fileName?.trim()) && (
                    <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">ข้อมูลเพิ่มเติม</h3>
                      {selectedEntry.executionId?.trim() && <DetailRow label="Execution ID" value={selectedEntry.executionId} />}
                      {selectedEntry.folderName?.trim() && <DetailRow label="โฟลเดอร์" value={selectedEntry.folderName} icon="📁" />}
                      {selectedEntry.fileName?.trim() && <DetailRow label="ไฟล์" value={selectedEntry.fileName} icon="📄" />}
                    </div>
                  )}
                  {selectedEntry._id?.$oid && (
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-700 mb-1">Record ID</p>
                      <p
                        className="text-xs font-mono text-gray-700 break-all cursor-pointer hover:underline"
                        onClick={() => navigator.clipboard.writeText(selectedEntry._id?.$oid || '')}
                        title="คลิกเพื่อคัดลอก"
                      >
                        {selectedEntry._id?.$oid}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value?: string | null; icon?: string }) {
  const displayValue = value?.trim() || '-';
  if (!value?.trim()) return null;
  
  return (
    <div className="flex items-start gap-3">
      <div className="text-xs font-semibold text-gray-600 min-w-[90px]">
        {icon && <span className="mr-1">{icon}</span>}
        {label}:
      </div>
      <div className="text-xs text-gray-900 flex-1">{displayValue}</div>
    </div>
  );
}