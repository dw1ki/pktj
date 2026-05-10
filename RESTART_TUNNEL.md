# 🚀 Restart Cloudflare Tunnel - Step by Step

## ⚠️ IMPORTANT: Stop the old tunnel first, then restart with new config

### STEP 1: Buka Terminal PowerShell (sebagai Admin)
```powershell
# Buka Windows PowerShell sebagai Administrator
```

### STEP 2: Navigate ke folder yolo
```powershell
cd "d:\SKRIPSIKU\Aplikasi Kinerja Ruas Jalan\pktj\backend\yolo"
```

### STEP 3: Kill the old tunnel process (if running)
```powershell
# Kill cloudflared.exe process
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
```

### STEP 4: Wait 5 seconds untuk cleanup
```powershell
Start-Sleep -Seconds 5
```

### STEP 5: Start tunnel dengan config baru
```powershell
.\cloudflared.exe tunnel run yolo-api --config config.yml
```

### Expected Output:
```
2025-01-01 12:00:00 INF Your configuration file at: config.yml
2025-01-01 12:00:01 INF Protocol: http2
2025-01-01 12:00:02 INF +---+---+---+---+---+---+
2025-01-01 12:00:02 INF | Connecting to yolo-api...
2025-01-01 12:00:03 INF +---+---+---+---+---+---+
2025-01-01 12:00:04 INF Route yoloapi.my.id successfully created
2025-01-01 12:00:05 INF Connection established with 4 edge servers
```

### Verify the tunnel is working:
- Buka browser: https://yoloapi.my.id/health
- Harus return: `{"status":"healthy","device":"cuda"...}`

---

## 🧪 TESTING: Upload Video Besar

Setelah tunnel restart, test dengan video besar (80MB+):

### Test dengan curl atau Postman:
```bash
# 1. Get JWT token dari frontend login
# 2. Upload video ke /api/detect dengan token

# Curl example:
curl -X POST http://localhost:5000/api/detect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@KM29_00-01_80MB.mp4"

# Expected: Status 202 dengan job_id
# {
#   "success": true,
#   "id": "detection_123",
#   "jobId": "yolo_job_456"
# }
```

### Test dari Frontend:
1. Login ke aplikasi di localhost:3001
2. Pergi ke halaman "Deteksi"
3. Upload video 80MB
4. Lihat console logs untuk verify:
   - `✅ [YOLO Health] API is healthy`
   - `📤 [YOLO] Uploading...` (progress 0-100%)
   - `✅ Job completed` (setelah 5-10 menit processing)

---

## 📊 Monitoring Logs

### Monitor Cloudflare tunnel:
- Lihat output dari terminal tempat tunnel berjalan
- Cari "context canceled" errors - seharusnya tidak ada lagi

### Monitor Backend:
```bash
# Lihat logs dari Railway
railway logs

# Atau jika local:
npm run dev
```

### Monitor Frontend:
- Buka browser console (F12)
- Lihat polling logs: `📊 Poll 1: 5% - Processing...`
- Seharusnya tidak ada lebih dari 300 polling attempts (10 menit max)

---

## ✅ Expected Behavior Setelah Implementasi

### Sebelum (Bermasalah):
```
🚀 Uploading 80MB file...
❌ 502 Bad Gateway (tunnel timeout)
🔴 Polling 1, 2, 3... 100, 101... (tidak pernah selesai)
❌ Context canceled error di Cloudflare
```

### Sesudah (Sudah diperbaiki):
```
🚀 Uploading 80MB file...
✅ Upload complete (600s timeout memungkinkan)
✅ Polling 1, 2, 3... (every 2-15 seconds)
✅ Job 50% - Processing...
✅ Job 100% - Complete!
✅ Video dengan deteksi ditampilkan
```

---

## 🔧 Troubleshooting

### Jika tunnel tidak bisa start:
1. **Check port 8000**: Pastikan Python API berjalan di localhost:8000
   ```powershell
   # Test Python API
   curl http://localhost:8000/health
   ```

2. **Check cloudflared.exe**: Pastikan di folder backend/yolo/
   ```powershell
   ls backend/yolo/cloudflared.exe
   ```

3. **Check config.yml syntax**: 
   ```powershell
   # Verify YAML syntax
   cat backend/yolo/config.yml
   ```

### Jika polling still timeout (>10 minutes):
1. Video mungkin terlalu besar atau model terlalu complex
2. Check backend processing logs untuk stuck jobs
3. Restart Python API: `python -m uvicorn api:app --port 8000`

---

## 📝 Config File Details

**File**: `backend/yolo/config.yml`

**New Timeout Settings**:
- `connectTimeout: 600s` - 10 menit untuk initial connection
- `readTimeout: 600s` - 10 menit untuk read timeout
- `writeTimeout: 600s` - 10 menit untuk write timeout  
- `keepAliveTimeout: 600s` - 10 menit untuk keep-alive
- `tcpKeepAlive: 30s` - 30 seconds untuk TCP keep-alive packets

**Why these values?**
- Largest test video: 80MB
- Upload speed (typical): 10-20 Mbps
- Maximum upload time: 80MB / 10Mbps = 64 seconds
- Buffer added for network variance: 600 seconds = 10 minutes
- Processing time for 1 hour video: 55 minutes max
- Polling timeout: 10 minutes (if still not done, report error)

---

## ✅ Verification Checklist

After restarting tunnel:

- [ ] Tunnel shows "Connection established"
- [ ] https://yoloapi.my.id/health returns {"status":"healthy"}
- [ ] Backend health check passes: GET /api/detect/health/yolo
- [ ] Upload 20MB video → completes in 2 minutes ✅
- [ ] Upload 50MB video → completes in 5-8 minutes ✅  
- [ ] Upload 80MB video → completes in 5-15 minutes ✅
- [ ] Frontend shows max 300 polls (10 minute max) ✅
- [ ] No "context canceled" errors in tunnel logs ✅
- [ ] No 502 errors in backend logs ✅

Once all checks pass, the tunnel timeout issue should be RESOLVED! 🎉

