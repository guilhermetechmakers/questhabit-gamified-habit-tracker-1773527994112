import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from '@/api/habits'
import { toast } from 'sonner'
import type { CreateHabitInput, UpdateHabitInput } from '@/types/habit'

export const habitKeys = {
  all: ['habits'] as const,
  list: (userId: string) => [...habitKeys.all, 'list', userId] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
}

export function useHabits(userId: string | undefined) {
  return useQuery({
    queryKey: habitKeys.list(userId ?? ''),
    queryFn: () => habitsApi.getAll(userId!),
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
