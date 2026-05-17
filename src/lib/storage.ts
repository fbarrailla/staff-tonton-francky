import { supabase } from './supabase'

function client() {
  if (!supabase) throw new Error('Supabase non configuré.')
  return supabase
}

function safeExt(fileName: string, fallback = 'bin') {
  const m = fileName.match(/\.([A-Za-z0-9]+)$/)
  return (m?.[1] ?? fallback).toLowerCase()
}

function rand() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Upload a profile picture to the public `avatars` bucket and return its
 * public URL (safe to store in employees.avatar_url).
 */
export async function uploadAvatar(file: File): Promise<string> {
  const c = client()
  const path = `${rand()}.${safeExt(file.name, 'png')}`
  const { error } = await c.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  const { data } = c.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload a medical certificate to the private `medical-certificates` bucket
 * and return the object path (NOT a URL) so the row can store it and we can
 * generate signed URLs at view time.
 */
export async function uploadCertificate(file: File): Promise<string> {
  const c = client()
  const path = `${rand()}.${safeExt(file.name, 'pdf')}`
  const { error } = await c.storage.from('medical-certificates').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  return path
}

/**
 * Upload an applicant document (CV or motivation letter) to the private
 * `applicants` bucket. Returns the storage path so it can be persisted and
 * signed on demand at view time.
 */
export async function uploadApplicantFile(
  file: File,
  kind: 'cv' | 'motivation' = 'cv',
): Promise<string> {
  const c = client()
  const path = `${kind}/${rand()}.${safeExt(file.name, 'pdf')}`
  const { error } = await c.storage.from('applicants').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  return path
}

/** Generate a short-lived signed URL for a private object. */
export async function signedUrl(
  bucket: 'medical-certificates' | 'applicants',
  path: string,
  ttlSec = 300,
) {
  const c = client()
  const { data, error } = await c.storage.from(bucket).createSignedUrl(path, ttlSec)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
