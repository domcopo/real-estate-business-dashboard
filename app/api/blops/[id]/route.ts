import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * PUT /api/blops/[id] - Update a single blop
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const blopId = params.id
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('blops')
      .update({
        x: body.x,
        y: body.y,
        shape: body.shape,
        color: body.color,
        content: body.content,
        type: body.type,
        tags: body.tags,
        connections: body.connections,
      })
      .eq('id', blopId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating blop:', error)
      return NextResponse.json(
        { error: 'Failed to update blop', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, blop: data })
  } catch (error: any) {
    console.error('Error in PUT /api/blops/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blops/[id] - Delete a blop
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const blopId = params.id

    const { error } = await supabaseAdmin
      .from('blops')
      .delete()
      .eq('id', blopId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting blop:', error)
      return NextResponse.json(
        { error: 'Failed to delete blop', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/blops/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

