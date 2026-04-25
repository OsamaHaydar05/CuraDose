# 💊 CuraDose

CuraDose is a smart IoT-based medicine box designed to help patients take the right medication at the right time.

## 🚨 Problem
Patients often:
- Forget to take medication  
- Take incorrect dosages  

## 💡 Solution
CuraDose provides:
- ⏰ Timely reminders  
- 🔒 Controlled access to medication  
- 📱 Mobile notifications  
- 👨‍⚕️ Support for caregivers  

## 🏗️ System
The system consists of:
- **Hardware:** Raspberry Pi-based medicine box with sensors and lock  
- **Backend:** Handles logic and data storage  
- **Frontend:** Mobile app for monitoring and notifications  

## 👥 Team
Group 9 Project

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run the full contents of `supabase/schema.sql`. This creates the `profiles`, `health_goals`, `medications`, `dose_logs`, and `caregiver_invites` tables.
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run `npm install`, then `npm run dev`.

Supabase Auth sessions are persisted in browser storage with the `curadose-auth` key. User profiles, health goals, medication schedules, dose logs, and caregiver invites are stored in Supabase tables with row-level security enabled.

For the current onboarding flow to save health goals immediately after registration, Supabase Auth email confirmation should be disabled or a confirmation callback flow should be added before the health-goals step.
