import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";

interface TokenEntry {
  date: string;
  change: number;
  reason: string;
}

export default function TokenHistoryPage() {
  const router = useRouter();
  const [tokenHistory, setTokenHistory] = useState<TokenEntry[]>([]);
  const [tokens, setTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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
        setTokenHistory(data.tokenHistory);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading token history:', err);
        setLoading(false);
      });
  }, [router]);

  const formatDateTH = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <p className="py-6 text-center text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg font-sans">
      {/* <button
        onClick={() => router.back()}
        className="mb-6 px-5 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <span className="text-xl">&#8592;</span> ย้อนกลับ
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">ประวัติการใช้ Token</h1> */}
      {/* <p className="text-xl font-medium text-gray-700 mb-8">
        ยอดคงเหลือ: <span className="text-blue-600">{tokens}</span> Tokens
      </p> */}
      <p className="text-xl font-medium text-gray-700 mb-8 flex items-center justify-center space-x-2">
        <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
        <span>{tokens} Token{tokens === 1 ? "" : "s"}</span>
      </p>

      {tokenHistory.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-20">ไม่มีประวัติการใช้ Token</p>
      ) : (
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="py-3 px-6 font-medium">วันที่</th>
              <th className="py-3 px-6 font-medium">จำนวน</th>
              <th className="py-3 px-6 font-medium">สาเหตุ</th>
            </tr>
          </thead>
          <tbody>
  {tokenHistory
    .filter(entry => entry.change !== 0) // กรองไม่เอาแถวที่ change = 0
    .map((entry, idx) => (
      <tr
        key={idx}
        className={`transition hover:bg-gray-100 ${
          idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <td className="py-4 px-6 text-gray-700">{formatDateTH(entry.date)}</td>
        <td
          className={`py-4 px-6 font-semibold text-lg ${
            entry.change > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {entry.change > 0 ? `+${entry.change}` : entry.change}
        </td>
        <td className="py-4 px-6 text-gray-600">{entry.reason}</td>
      </tr>
  ))}
</tbody>

        </table>
      )}
    </div>
  );
}