"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { parseNum, str } from "@/lib/format";

async function auth() {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  return { supabase, user };
}

function check(error: { message: string } | null) {
  if (error) throw new Error("Não foi possível salvar. Confira os campos e tente de novo.");
}

/* Consentimento */
export async function giveConsent(formData: FormData) {
  if (formData.get("consent") !== "on") return;
  const { supabase, user } = await auth();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, consent_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  check(error);
  revalidatePath("/", "layout");
}

/* Medidas */
export async function addReading(formData: FormData) {
  const { supabase } = await auth();
  const systolic = parseNum(formData.get("systolic"));
  const diastolic = parseNum(formData.get("diastolic"));
  if (systolic == null || diastolic == null) return;
  const local = str(formData.get("measured_at"));
  // datetime-local chega sem fuso; o app assume horário de Brasília
  const measured_at = local ? new Date(`${local}:00-03:00`).toISOString() : new Date().toISOString();
  const { error } = await supabase.from("readings").insert({
    measured_at,
    systolic: Math.round(systolic),
    diastolic: Math.round(diastolic),
    heart_rate: parseNum(formData.get("heart_rate")),
    position: str(formData.get("position")) ?? "sentado",
    dizziness: parseNum(formData.get("dizziness")),
    weight_kg: parseNum(formData.get("weight_kg")),
    notes: str(formData.get("notes"), 1000),
  });
  check(error);
  revalidatePath("/");
}

export async function deleteReading(formData: FormData) {
  const { supabase } = await auth();
  const id = str(formData.get("id"));
  if (!id) return;
  check((await supabase.from("readings").delete().eq("id", id)).error);
  revalidatePath("/");
}

/* Remédios */
export async function addMedication(formData: FormData) {
  const { supabase } = await auth();
  const name = str(formData.get("name"), 120);
  if (!name) return;
  const { error } = await supabase.from("medications").insert({
    name,
    dose: str(formData.get("dose"), 60),
    schedule: str(formData.get("schedule"), 120),
    started_on: str(formData.get("started_on")),
    notes: str(formData.get("notes")),
    active: true,
  });
  check(error);
  revalidatePath("/remedios");
  revalidatePath("/");
}

export async function toggleMedication(formData: FormData) {
  const { supabase } = await auth();
  const id = str(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("medications")
    .update(active ? { active: false, stopped_on: today } : { active: true, stopped_on: null })
    .eq("id", id);
  check(error);
  revalidatePath("/remedios");
  revalidatePath("/");
}

/* Exames */
export async function addLabResult(formData: FormData) {
  const { supabase } = await auth();
  const test_name = str(formData.get("test_name"), 120);
  const value_text = str(formData.get("value_text"), 40);
  const collected_on = str(formData.get("collected_on"));
  if (!test_name || !value_text || !collected_on) return;
  const flag = str(formData.get("flag")) ?? "normal";
  const { error } = await supabase.from("lab_results").insert({
    collected_on,
    test_name,
    value_text,
    value_num: parseNum(value_text),
    unit: str(formData.get("unit"), 30),
    reference: str(formData.get("reference"), 80),
    flag: ["normal", "alto", "baixo"].includes(flag) ? flag : "normal",
    lab_name: str(formData.get("lab_name"), 120),
    notes: str(formData.get("notes"), 1000),
  });
  check(error);
  revalidatePath("/exames");
}

export async function deleteLabResult(formData: FormData) {
  const { supabase } = await auth();
  const id = str(formData.get("id"));
  if (!id) return;
  check((await supabase.from("lab_results").delete().eq("id", id)).error);
  revalidatePath("/exames");
}

/* Linha do tempo */
export async function addEvent(formData: FormData) {
  const { supabase } = await auth();
  const description = str(formData.get("description"));
  const happened_on = str(formData.get("happened_on"));
  if (!description || !happened_on) return;
  const kind = str(formData.get("kind")) ?? "nota";
  const { error } = await supabase.from("events").insert({
    happened_on,
    description,
    approximate: formData.get("approximate") === "on",
    kind: ["remedio", "sintoma", "consulta", "nota"].includes(kind) ? kind : "nota",
  });
  check(error);
  revalidatePath("/historico");
}

/* Pendências */
export async function addTodo(formData: FormData) {
  const { supabase } = await auth();
  const title = str(formData.get("title"), 300);
  if (!title) return;
  check((await supabase.from("todos").insert({ title })).error);
  revalidatePath("/pendencias");
  revalidatePath("/");
}

export async function toggleTodo(formData: FormData) {
  const { supabase } = await auth();
  const id = str(formData.get("id"));
  const done = formData.get("done") === "true";
  if (!id) return;
  const { error } = await supabase
    .from("todos")
    .update({ done: !done, done_at: done ? null : new Date().toISOString() })
    .eq("id", id);
  check(error);
  revalidatePath("/pendencias");
  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const { supabase } = await auth();
  const id = str(formData.get("id"));
  if (!id) return;
  check((await supabase.from("todos").delete().eq("id", id)).error);
  revalidatePath("/pendencias");
  revalidatePath("/");
}
