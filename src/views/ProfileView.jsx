import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseConfig";
import "../styles/ProfileView.css";

function initialsForName(name, email) {
  const source = name || email || "CuraDose User";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CU";
}

export default function ProfileView() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setError("");
      setIsLoading(true);

      try {
        const user = await getCurrentUser();
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("full_name,email,role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (!isMounted) return;

        setProfile({
          email: data?.email || user.email,
          fullName: data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "CuraDose User",
          role: data?.role || user.user_metadata?.role || "patient",
          createdAt: user.created_at,
        });
      } catch (err) {
        if (isMounted) setError(err.message || "Unable to load your profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = initialsForName(profile?.fullName, profile?.email);
  const dashboardPath = profile?.role === "caregiver" || profile?.role === "family" ? "/caregiver/dashboard" : "/dashboard";

  return (
    <main className="profile-page">
      <section className="profile-shell" aria-label="Profile">
        <header className="profile-header">
          <div>
            <span>CuraDose</span>
            <h1>Profile</h1>
          </div>
          <Link to={dashboardPath}>Dashboard</Link>
        </header>

        {error ? <p className="profile-error" role="alert">{error}</p> : null}

        <section className="profile-card">
          <div className="profile-avatar" aria-hidden>
            {isLoading ? "..." : initials}
          </div>
          <div>
            <h2>{isLoading ? "Loading profile" : profile?.fullName}</h2>
            <p>{profile?.email || "Syncing account details"}</p>
          </div>
        </section>

        <section className="profile-details" aria-label="Account details">
          <article>
            <span>Role</span>
            <strong>{profile?.role || "Loading"}</strong>
          </article>
          <article>
            <span>Email</span>
            <strong>{profile?.email || "Loading"}</strong>
          </article>
          <article>
            <span>Member Since</span>
            <strong>
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                : "Loading"}
            </strong>
          </article>
        </section>
      </section>
    </main>
  );
}
