package q8;

import com.google.firebase.installations.h;
import java.util.concurrent.TimeUnit;

class e {

    /* renamed from: d  reason: collision with root package name */
    private static final long f15018d = TimeUnit.HOURS.toMillis(24);

    /* renamed from: e  reason: collision with root package name */
    private static final long f15019e = TimeUnit.MINUTES.toMillis(30);

    /* renamed from: a  reason: collision with root package name */
    private final h f15020a = h.c();

    /* renamed from: b  reason: collision with root package name */
    private long f15021b;

    /* renamed from: c  reason: collision with root package name */
    private int f15022c;

    e() {
    }

    private synchronized long a(int i10) {
        if (!c(i10)) {
            return f15018d;
        }
        return (long) Math.min(Math.pow(2.0d, (double) this.f15022c) + ((double) this.f15020a.e()), (double) f15019e);
    }

    private static boolean c(int i10) {
        return i10 == 429 || (i10 >= 500 && i10 < 600);
    }

    private static boolean d(int i10) {
        return (i10 >= 200 && i10 < 300) || i10 == 401 || i10 == 404;
    }

    private synchronized void e() {
        this.f15022c = 0;
    }

    public synchronized boolean b() {
        boolean z10;
        if (this.f15022c == 0 || this.f15020a.a() > this.f15021b) {
            z10 = true;
        } else {
            z10 = false;
        }
        return z10;
    }

    public synchronized void f(int i10) {
        if (d(i10)) {
            e();
            return;
        }
        this.f15022c++;
        this.f15021b = this.f15020a.a() + a(i10);
    }
}
