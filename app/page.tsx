import ThemeToggle from "../components/theme-toggle";

export default function Home() {
    const features = [
        {
            title: "Timely Reminders",
            desc: "Stay on schedule with smart dose notifications and simple confirmations.",
            icon: "⏰",
            tag: "Reminders",
        },
        {
            title: "Secure Medication Access",
            desc: "Track medications, refill timing, and adherence in one protected place.",
            icon: "🔒",
            tag: "Secure",
        },
        {
            title: "Caregiver Support",
            desc: "Keep family members informed with controlled access and useful updates.",
            icon: "👥",
            tag: "Shared Care",
        },
    ];

    const stats = [
        { label: "Adherence Rate", value: "87%" },
        { label: "Reminders Sent", value: "1.2K" },
        { label: "Active Caregivers", value: "320+" },
    ];

    const quickCards = [
        {
            title: "Today’s Medications",
            value: "2 / 3",
            sub: "Completed",
            icon: "💊",
        },
        {
            title: "Remaining Pills",
            value: "14",
            sub: "Refill in 6 days",
            icon: "📦",
        },
        {
            title: "Caregiver Status",
            value: "Connected",
            sub: "Mom has access",
            icon: "🤝",
            isStatus: true,
        },
    ];

    const steps = [
        {
            title: "Create your profile",
            desc: "Set up personal information, medication preferences, and daily goals.",
        },
        {
            title: "Add your medications",
            desc: "Build a medication schedule with dosage, timing, and refill information.",
        },
        {
            title: "Invite a caregiver",
            desc: "Optionally share reminders, progress, and alerts with someone you trust.",
        },
    ];

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const heights = [55, 72, 70, 82, 84, 71, 79];

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300">
                            💊
                        </div>
                        <div>
                            <div className="text-xl font-bold tracking-tight sm:text-2xl">
                                CuraDose
                            </div>
                            <div className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Smart Medication, Better Health
                            </div>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex dark:text-slate-300">
                        <a
                            href="#features"
                            className="transition hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Features
                        </a>
                        <a
                            href="#dashboard"
                            className="transition hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Dashboard
                        </a>
                        <a
                            href="#how-it-works"
                            className="transition hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            How it works
                        </a>
                        <a
                            href="#caregiver"
                            className="transition hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Caregiver
                        </a>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden xl:block">
                            <ThemeToggle />
                        </div>

                        <button className="hidden min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 sm:inline-flex dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300">
                            Log in
                        </button>

                        <button className="min-h-11 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-5">
                            Create account
                        </button>
                    </div>
                </div>

                <div className="border-t border-slate-200 px-4 py-3 xl:hidden dark:border-slate-800">
                    <ThemeToggle />
                </div>
            </header>

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_32%),radial-gradient(circle_at_left,_rgba(14,165,233,0.10),_transparent_25%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.16),_transparent_28%),radial-gradient(circle_at_left,_rgba(14,165,233,0.08),_transparent_22%)]" />
                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-24">
                    <div className="max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-800 shadow-sm dark:border-blue-900/70 dark:bg-slate-900 dark:text-blue-300">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                            Built for better medication adherence
                        </div>

                        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Smart Medication.
                            <span className="block text-blue-700 dark:text-blue-400">
                Better Health.
              </span>
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
                            CuraDose helps users manage their medication routine with reminders,
                            progress tracking, refill visibility, and optional caregiver support.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 dark:shadow-none">
                                Get Started
                            </button>
                            <button className="min-h-12 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300">
                                Watch Demo
                            </button>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
                            {stats.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="text-2xl font-bold">{item.value}</div>
                                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <span aria-hidden="true">✔</span>
                                High contrast states
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <span aria-hidden="true">📱</span>
                                Mobile-friendly layout
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <span aria-hidden="true">🌙</span>
                                Light / Dark / System
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200 transition-colors sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                            <div className="rounded-[1.5rem] bg-slate-100 p-4 sm:p-5 dark:bg-slate-950">
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            Good morning,
                                        </div>
                                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                            Emma 👋
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            Stay on track. You’ve got this!
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-blue-50 px-3 py-3 text-right dark:bg-blue-950/40">
                                        <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                            🔥 Streak
                                        </div>
                                        <div className="text-2xl font-bold">12</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            days
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[1.5rem] bg-gradient-to-r from-blue-500 to-blue-700 p-5 text-white shadow-lg">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                                        <span aria-hidden="true">⏱</span>
                                        Next dose
                                    </div>
                                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-2xl font-bold">Atorvastatin</div>
                                            <div className="text-sm text-blue-50">20 mg • 1 tablet</div>
                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                                                <span aria-hidden="true">🕙</span>
                                                Today, 10:00 AM
                                            </div>
                                        </div>
                                        <button className="min-h-12 rounded-2xl border-2 border-white bg-white px-5 py-3 font-semibold text-blue-800 shadow-sm transition hover:bg-slate-50">
                                            Take Dose
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-3 items-stretch">
                                    {quickCards.map((card) => (
                                        <div
                                            key={card.title}
                                            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 min-w-0"
                                        >
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                <span aria-hidden="true">{card.icon}</span>
                                                {card.title}
                                            </div>

                                            {card.isStatus ? (
                                                <div className="mt-2 text-sm sm:text-base font-semibold leading-tight break-words">
                                                    {card.value}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-lg sm:text-xl font-bold leading-tight truncate">
                                                    {card.value}
                                                </div>
                                            )}

                                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {card.sub}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-semibold">Weekly Progress</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                You’re doing great. Keep it up.
                                            </div>
                                        </div>
                                        <div className="rounded-full border-2 border-blue-600 px-3 py-1 text-lg font-bold text-blue-700 dark:text-blue-400">
                                            87%
                                        </div>
                                    </div>

                                    <div
                                        className="mt-5 flex h-32 items-end justify-between gap-2"
                                        aria-label="Weekly adherence chart"
                                    >
                                        {heights.map((h, i) => (
                                            <div key={i} className="flex flex-1 flex-col items-center gap-2">
                                                <div
                                                    className={`w-full rounded-t-xl ${
                                                        i === 4
                                                            ? "bg-blue-700 dark:bg-blue-400"
                                                            : "bg-blue-500/80 dark:bg-blue-500"
                                                    }`}
                                                    style={{ height: `${h}%` }}
                                                    aria-hidden="true"
                                                />
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {days[i]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Friday is highlighted with stronger fill, not color alone.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="features"
                className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16"
            >
                <div className="max-w-2xl">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                        Features
                    </div>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        Everything needed for a calmer medication routine
                    </h2>
                </div>

                <div className="mt-10 grid gap-5 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-950/40">
                                    {feature.icon}
                                </div>
                                <div className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:text-slate-300">
                                    {feature.tag}
                                </div>
                            </div>
                            <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section
                id="dashboard"
                className="bg-white py-14 transition-colors dark:bg-slate-900"
            >
                <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:gap-10">
                    <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                            Dashboard Preview
                        </div>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                            Clear daily progress at a glance
                        </h2>
                        <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                            Users can view what has been taken, what is next, how many pills
                            remain, and whether a caregiver is connected — all from one homepage.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                "Highlight the next medication with one strong primary action",
                                "Keep daily stats simple and visible above the fold",
                                "Use icon + text + border states instead of color alone",
                            ].map((line) => (
                                <div
                                    key={line}
                                    className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                                >
                                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white dark:bg-blue-500">
                                        ✓
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-200">{line}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-xl sm:p-6 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:col-span-2 dark:bg-slate-900 dark:ring-slate-800">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            Today’s Progress
                                        </div>
                                        <div className="mt-1 text-2xl font-bold sm:text-3xl">
                                            2 of 3 Taken
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            Next dose in 1h 32m
                                        </div>
                                    </div>
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-blue-600 text-xl font-bold dark:border-blue-500">
                                        67%
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    08:00 • Completed
                                </div>
                                <div className="mt-2 text-lg font-bold">Lisinopril</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    10 mg • 1 tablet
                                </div>
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <span aria-hidden="true">✔</span>
                                    Taken 08:05
                                </div>
                            </div>

                            <div className="rounded-3xl border-2 border-blue-300 bg-blue-50 p-5 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                                <div className="text-sm text-slate-600 dark:text-slate-300">
                                    10:00 • Next Dose
                                </div>
                                <div className="mt-2 text-lg font-bold">Atorvastatin</div>
                                <div className="text-sm text-slate-600 dark:text-slate-300">
                                    20 mg • 1 tablet
                                </div>
                                <button className="mt-4 min-h-12 rounded-2xl border-2 border-blue-700 bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 dark:border-blue-500 dark:bg-blue-500 dark:text-slate-950">
                                    Take Dose
                                </button>
                            </div>

                            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    20:00 • Scheduled
                                </div>
                                <div className="mt-2 text-lg font-bold">Metformin</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    500 mg • 1 tablet
                                </div>
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <span aria-hidden="true">○</span>
                                    Scheduled
                                </div>
                            </div>

                            <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-sky-500 p-5 text-white shadow-sm md:col-span-2">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-xl font-bold">Need a refill?</div>
                                        <div className="text-sm text-blue-50">
                                            You have 14 pills remaining
                                        </div>
                                    </div>
                                    <button className="min-h-12 rounded-2xl border-2 border-white bg-white px-5 py-3 font-semibold text-blue-800">
                                        Check Inventory
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="how-it-works"
                className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16"
            >
                <div className="max-w-2xl">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                        How it works
                    </div>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        A simple onboarding flow
                    </h2>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                    {steps.map((step, idx) => (
                        <div
                            key={step.title}
                            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white dark:bg-blue-500 dark:text-slate-950">
                                {idx + 1}
                            </div>
                            <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section
                id="caregiver"
                className="bg-white py-14 text-slate-900 transition-colors dark:bg-slate-900 dark:text-white"
            >
                <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:gap-10">
                    <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                            Caregiver Experience
                        </div>

                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                            Support loved ones without taking away their independence
                        </h2>

                        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                            Give caregivers access to medication reminders, adherence progress,
                            refill alerts, and recent activity — while keeping the user in control.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            {[
                                "Medication reminder visibility",
                                "Weekly adherence tracking",
                                "Inventory and refill alerts",
                                "Activity updates and follow-up support",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-2xl backdrop-blur sm:p-6 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                        <div className="rounded-[1.5rem] bg-white p-5 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Good morning,
                                    </div>
                                    <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                                        Sarah!
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Here’s how Emma is doing today.
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right dark:bg-blue-950/30">
                                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                        View Profile
                                    </div>
                                    <div className="font-semibold">Emma Johnson</div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-5 text-white">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-2xl font-bold">Emma’s Status</div>
                                        <div className="mt-1 text-blue-100">On Track Today</div>
                                        <div className="text-sm text-blue-100">
                                            Last updated: May 24 • 08:30 AM
                                        </div>
                                    </div>

                                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-white text-xl font-bold">
                                        87%
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                {[
                                    {
                                        title: "Doses Today",
                                        value: "2 / 3",
                                        sub: "Next: 10:00 AM",
                                        icon: "💊",
                                    },
                                    {
                                        title: "Remaining Pills",
                                        value: "14",
                                        sub: "Refill in 6 days",
                                        icon: "📦",
                                    },
                                    {
                                        title: "Caregiver Status",
                                        value: "Connected",
                                        sub: "Mom has access",
                                        icon: "🤝",
                                        isStatus: true,
                                    },
                                ].map((card) => (
                                    <div
                                        key={card.title}
                                        className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800 min-w-0"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <span aria-hidden="true">{card.icon}</span>
                                            {card.title}
                                        </div>

                                        {card.isStatus ? (
                                            <div className="mt-2 text-sm sm:text-base font-semibold leading-tight break-words">
                                                {card.value}
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-lg sm:text-xl font-bold leading-tight truncate">
                                                {card.value}
                                            </div>
                                        )}

                                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {card.sub}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}