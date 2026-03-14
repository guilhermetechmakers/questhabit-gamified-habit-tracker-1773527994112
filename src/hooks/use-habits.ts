import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { habitsApi, type HabitListParams } from '@/api/habits'
import { toast } from 'sonner'
import type { CreateHabitInput, UpdateHabitInput } from '@/types/habit'

export const habitKeys = {
  all: ['habits'] as const,
  list: (userId: string) => [...habitKeys.all, 'list', userId] as const,
  listParams: (params: HabitListParams) => [...habitKeys.all, 'list', params.userId, params.state, params.search, params.page, params.limit] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
  history: (habitId: string) => [...habitKeys.all, 'history', habitId] as const,
  analytics: (habitId: string) => [...habitKeys.all, 'analytics', habitId] as const,
}

export function useHabits(userId: string | undefined) {
  return useQuery({
    queryKey: habitKeys.list(userId ?? ''),
    queryFn: () => habitsApi.getAll(userId!),
    enabled: !!userId,
  })
}

export function useAllHabits(userId: string | undefined) {
  return useQuery({
    queryKey: [...habitKeys.list(userId ?? ''), 'all'],
    queryFn: () => habitsApi.getAllIncludingArchived(userId!),
    enabled: !!userId,
  })
}

export function useHabit(id: string | undefined) {
  return useQuery({
    queryKey: habitKeys.detail(id ?? ''),
    queryFn: () => habitsApi.getById(id!),
    enabled: !!id,
  })
}

export function useHabitList(params: HabitListParams) {
  return useQuery({
    queryKey: habitKeys.listParams(params),
    queryFn: () => habitsApi.list(params),
    enabled: !!params.userId,
  })
}

export function useHabitWithReminders(id: string | undefined) {
  return useQuery({
    queryKey: [...habitKeys.detail(id ?? ''), 'reminders'],
    queryFn: () => habitsApi.getByIdWithReminders(id!),
    enabled: !!id,
  })
}

export function useHabitHistory(habitId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: [...habitKeys.history(habitId ?? ''), from, to],
    queryFn: () => habitsApi.getHistory(habitId!, from, to),
    enabled: !!habitId,
  })
}

export function useHabitAnalytics(habitId: string | undefined) {
  return useQuery({
    queryKey: habitKeys.analytics(habitId ?? ''),
    queryFn: () => habitsApi.getAnalytics(habitId!),
    enabled: !!habitId,
  })
}

export function useCreateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateHabitInput) => habitsApi.create(input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: habitKeys.list(variables.user_id) })
      toast.success('Habit created!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateHabit(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateHabitInput }) =>
      habitsApi.update(id, updates),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: habitKeys.detail(updated.id) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      toast.success('Habit updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteHabit(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: habitKeys.detail(id) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      toast.success('Habit deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useArchiveHabit(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => habitsApi.archive(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: habitKeys.detail(updated.id) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      toast.success('Habit archived')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUnarchiveHabit(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => habitsApi.unarchive(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: habitKeys.detail(updated.id) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      toast.success('Habit restored')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
