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

export default function LoginPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // ถ้
  // ถ้าล็อกอินแล้ว (isLoggedIn === true) ให้แสดงข้อมูลโปรไฟล์
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center 
                 bg-gradient-to-br from-green-200 via-blue-200 to-purple-200">
      <div className="w-full max-w-md p-8 mt-6 space-y-4 bg-white/50 rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-semibold text-gray-800">ยินดีต้อนรับ!</h2>
        {profile ? (
          <>
            <img src={profile.pictureUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto" />
            <p><strong>Display Name:</strong> {profile.displayName}</p>
            <p><strong>User ID:</strong> {profile.userId}</p>
            <p><strong>Status Message:</strong> {profile.statusMessage || 'N/A'}</p>
          </>
        ) : (
          <p>กำลังโหลดข้อมูล...</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
        >
          ออกจากระบบ
        </button>
      </div>
    </main>
  );
}