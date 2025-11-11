import { NextRequest, NextResponse } from 'next/server'
import {
  getAnalysisResults,
  getAnalysisResultById,
  deleteAnalysisResult,
  searchAnalysisResults,
  filterAnalysisResultsByDate,
  getAnalysisStatistics
} from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Get Analysis Results API Called ===')

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''
    const id = searchParams.get('id') || ''

    // If ID is provided, return specific analysis
    if (id) {
      const analysis = getAnalysisResultById(id)
      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      console.log(`GET analysis by ID: ${id}`)
      return NextResponse.json(analysis)
    }

    // Get all analyses with optional filters
    let results = getAnalysisResults(limit, offset)

    // Apply search filter
    if (search) {
      results = searchAnalysisResults(search)
      console.log(`Applied search filter: "${search}", ${results.length} results`)
    }

    // Apply date filter
    if (startDate && endDate) {
      results = filterAnalysisResultsByDate(startDate, endDate)
      console.log(`Applied date filter: ${startDate} to ${endDate}, ${results.length} results`)
    }

    // Get statistics
    const stats = getAnalysisStatistics()

    console.log(`GET analyses: returning ${results.length} results`)

    return NextResponse.json({
      results,
      pagination: {
        limit,
        offset,
        total: results.length,
        hasMore: results.length === limit
      },
      statistics: stats
    })

  } catch (error) {
    console.error('Get analyses API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Delete Analysis API Called ===')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    const success = deleteAnalysisResult(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    console.log(`DELETE analysis: ${id}`)

    return NextResponse.json({
      message: 'Analysis deleted successfully',
      id: id
    })

  } catch (error) {
    console.error('Delete analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}