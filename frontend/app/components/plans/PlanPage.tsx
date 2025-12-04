import { useEffect, useState } from "react";
import { PlanNavigation } from "./PlanNavigation";
import { supabase } from "../../../supabase";

interface UserPlan {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  total_credits: number;
}

export function PlanPage() {
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlanName, setNewPlanName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    fetchPlans();
  }, [user]);

  const fetchPlans = () => {
    if (!user) return;
    setRefreshing(true);
    supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlans(data || []);
        setLoading(false);
        setRefreshing(false);
      });
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim() || !user) return;

    const { data } = await supabase
      .from("user_plans")
      .insert({ user_id: user.id, name: newPlanName, description: "New plan", plan_data: { semesters: [] }, total_credits: 0 })
      .select()
      .single();

    if (data) setPlans([data, ...plans]);
    setNewPlanName("");
    setShowCreateForm(false);
  };

  const handleSetActive = async (planId: string) => {
    if (!user) return;
    await supabase.from("user_plans").update({ is_active: true }).eq("id", planId).eq("user_id", user.id);
    const { data } = await supabase.from("user_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setPlans(data);
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm("Are you sure you want to delete this plan?") || !user) return;
    await supabase.from("user_plans").delete().eq("id", planId).eq("user_id", user.id);
    setPlans(plans.filter((p) => p.id !== planId));
  };

  return (
    <div className="min-h-screen w-full bg-[#E1EABB] flex flex-col items-start px-8 py-6">
      <PlanNavigation />
      <div className="flex items-center justify-between w-full max-w-5xl">
        <h1 className="text-gray-800 text-3xl font-semibold mt-4">Plan page</h1>
        {user && (
          <button
            onClick={fetchPlans}
            disabled={refreshing}
            className="mt-4 bg-[#6A8A83] hover:bg-[#5a7872] text-white px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh"}
          </button>
        )}
      </div>
      <div className="w-96 h-24 text-center justify-start text-[rgba(106,138,131,1)] text-4xl font-bold font-figmaHand">
        Your Saved Schedules
      </div>

      {!user ? (
        <div className="text-gray-600 ml-4">Please log in to view your saved plans.</div>
      ) : loading ? (
        <div className="text-gray-600 ml-4">Loading plans...</div>
      ) : (
        <div className="flex flex-col gap-6 ml-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`flex items-center gap-4 rounded-3xl px-6 py-6 w-[360px] shadow-sm ${
                plan.is_active ? "bg-[#4A6A63] ring-2 ring-[#2E3A3A]" : "bg-[#6A8A83]"
              }`}
            >
              <div className="w-12 h-12 grid place-items-center rounded-full border-2 border-[#2E3A3A] text-[#2E3A3A] font-figmaHand text-2xl">
                {index + 1}
              </div>
              <div className="text-white flex-1">
                <div className="uppercase font-mono tracking-widest text-xl">
                  {plan.name}
                </div>
                <div className="text-sm opacity-90">
                  {plan.description || "No description"}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {plan.total_credits} credits
                  {plan.is_active && " • Active"}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!plan.is_active && (
                  <button
                    onClick={() => handleSetActive(plan.id!)}
                    className="text-xs bg-white text-[#6A8A83] px-3 py-1 rounded hover:bg-gray-100"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => handleDelete(plan.id!)}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="text-gray-600">No saved plans yet. Create your first plan!</div>
          )}

          {showCreateForm ? (
            <div className="flex flex-col gap-2 bg-white rounded-3xl px-6 py-4 w-[360px] shadow-sm">
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Enter plan name"
                className="border border-gray-300 rounded px-3 py-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePlan}
                  className="bg-[#6A8A83] text-white px-4 py-2 rounded hover:bg-[#5A7A73]"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPlanName("");
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-4 bg-white border-2 border-dashed border-[#6A8A83] rounded-3xl px-6 py-6 w-[360px] shadow-sm hover:bg-gray-50"
            >
              <div className="w-12 h-12 grid place-items-center rounded-full border-2 border-[#6A8A83] text-[#6A8A83] font-figmaHand text-2xl">
                +
              </div>
              <div className="text-[#6A8A83] uppercase font-mono tracking-widest text-xl">
                Create New Plan
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
