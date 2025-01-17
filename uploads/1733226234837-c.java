package q8;

import android.content.Context;
import android.content.pm.PackageManager;
import android.net.TrafficStats;
import android.text.TextUtils;
import android.util.JsonReader;
import android.util.Log;
import com.google.firebase.installations.FirebaseInstallationsException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.Charset;
import java.util.concurrent.ExecutionException;
import java.util.regex.Pattern;
import java.util.zip.GZIPOutputStream;
import l8.j;
import n8.b;
import org.json.JSONException;
import org.json.JSONObject;
import q8.d;
import q8.f;
import u4.q;
import z4.a;
import z4.i;

public class c {

    /* renamed from: d  reason: collision with root package name */
    private static final Pattern f15010d = Pattern.compile("[0-9]+s");

    /* renamed from: e  reason: collision with root package name */
    private static final Charset f15011e = Charset.forName("UTF-8");

    /* renamed from: a  reason: collision with root package name */
    private final Context f15012a;

    /* renamed from: b  reason: collision with root package name */
    private final b f15013b;

    /* renamed from: c  reason: collision with root package name */
    private final e f15014c = new e();

    public c(Context context, b bVar) {
        this.f15012a = context;
        this.f15013b = bVar;
    }

    private static String a(String str, String str2, String str3) {
        String str4;
        Object[] objArr = new Object[3];
        objArr[0] = str2;
        objArr[1] = str3;
        if (TextUtils.isEmpty(str)) {
            str4 = "";
        } else {
            str4 = ", " + str;
        }
        objArr[2] = str4;
        return String.format("Firebase options used while communicating with Firebase server APIs: %s, %s%s", objArr);
    }

    private static JSONObject b(String str, String str2) {
        try {
            JSONObject jSONObject = new JSONObject();
            jSONObject.put("fid", str);
            jSONObject.put("appId", str2);
            jSONObject.put("authVersion", "FIS_v2");
            jSONObject.put("sdkVersion", "a:17.0.1");
            return jSONObject;
        } catch (JSONException e10) {
            throw new IllegalStateException(e10);
        }
    }

    private static JSONObject c() {
        try {
            JSONObject jSONObject = new JSONObject();
            jSONObject.put("sdkVersion", "a:17.0.1");
            JSONObject jSONObject2 = new JSONObject();
            jSONObject2.put("installation", jSONObject);
            return jSONObject2;
        } catch (JSONException e10) {
            throw new IllegalStateException(e10);
        }
    }

    private String f() {
        try {
            Context context = this.f15012a;
            byte[] a10 = a.a(context, context.getPackageName());
            if (a10 != null) {
                return i.c(a10, false);
            }
            Log.e("ContentValues", "Could not get fingerprint hash for package: " + this.f15012a.getPackageName());
            return null;
        } catch (PackageManager.NameNotFoundException e10) {
            Log.e("ContentValues", "No such package: " + this.f15012a.getPackageName(), e10);
            return null;
        }
    }

    private URL g(String str) {
        try {
            return new URL(String.format("https://%s/%s/%s", new Object[]{"firebaseinstallations.googleapis.com", "v1", str}));
        } catch (MalformedURLException e10) {
            throw new FirebaseInstallationsException(e10.getMessage(), FirebaseInstallationsException.a.UNAVAILABLE);
        }
    }

    private static byte[] h(JSONObject jSONObject) {
        return jSONObject.toString().getBytes("UTF-8");
    }

    private static boolean i(int i10) {
        return i10 >= 200 && i10 < 300;
    }

    private static void j() {
        Log.e("Firebase-Installations", "Firebase Installations can not communicate with Firebase server APIs due to invalid configuration. Please update your Firebase initialization process and set valid Firebase options (API key, Project ID, Application ID) when initializing Firebase.");
    }

    private static void k(HttpURLConnection httpURLConnection, String str, String str2, String str3) {
        String o10 = o(httpURLConnection);
        if (!TextUtils.isEmpty(o10)) {
            Log.w("Firebase-Installations", o10);
            Log.w("Firebase-Installations", a(str, str2, str3));
        }
    }

    private HttpURLConnection l(URL url, String str) {
        try {
            HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
            httpURLConnection.setConnectTimeout(10000);
            httpURLConnection.setUseCaches(false);
            httpURLConnection.setReadTimeout(10000);
            httpURLConnection.addRequestProperty("Content-Type", "application/json");
            httpURLConnection.addRequestProperty("Accept", "application/json");
            httpURLConnection.addRequestProperty("Content-Encoding", "gzip");
            httpURLConnection.addRequestProperty("Cache-Control", "no-cache");
            httpURLConnection.addRequestProperty("X-Android-Package", this.f15012a.getPackageName());
            j jVar = (j) this.f15013b.get();
            if (jVar != null) {
                try {
                    httpURLConnection.addRequestProperty("x-firebase-client", (String) u5.j.a(jVar.a()));
                } catch (ExecutionException e10) {
                    Log.w("ContentValues", "Failed to get heartbeats header", e10);
                } catch (InterruptedException e11) {
                    Thread.currentThread().interrupt();
                    Log.w("ContentValues", "Failed to get heartbeats header", e11);
                }
            }
            httpURLConnection.addRequestProperty("X-Android-Cert", f());
            httpURLConnection.addRequestProperty("x-goog-api-key", str);
            return httpURLConnection;
        } catch (IOException unused) {
            throw new FirebaseInstallationsException("Firebase Installations Service is unavailable. Please try again later.", FirebaseInstallationsException.a.UNAVAILABLE);
        }
    }

    static long m(String str) {
        q.b(f15010d.matcher(str).matches(), "Invalid Expiration Timestamp.");
        if (str == null || str.length() == 0) {
            return 0;
        }
        return Long.parseLong(str.substring(0, str.length() - 1));
    }

    private d n(HttpURLConnection httpURLConnection) {
        InputStream inputStream = httpURLConnection.getInputStream();
        JsonReader jsonReader = new JsonReader(new InputStreamReader(inputStream, f15011e));
        f.a a10 = f.a();
        d.a a11 = d.a();
        jsonReader.beginObject();
        while (jsonReader.hasNext()) {
            String nextName = jsonReader.nextName();
            if (nextName.equals("name")) {
                a11.f(jsonReader.nextString());
            } else if (nextName.equals("fid")) {
                a11.c(jsonReader.nextString());
            } else if (nextName.equals("refreshToken")) {
                a11.d(jsonReader.nextString());
            } else if (nextName.equals("authToken")) {
                jsonReader.beginObject();
                while (jsonReader.hasNext()) {
                    String nextName2 = jsonReader.nextName();
                    if (nextName2.equals("token")) {
                        a10.c(jsonReader.nextString());
                    } else if (nextName2.equals("expiresIn")) {
                        a10.d(m(jsonReader.nextString()));
                    } else {
                        jsonReader.skipValue();
                    }
                }
                a11.b(a10.a());
                jsonReader.endObject();
            } else {
                jsonReader.skipValue();
            }
        }
        jsonReader.endObject();
        jsonReader.close();
        inputStream.close();
        return a11.e(d.b.OK).a();
    }

    /* JADX WARNING: Missing exception handler attribute for start block: B:20:0x0050 */
    /* Code decompiled incorrectly, please refer to instructions dump. */
    private static java.lang.String o(java.net.HttpURLConnection r7) {
        /*
            java.io.InputStream r0 = r7.getErrorStream()
            r1 = 0
            if (r0 != 0) goto L_0x0008
            return r1
        L_0x0008:
            java.io.BufferedReader r2 = new java.io.BufferedReader
            java.io.InputStreamReader r3 = new java.io.InputStreamReader
            java.nio.charset.Charset r4 = f15011e
            r3.<init>(r0, r4)
            r2.<init>(r3)
            java.lang.StringBuilder r0 = new java.lang.StringBuilder     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            r0.<init>()     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
        L_0x0019:
            java.lang.String r3 = r2.readLine()     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            if (r3 == 0) goto L_0x002a
            r0.append(r3)     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            r3 = 10
            r0.append(r3)     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            goto L_0x0019
        L_0x0028:
            r7 = move-exception
            goto L_0x004c
        L_0x002a:
            java.lang.String r3 = "Error when communicating with the Firebase Installations server API. HTTP response: [%d %s: %s]"
            r4 = 3
            java.lang.Object[] r4 = new java.lang.Object[r4]     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            int r5 = r7.getResponseCode()     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            java.lang.Integer r5 = java.lang.Integer.valueOf(r5)     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            r6 = 0
            r4[r6] = r5     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            java.lang.String r7 = r7.getResponseMessage()     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            r5 = 1
            r4[r5] = r7     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            r7 = 2
            r4[r7] = r0     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            java.lang.String r7 = java.lang.String.format(r3, r4)     // Catch:{ IOException -> 0x0050, all -> 0x0028 }
            r2.close()     // Catch:{ IOException -> 0x004b }
        L_0x004b:
            return r7
        L_0x004c:
            r2.close()     // Catch:{ IOException -> 0x004f }
        L_0x004f:
            throw r7
        L_0x0050:
            r2.close()     // Catch:{ IOException -> 0x0053 }
        L_0x0053:
            return r1
        */
        throw new UnsupportedOperationException("Method not decompiled: q8.c.o(java.net.HttpURLConnection):java.lang.String");
    }

    private f p(HttpURLConnection httpURLConnection) {
        InputStream inputStream = httpURLConnection.getInputStream();
        JsonReader jsonReader = new JsonReader(new InputStreamReader(inputStream, f15011e));
        f.a a10 = f.a();
        jsonReader.beginObject();
        while (jsonReader.hasNext()) {
            String nextName = jsonReader.nextName();
            if (nextName.equals("token")) {
                a10.c(jsonReader.nextString());
            } else if (nextName.equals("expiresIn")) {
                a10.d(m(jsonReader.nextString()));
            } else {
                jsonReader.skipValue();
            }
        }
        jsonReader.endObject();
        jsonReader.close();
        inputStream.close();
        return a10.b(f.b.OK).a();
    }

    private void q(HttpURLConnection httpURLConnection, String str, String str2) {
        s(httpURLConnection, h(b(str, str2)));
    }

    private void r(HttpURLConnection httpURLConnection) {
        s(httpURLConnection, h(c()));
    }

    private static void s(URLConnection uRLConnection, byte[] bArr) {
        OutputStream outputStream = uRLConnection.getOutputStream();
        if (outputStream != null) {
            GZIPOutputStream gZIPOutputStream = new GZIPOutputStream(outputStream);
            try {
                gZIPOutputStream.write(bArr);
            } finally {
                try {
                    gZIPOutputStream.close();
                    outputStream.close();
                } catch (IOException unused) {
                }
            }
        } else {
            throw new IOException("Cannot send request to FIS servers. No OutputStream available.");
        }
    }

    public d d(String str, String str2, String str3, String str4, String str5) {
        d n10;
        if (this.f15014c.b()) {
            int i10 = 0;
            URL g10 = g(String.format("projects/%s/installations", new Object[]{str3}));
            while (i10 <= 1) {
                TrafficStats.setThreadStatsTag(32769);
                HttpURLConnection l10 = l(g10, str);
                try {
                    l10.setRequestMethod("POST");
                    l10.setDoOutput(true);
                    if (str5 != null) {
                        l10.addRequestProperty("x-goog-fis-android-iid-migration-auth", str5);
                    }
                    q(l10, str2, str4);
                    int responseCode = l10.getResponseCode();
                    this.f15014c.f(responseCode);
                    if (i(responseCode)) {
                        n10 = n(l10);
                    } else {
                        k(l10, str4, str, str3);
                        if (responseCode != 429) {
                            if (responseCode < 500 || responseCode >= 600) {
                                j();
                                n10 = d.a().e(d.b.BAD_CONFIG).a();
                            }
                            l10.disconnect();
                            TrafficStats.clearThreadStatsTag();
                            i10++;
                        } else {
                            throw new FirebaseInstallationsException("Firebase servers have received too many requests from this client in a short period of time. Please try again later.", FirebaseInstallationsException.a.TOO_MANY_REQUESTS);
                        }
                    }
                    l10.disconnect();
                    TrafficStats.clearThreadStatsTag();
                    return n10;
                } catch (IOException | AssertionError unused) {
                } catch (Throwable th) {
                    l10.disconnect();
                    TrafficStats.clearThreadStatsTag();
                    throw th;
                }
            }
            throw new FirebaseInstallationsException("Firebase Installations Service is unavailable. Please try again later.", FirebaseInstallationsException.a.UNAVAILABLE);
        }
        throw new FirebaseInstallationsException("Firebase Installations Service is unavailable. Please try again later.", FirebaseInstallationsException.a.UNAVAILABLE);
    }

    public f e(String str, String str2, String str3, String str4) {
        f p10;
        if (this.f15014c.b()) {
            int i10 = 0;
            URL g10 = g(String.format("projects/%s/installations/%s/authTokens:generate", new Object[]{str3, str2}));
            while (i10 <= 1) {
                TrafficStats.setThreadStatsTag(32771);
                HttpURLConnection l10 = l(g10, str);
                try {
                    l10.setRequestMethod("POST");
                    l10.addRequestProperty("Authorization", "FIS_v2 " + str4);
                    l10.setDoOutput(true);
                    r(l10);
                    int responseCode = l10.getResponseCode();
                    this.f15014c.f(responseCode);
                    if (i(responseCode)) {
                        p10 = p(l10);
                    } else {
                        k(l10, (String) null, str, str3);
                        if (responseCode == 401 || responseCode == 404) {
                            p10 = f.a().b(f.b.AUTH_ERROR).a();
                        } else if (responseCode != 429) {
                            if (responseCode < 500 || responseCode >= 600) {
                                j();
                                p10 = f.a().b(f.b.BAD_CONFIG).a();
                            }
                            l10.disconnect();
                            TrafficStats.clearThreadStatsTag();
                            i10++;
                        } else {
                            throw new FirebaseInstallationsException("Firebase servers have received too many requests from this client in a short period of time. Please try again later.", FirebaseInstallationsException.a.TOO_MANY_REQUESTS);
                        }
                    }
                    l10.disconnect();
                    TrafficStats.clearThreadStatsTag();
                    return p10;
                } catch (IOException | AssertionError unused) {
                } catch (Throwable th) {
                    l10.disconnect();
                    TrafficStats.clearThreadStatsTag();
                    throw th;
                }
            }
            throw new FirebaseInstallationsException("Firebase Installations Service is unavailable. Please try again later.", FirebaseInstallationsException.a.UNAVAILABLE);
        }
        throw new FirebaseInstallationsException("Firebase Installations Service is unavailable. Please try again later.", FirebaseInstallationsException.a.UNAVAILABLE);
    }
}
