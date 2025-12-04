/**
 * Database Helper Functions
 * 
 * Utility functions for common database operations
 * These functions handle user_id filtering and error handling
 */

import { supabaseAdmin } from './supabase'
import type { Database } from '@/types/database'

/**
 * Generic function to fetch user's data from a table
 */
export async function fetchUserData<T>(
  tableName: string,
  userId: string,
  options?: {
    workspaceId?: string
    select?: string
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  }
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
  }

  let query = supabaseAdmin
    .from(tableName)
    .select(options?.select || '*')
    .eq('user_id', userId)

  if (options?.workspaceId) {
    query = query.eq('workspace_id', options.workspaceId)
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, { 
      ascending: options.orderBy.ascending ?? true 
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error fetching ${tableName}:`, error)
    throw error
  }

  return data as T[]
}

/**
 * Generic function to insert data into a table
 */
export async function insertUserData<T>(
  tableName: string,
  userId: string,
  data: Partial<T> & { workspace_id?: string },
  options?: { returning?: boolean }
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
  }

  const { data: result, error } = await supabaseAdmin
    .from(tableName)
    .insert({
      ...data,
      user_id: userId,
    } as any)
    .select(options?.returning ? '*' : undefined)

  if (error) {
    console.error(`Error inserting into ${tableName}:`, error)
    throw error
  }

  return result as T[]
}

/**
 * Generic function to update data in a table
 */
export async function updateUserData<T>(
  tableName: string,
  userId: string,
  id: string,
  updates: Partial<T>
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
  }

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .update(updates as any)
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns the record
    .select()

  if (error) {
    console.error(`Error updating ${tableName}:`, error)
    throw error
  }

  return data as T[]
}

/**
 * Generic function to delete data from a table
 */
export async function deleteUserData(
  tableName: string,
  userId: string,
  id: string
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
  }

  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns the record

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error)
    throw error
  }

  return { success: true }
}

/**
 * Fetch a single record by ID
 */
export async function fetchUserDataById<T>(
  tableName: string,
  userId: string,
  id: string
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
  }

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error(`Error fetching ${tableName} by id:`, error)
    throw error
  }

  return data as T
}














