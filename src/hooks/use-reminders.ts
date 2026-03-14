import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { remindersApi } from '@/api/reminders'
import { habitKeys } from '@/hooks/use-habits'
import { toast } from 'sonner'
import type { CreateReminderInput, UpdateReminderInput } from '@/types/habit'

export function useReminders(habitId: string | undefined) {
  return useQuery({
    queryKey: ['reminders', habitId],
    queryFn: () => remindersApi.getByHabitId(habitId!),
    enabled: !!habitId,
  })
}

export function useCreateReminder(habitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<CreateReminderInput, 'habit_id'>) =>
      remindersApi.create({ ...input, habit_id: habitId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders', habitId] })
      qc.invalidateQueries({ queryKey: [...habitKeys.detail(habitId), 'reminders'] })
      toast.success('Reminder added')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateReminder(habitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateReminderInput }) =>
      remindersApi.update(id, habitId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders', habitId] })
      qc.invalidateQueries({ queryKey: [...habitKeys.detail(habitId), 'reminders'] })
      toast.success('Reminder updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteReminder(habitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => remindersApi.delete(id, habitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders', habitId] })
      qc.invalidateQueries({ queryKey: [...habitKeys.detail(habitId), 'reminders'] })
      toast.success('Reminder removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
