// app/api/get-user-files/route.ts

import { S3Client, GetObjectCommand, ListObjectsV2Command, _Object } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// 1. ตั้งค่า S3 Client (เหมือนเดิม)
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!, 
  },
});

const BUCKET_NAME = process.env.MY_S3_BUCKET_NAME!;

// --- (ส่วนที่เพิ่ม) Helper Functions ---
const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()! : 'unknown';
};
// ------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 2. List ไฟล์ (เหมือนเดิม)
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${userId}/`,
    });

    const listResult = await s3Client.send(listCommand);
    const allFiles = listResult.Contents || [];
    
    // กรองโฟลเดอร์เปล่าๆ ออก
    const validFiles = allFiles.filter(file => file.Size! > 0);

    if (validFiles.length === 0) {
      // ถ้าไม่มีไฟล์ ก็ส่งค่าสถิติเริ่มต้นกลับไป
      return NextResponse.json({ 
        stats: {
          totalCount: 0,
          totalSizeMB: 0,
          lastModified: null,
          fileTypes: {}
        },
        files: [] 
      });
    }

    // --- 3. (ส่วนที่เพิ่ม) คำนวณสถิติ ---
    const totalCount = validFiles.length;
    
    const totalSizeInBytes = validFiles.reduce((sum, file) => sum + file.Size!, 0);
    const totalSizeMB = bytesToMB(totalSizeInBytes);
    
    const lastModified = new Date(
      Math.max(...validFiles.map(file => file.LastModified!.getTime()))
    ).toISOString();
    
    const fileTypes = validFiles.reduce((acc, file) => {
      const ext = getFileExtension(file.Key!);
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const stats = { totalCount, totalSizeMB, lastModified, fileTypes };
    // ------------------------------------

    // 4. สร้าง Presigned URLs (เหมือนเดิม)
    const files = await Promise.all(
      validFiles.map(async (file) => {
        const key = file.Key!;
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ResponseContentDisposition: 'attachment', 
        });
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        
        return {
          fileName: key.split('/').pop()!,
          url: url,
        };
      })
    );

    // 5. ส่งทั้ง "stats" และ "files" กลับไป
    return NextResponse.json({ stats, files });

  } catch (error) {
    console.error("Error in get-user-files API:", error);
    return NextResponse.json({ error: "Could not list files" }, { status: 500 });
  }
}