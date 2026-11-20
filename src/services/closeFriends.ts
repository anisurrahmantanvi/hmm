import { supabase } from '@/lib/supabase'

export async function listCloseFriendIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('close_friends').select('friend_id').eq('user_id', userId).limit(1000)
  return new Set(((data ?? []) as { friend_id: string }[]).map((r) => r.friend_id))
}
export async function addCloseFriend(friendId: string): Promise<void> {
  const { error } = await supabase.from('close_friends').insert({ friend_id: friendId })
  if (error && error.code !== '23505') throw new Error(error.message)
}
export async function removeCloseFriend(userId: string, friendId: string): Promise<void> {
  const { error } = await supabase.from('close_friends').delete().eq('user_id', userId).eq('friend_id', friendId)
  if (error) throw new Error(error.message)
}
