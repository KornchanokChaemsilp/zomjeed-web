// app/api/get-user-files/route.ts

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// 1. ตั้งค่า S3 Client ให้ใช้กุญแจชั่วคราว (เหมือนเดิม)
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!, 
  },
});

const BUCKET_NAME = process.env.MY_S3_BUCKET_NAME!;

export async function GET(request: Request) {
  try {
    // 2. ดึง userId จาก query string (เช่น ?userId=U123...)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 3. (S3 Call 1) - List ไฟล์ทั้งหมดในโฟลเดอร์ของ User
    console.log(`Listing files for prefix: ${userId}/`);
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${userId}/`, // <-- ใช้ userId เป็นชื่อโฟลเดอร์
    });

    const listResult = await s3Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return NextResponse.json({ files: [] }); // คืนค่าอาร์เรย์ว่าง ถ้าไม่มีไฟล์
    }

    // 4. (S3 Call 2) - สร้าง Presigned URL สำหรับ *ทุก* ไฟล์ที่เจอ
    const files = await Promise.all(
      listResult.Contents
        .filter(file => file.Size! > 0) // กรองเอาโฟลเดอร์เปล่าๆ ออก
        .map(async (file) => {
          const key = file.Key!;
          
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            // (สำคัญ!) บังคับให้เป็น "ดาวน์โหลด" แทนการ "เปิด" ในเบราว์เซอร์
            ResponseContentDisposition: 'attachment', 
          });

          const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // 1 ชั่วโมง
          
          return {
            fileName: key.split('/').pop()!, // เอาเฉพาะชื่อไฟล์ (เช่น 'report.pdf')
            url: url,
          };
        })
    );

    return NextResponse.json({ files: files });

  } catch (error) {
    console.error("Error in get-user-files API:", error);
    return NextResponse.json({ error: "Could not list files" }, { status: 500 });
  }
}