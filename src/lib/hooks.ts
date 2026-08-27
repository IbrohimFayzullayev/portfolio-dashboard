import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  ContentStatus,
  InvitationList,
  Post,
  PostInput,
  Project,
  ProjectInput,
} from "@/lib/types";

interface ListParams {
  locale?: string;
  status?: ContentStatus;
}

function buildQuery({ locale, status }: ListParams): string {
  const sp = new URLSearchParams();
  if (locale && locale !== "all") sp.set("locale", locale);
  if (status && status !== "all") sp.set("status", status);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/* --------------------------------- posts --------------------------------- */

export function usePosts(params: ListParams) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: ({ signal }) =>
      apiFetch<Post[]>(`/posts${buildQuery(params)}`, { signal }),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: ({ signal }) => apiFetch<Post>(`/posts/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) =>
      apiFetch<Post>("/posts", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PostInput }) =>
      apiFetch<Post>(`/posts/${id}`, { method: "PUT", body: input }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post", vars.id] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function usePublishPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: boolean }) =>
      apiFetch<Post>(`/posts/${id}/publish`, {
        method: "PATCH",
        body: { draft },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

/* ------------------------------- projects -------------------------------- */

export function useProjects(params: ListParams) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: ({ signal }) =>
      apiFetch<Project[]>(`/projects${buildQuery(params)}`, { signal }),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: ({ signal }) => apiFetch<Project>(`/projects/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) =>
      apiFetch<Project>("/projects", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) =>
      apiFetch<Project>(`/projects/${id}`, { method: "PUT", body: input }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", vars.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ------------------------------ invitations ------------------------------ */

/**
 * Submissions arrive on their own, so the list polls in the background — new
 * ones show up without a reload. Replaced by the Telegram bot later.
 */
export function useInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: ({ signal }) => apiFetch<InvitationList>("/invitations", { signal }),
    refetchInterval: 60_000,
  });
}

export function useDeleteInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/invitations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}
