// Shared in-memory data store for mock API responses
// This simulates a database and allows state sharing between API routes

interface MasterReference {
  id: number
  name: string
  description?: string | null
  file_name: string
  is_active: boolean
  created_at: string
  creator: {
    id: number
    username: string
    full_name: string
    is_active: boolean
    created_at: string
  }
}

// In-memory storage
let masterReferences: MasterReference[] = [
  {
    id: 1,
    name: 'WHO Growth Standards',
    description: 'Standard WHO growth reference tables',
    file_name: 'who_standards.xlsx',
    is_active: true,
    created_at: new Date().toISOString(),
    creator: {
      id: 1,
      username: 'admin',
      full_name: 'Administrator',
      is_active: true,
      created_at: new Date().toISOString()
    }
  }
]

let nextId = 2

// CRUD operations for master references
export function getMasterReferences(): MasterReference[] {
  return [...masterReferences] // Return a copy to prevent direct mutation
}

export function addMasterReference(data: {
  name: string
  description?: string | null
  file_name: string
}): MasterReference {
  const newReference: MasterReference = {
    id: nextId++,
    name: data.name,
    description: data.description || null,
    file_name: data.file_name,
    is_active: true,
    created_at: new Date().toISOString(),
    creator: {
      id: 1,
      username: 'admin',
      full_name: 'Administrator',
      is_active: true,
      created_at: new Date().toISOString()
    }
  }

  masterReferences.push(newReference)
  console.log('Added master reference:', newReference)
  console.log('Total master references:', masterReferences.length)

  return newReference
}

export function updateMasterReference(
  id: number,
  data: { name: string; description?: string | null }
): MasterReference | null {
  const index = masterReferences.findIndex(ref => ref.id === id)

  if (index === -1) {
    return null
  }

  masterReferences[index] = {
    ...masterReferences[index],
    name: data.name,
    description: data.description || null,
  }

  console.log('Updated master reference:', masterReferences[index])
  return masterReferences[index]
}

export function deleteMasterReference(id: number): MasterReference | null {
  const index = masterReferences.findIndex(ref => ref.id === id)

  if (index === -1) {
    return null
  }

  const deletedReference = masterReferences.splice(index, 1)[0]
  console.log('Deleted master reference:', deletedReference)
  console.log('Total master references after deletion:', masterReferences.length)

  return deletedReference
}

export function getMasterReferenceById(id: number): MasterReference | null {
  const reference = masterReferences.find(ref => ref.id === id)
  return reference || null
}

// Jobs storage and operations
interface Job {
  id: string
  analyzer_name: string
  analyzer_institution: string
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  summary?: {
    total_anak: number
    total_records: number
    valid: number
    warning: number
    error: number
    missing: number
  }
}

// Start with empty jobs array - only new analyses will be shown
let jobs: Job[] = []

export function getJobs(limit: number = 50, offset: number = 0): Job[] {
  const paginatedJobs = jobs.slice(offset, offset + limit)
  console.log(`GET jobs: returning ${paginatedJobs.length} jobs (offset: ${offset}, limit: ${limit})`)
  return paginatedJobs
}

export function deleteJob(jobId: string): Job | null {
  const index = jobs.findIndex(job => job.id === jobId)

  if (index === -1) {
    console.log(`DELETE job: job ${jobId} not found`)
    return null
  }

  const deletedJob = jobs.splice(index, 1)[0]
  console.log(`DELETE job: deleted job ${deletedJob.id} (${deletedJob.analyzer_name})`)
  console.log('Total jobs after deletion:', jobs.length)

  return deletedJob
}

export function addJob(jobData: Omit<Job, 'id' | 'created_at'>): Job {
  const newJob: Job = {
    id: 'mock-job-' + Date.now(),
    created_at: new Date().toISOString(),
    ...jobData
  }

  jobs.unshift(newJob) // Add to beginning (newest first)
  console.log(`ADD job: created job ${newJob.id} (${newJob.analyzer_name})`)
  console.log('Total jobs after addition:', jobs.length)

  return newJob
}