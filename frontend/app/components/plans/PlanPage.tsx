<<<<<<< HEAD
import { useState } from "react";
import {PlanNavigation} from "./PlanNavigation";

type Plan = {
  id: number;
  description: string;
};

export function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([
    { id: 1, description: "" },
    { id: 2, description: "" },
    { id: 3, description: "" },
  ]);

  const handleDescriptionChange = (id: number, value: string) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, description: value } : plan
      )
    );
  };

  const handleAddPlan = () => {
    setPlans((prev) => [...prev, { id: prev.length + 1, description: "" }]);
  };

  const handleDeletePlan = (id: number) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  return (
    <div className="h-[900px]  bg-[#E1EABB] px-8 py-6">
      <div className="mt-6 flex justify-start">
        <div className="w-full max-w-md pl-8 pr-4 py-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] leading-tight text-[rgba(106,138,131,1)] font-figmaHand font-semibold">
              Your Saved
              <br />
              Schedules
            </h1>
            <p className="mt-3 text-xs text-[rgba(106,138,131,1)] tracking-wide">
              View and add your schedule plans
            </p>
          </div>

          {/* Plan cards */}
          <div className="flex flex-col gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className="relative group flex items-center gap-6 bg-white rounded-3xl px-6 py-5 shadow-sm w-full transition hover:bg-[#6A8A83] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeletePlan(plan.id)}
                  className="absolute top-3 right-4 text-lg text-[#6A8A83] opacity-70 hover:opacity-100 hover:text-red-500 transition cursor-pointer"
                  aria-label="Delete plan"
                >
                  ×
                </button>

                {/* Number circle */}
                <div className="w-14 h-14 grid place-items-center rounded-full bg-[#6A8A83] text-white font-figmaHand text-2xl transition group-hover:bg-white group-hover:text-[#6A8A83]">
                  {index + 1}
                </div>

                {/* Text + editable description */}
                <div className="flex flex-col text-[rgba(106,138,131,1)] transition group-hover:text-white">
                  <div className="text-xl font-mono tracking-wide">Plan</div>
                  <input
                    type="text"
                    placeholder="Short Description"
                    value={plan.description}
                    onChange={(e) =>
                      handleDescriptionChange(plan.id, e.target.value)
                    }
                    className="mt-1 text-xs bg-transparent outline-none placeholder:opacity-80 placeholder:text-[rgba(106,138,131,1)] group-hover:placeholder:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* + New button */}
          <button
            type="button"
            onClick={handleAddPlan}
            className="mt-8 w-full rounded-3xl bg-[#6A8A83] py-3 text-white text-xl font-figmaHand shadow-sm hover:bg-[#5c7972] transition cursor-pointer"
          >
            + New
          </button>
=======
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
>>>>>>> b2411b9 (user schedule and preferences persist in supabase)
        </div>
      )}
    </div>
  );
}
