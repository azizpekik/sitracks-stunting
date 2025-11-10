import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('=== Download Master Reference API Called ===')
    console.log('Master Reference ID:', id)

    // Mock file download
    // In a real implementation, this would fetch and return the actual file

    const mockFileName = 'who_standards.xlsx'
    const mockFileContent = 'Mock Excel file content for WHO standards'

    // Create response with appropriate headers
    const response = new NextResponse(mockFileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${mockFileName}"`,
      },
    })

    console.log(`Downloaded master reference ${id}: ${mockFileName}`)

    return response

  } catch (error) {
    console.error('Download master reference error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}