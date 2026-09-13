# بازیابی ریپوی خراب روی ویندوز (راهنمای قدم‌به‌قدم)

این راهنما برای خطاهایی است که موقع کار روی دستگاه ویندوزی دیدیم:

- `repository 'https://github.com/نام-کاربری/SefidBarfiShrimp.git/' not found`
- `fatal: pathspec 'frontend' did not match any files`
- لیست بلند فایل‌های ویندوزی untracked (`NTUSER.DAT`، `AppData`، `Desktop`، …)
  و `Initial commit`
- `error: src refspec arena/car-details-panel does not match any`

## مشکل اصلی چه بود

`git init` در **فولدر خانگی ویندوز** (`C:\Users\...`) اجرا شده بود، نه داخل
پوشه‌ی پروژه. برای همین کل پروفایل کاربری به یک ریپوی خالی تبدیل شد و هیچ‌کدام
از فایل‌های پروژه (مثل `frontend`) داخل آن نبودند. آدرس ریپو هم هنوز
placeholder (`نام-کاربری`) داشت.

## گام ۱ — حذف ریپوی اشتباهیِ ساخته‌شده در خانه

در Git Bash:

```bash
cd ~
rm -rf .git
```

فقط پوشه‌ی `.git` خانه پاک می‌شود؛ فایل‌های شخصی (Desktop، Documents، …)
دست‌نخورده می‌مانند و ریپوهای دیگری که در زیرپوشه‌ها هستند آسیب نمی‌بینند.

## گام ۲ — پیدا کردن پوشه‌ی واقعی پروژه

```bash
ls ~/source ~/cp-admin ~/Documents ~/Desktop
```

پروژه باید یکی از این‌ها باشد. نشانه‌ی پوشه‌ی درست: داخلش `frontend/` و
`backend/` وجود دارد و خودش هم `.git` دارد (اگر از قبل کلون کرده بودی).

## گام ۳ — درست‌کردن آدرس ریپو

آدرس فعلی را ببین و جایگزین کن:

```bash
cd ~/source/<پوشه-پروژه>
git remote -v
git remote set-url origin https://github.com/<یوزرنیم-واقعی>/<اسم-ریپو>.git
```

`<یوزرنیم-واقعی>` همان نام کاربری گیت‌هاب است (نه کلمه‌ی «نام-کاربری») و
`<اسم-ریپو>` باید از قبل روی گیت‌هاب ساخته شده باشد؛ وگرنه:

```bash
gh auth login
gh repo create <اسم-ریپو> --public --source . --remote origin --push
```

## گام ۴ — کامیت و پوش

```bash
git status                 # مطمئن شو فایل‌های پروژه را می‌بینی، نه NTUSER.DAT
git add -A
git commit -m "car details panel"
git push -u origin HEAD
```

اگر `push` گفت برنچ مطابقت ندارد، یعنی هنوز کامیتی نساخته‌ای (گیت چیزی برای
پوش ندارد) — گام ۴ را به ترتیب انجام بده.

## گام ۵ — گرفتن آخرین کد از برنچ Arena

بعد از اینکه تغییرات در ریپوی Arena اعمال و PR شد:

```bash
cd ~/source/<پوشه-پروژه>
git fetch origin
git checkout main
git pull origin main
```

## چک‌لیست سریع

- [ ] `git status` داخل پوشه‌ی پروژه اجرا شد (نه در `~`)
- [ ] آدرس ریموت شامل یوزرنیم واقعی است و ریپو روی گیت‌هاب وجود دارد
- [ ] حداقل یک کامیت روی برنچ جاری هست
- [ ] `git push -u origin HEAD` موفق بود

> نکته: اگر یک فایل `.patch` دانلود شده دارید، `git apply ../car-details-panel-v6.patch`
> فقط وقتی کار می‌کند که پچ در مسیری که نوشته‌اید واقعاً وجود داشته باشد
> (`ls` بزنید) و تغییراتش با کد فعلی سازگار باشد. معمولاً ساده‌تر است به‌جای
> پچ، مستقیم از برنچ `main` ریپو پول بگیرید.
