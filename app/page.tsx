'use client';

import { MessageSquareHeart } from "lucide-react";
import { useEffect, useState } from "react";
import liff from '@line/liff';

// สร้าง Type สำหรับเก็บข้อมูลโปรไฟล์
type Profile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

type S3File = {
  fileName: string;
  url: string;
};

// --- Type สำหรับสถิติ ---
type Stats = {
  totalCount: number;
  totalSizeMB: number;
  lastModified: string | null;
  fileTypes: Record<string, number>;
};

export default function LoginPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // -- (เพิ่ม State นี้) --
  const [userFiles, setUserFiles] = useState<S3File[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // --- (ส่วนที่เพิ่ม) State สำหรับสถิติ ---
  const [stats, setStats] = useState<Stats | null>(null);

  // -- (เพิ่มฟังก์ชันนี้) --
  // ฟังก์ชันสำหรับดึงไฟล์จาก S3 โดยใช้ userId
  const fetchUserFiles = async (userId: string) => {
    console.log('Fetching files for user:', userId);
    setFilesLoading(true);
    try {
      // ยิงไปที่ API Route ใหม่ที่เราสร้าง โดยส่ง userId ไปด้วย
      const response = await fetch(`/api/get-user-files?userId=${userId}`);
      const data = await response.json();

      if (data.files && data.stats) {
        setUserFiles(data.files);
        setStats(data.stats); // <--- เก็บสถิติ
        console.log('Got stats:', data.stats);
        console.log('Got files:', data.files);
      } else {
        console.error("Failed to get S3 data:", data.error);
        setError(`Failed to load files: ${data.error}`);
      }
    } catch (e: any) {
      console.error("Error fetching S3 files:", e);
      setError(`Error fetching files: ${e.message}`);
    }
    setFilesLoading(false);
  };

  useEffect(() => {
    // ฟังก์ชันสำหรับ Initialize LIFF
    const initLiff = async () => {
      console.log('Starting LIFF init...'); // Debug
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

        if (!liffId) {
          console.error('LIFF ID is missing. Check your env variables.');
          setError('LIFF ID is missing.');
          return;
        }
        console.log('Using LIFF ID:', liffId); // Debug

        await liff.init({ liffId: liffId });
        console.log('LIFF init successful.'); // Debug

        // ตรวจสอบสถานะการล็อกอิน
        if (liff.isLoggedIn()) {
          console.log('User is logged in. Getting profile...'); // Debug
          setIsLoggedIn(true);
          const userProfile = await liff.getProfile();
          setProfile(userProfile);

          // --- Log ที่คุณต้องการ ---
          console.log('LIFF LOGIN SUCCESSFUL!');
          console.log('Full Profile Object:', userProfile);
          console.log('User ID:', userProfile.userId);
          // -----------------------

          await fetchUserFiles(userProfile.userId);

        } else {
          console.log('User is NOT logged in.'); // Debug
          setIsLoggedIn(false);
        }
      } catch (e: any) {
        console.error('LIFF INIT FAILED:', e);
        setError(`LIFF init failed: ${e.message}`);
      }
    };

    initLiff();
  }, []);

  // ฟังก์ชันสำหรับล็อกอิน
  const handleLogin = () => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  };

  // ฟังก์ชันสำหรับล็อกเอาท์
  const handleLogout = () => {
    liff.logout();
    window.location.reload();
  };

  // ถ้ายังไม่ล็อกอิน ให้แสดงหน้า Login
  if (!isLoggedIn) {
    return (
      <main 
        className="flex min-h-screen flex-col items-center justify-center 
                   bg-gradient-to-br from-purple-200 via-pink-200 to-red-200">
        <div className="w-full max-w-md p-8 pt-10 space-y-6 bg-white/30 rounded-lg shadow-sm">
          <div className="text-center mb-6">
              <h1 className="text-4xl font-semibold text-orange-500">
                  🍊น้องส้มจี๊ด
                  <span className="text-3xl text-pink-500"> ...ยินดีต้อนรับ!</span>
              </h1>
          </div>

          {/* ส่วนฟอร์ม Username/Password (ยังไม่เชื่อม LIFF) */}
          <form onSubmit={(e) => {
              e.preventDefault(); 
              alert('ฟังก์ชันล็อกอินด้วยชื่อผู้ใช้ยังไม่เสร็จสมบูรณ์');
            }} className="space-y-6">
            <div>
              <label htmlFor="username" className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
              <input id="username" name="username" type="text" required className="w-full px-3 py-2 mt-1 bg-white/70 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input id="password" name="password" type="password" required className="w-full px-3 py-2 mt-1 bg-white/70 rounded-md shadow-sm"/>
            </div>
            <div>
              <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 rounded-md">
                เข้าสู่ระบบ
              </button>
            </div>
          </form>

          {/* Separator */}
          <div className="flex items-center justify-center">
            <div className="flex-grow border-t border-gray-400"></div>
            <span className="px-4 text-sm text-gray-500">หรือ</span>
            <div className="flex-grow border-t border-gray-400"></div>
          </div>

          {/* Login with Line Button */}
          <div>
            <button
              onClick={handleLogin}
              type="button"
              className="w-full px-4 py-2 font-semibold text-white bg-emerald-500 rounded-md hover:shadow-lg hover:opacity-80"
            >
              <MessageSquareHeart className="text-white inline-block mr-2" /> เข้าสู่ระบบด้วย LINE
            </button>
          </div>

          {/* แสดง Error (ถ้ามี) */}
          {error && (
            <div className="w-full max-w-md p-4 mt-6 bg-red-100 text-red-700 rounded-lg">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ถ้าล็อกอินแล้ว (isLoggedIn === true) ให้แสดงข้อมูลโปรไฟล์
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center 
                 bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 p-6">
      
      {/* ส่วนแสดงโปรไฟล์ (เหมือนเดิม) */}
      <div className="w-full max-w-md p-8 space-y-4 bg-white/50 rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-semibold text-gray-800">ยินดีต้อนรับ!</h2>
        {profile ? (
          <>
            <img src={profile.pictureUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto" />
            <p className="text-gray-800"><strong>Display Name:</strong> {profile.displayName}</p>
            <p className="text-gray-800"><strong>User ID:</strong> {profile.userId}</p>
          </>
        ) : (
          <p className="text-gray-800">กำลังโหลดข้อมูล...</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* --- (ส่วนแสดงสถิติที่เพิ่มเข้ามา) --- */}
      <div className="w-full max-w-md mt-6 p-8 space-y-4 bg-white/50 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800">Dashboard สถิติ</h3>
        {filesLoading && <p className="text-gray-600">กำลังโหลดสถิติ...</p>}
        {stats && !filesLoading && (
          <div className="grid grid-cols-2 gap-4">
            {/* Card: จำนวนไฟล์ */}
            <div className="bg-white/70 p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">จำนวนไฟล์ทั้งหมด</div>
              <div className="text-3xl font-bold text-sky-700">{stats.totalCount}</div>
            </div>
            
            {/* Card: ขนาดรวม */}
            <div className="bg-white/70 p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">ขนาดไฟล์รวม</div>
              <div className="text-3xl font-bold text-emerald-600">{stats.totalSizeMB} <span className="text-xl">MB</span></div>
            </div>
            
            {/* Card: ประเภทไฟล์ */}
            <div className="col-span-2 bg-white/70 p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">ประเภทไฟล์</div>
              {Object.keys(stats.fileTypes).length > 0 ? (
                <ul className="list-disc list-inside mt-2">
                  {Object.entries(stats.fileTypes).map(([ext, count]) => (
                    <li key={ext} className="text-gray-700">
                      <span className="font-semibold uppercase">{ext}</span>: {count} ไฟล์
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">ไม่พบข้อมูล</p>
              )}
            </div>

            {/* Card: อัปเดตล่าสุด */}
            <div className="col-span-2 bg-white/70 p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">ไฟล์ล่าสุด</div>
              <div className="text-lg font-semibold text-gray-800">
                {stats.lastModified ? new Date(stats.lastModified).toLocaleString('th-TH') : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- (ส่วนแสดงรายการไฟล์ที่เพิ่มเข้ามา) --- */}
      <div className="w-full max-w-md mt-6 p-8 space-y-4 bg-white/50 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800">ไฟล์ของคุณจาก S3</h3>
        {filesLoading && (
          <p className="text-gray-600">กำลังค้นหาไฟล์...</p>
        )}
        
        {!filesLoading && userFiles.length === 0 && (
          <p className="text-gray-500">ไม่พบไฟล์ในโฟลเดอร์ของคุณ</p>
        )}

        {userFiles.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ชื่อไฟล์</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">ดาวน์โหลด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userFiles.map((file, index) => (
                  <tr key={file.fileName} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        <span>{file.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={file.url}
                        download
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                      >
                        ดาวน์โหลด
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </main>
  );
}