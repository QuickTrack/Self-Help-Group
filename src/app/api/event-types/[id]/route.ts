import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { EventType } from '@/lib/server/models/EventType';

const HARDCODED_EVENT_TYPES = [
  'Meeting',
  'Contribution',
  'Loan Application',
  'Loan Repayment',
  'Welfare Payout',
  'Training',
  'Audit',
];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (id.startsWith('hardcoded-')) {
      return NextResponse.json(
        { error: 'Cannot modify hardcoded event types' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const nameTrimmed = name.trim();
    const descriptionTrimmed = description.trim();

    if (nameTrimmed.length < 2 || nameTrimmed.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    if (descriptionTrimmed.length < 5 || descriptionTrimmed.length > 200) {
      return NextResponse.json(
        { error: 'Description must be between 5 and 200 characters' },
        { status: 400 }
      );
    }

    const existingEventType = await EventType.findById(id);

    if (!existingEventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    if (existingEventType.isHardcoded) {
      return NextResponse.json(
        { error: 'Cannot modify hardcoded event types' },
        { status: 403 }
      );
    }

    const duplicateEventType = await EventType.findOne({
      name: { $regex: new RegExp(`^${nameTrimmed}$`, 'i') },
      _id: { $ne: id },
    });

    if (duplicateEventType) {
      return NextResponse.json(
        { error: 'An event type with this name already exists' },
        { status: 409 }
      );
    }

    const isDuplicateHardcoded = HARDCODED_EVENT_TYPES.some(
      e => e.toLowerCase() === nameTrimmed.toLowerCase()
    );

    if (isDuplicateHardcoded) {
      return NextResponse.json(
        { error: 'An event type with this name already exists (hardcoded)' },
        { status: 409 }
      );
    }

    existingEventType.name = nameTrimmed;
    existingEventType.description = descriptionTrimmed;
    await existingEventType.save();

    return NextResponse.json({
      eventType: {
        _id: existingEventType._id.toString(),
        name: existingEventType.name,
        description: existingEventType.description,
        isHardcoded: existingEventType.isHardcoded,
        createdAt: existingEventType.createdAt,
        updatedAt: existingEventType.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update event type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (id.startsWith('hardcoded-')) {
      return NextResponse.json(
        { error: 'Cannot delete hardcoded event types' },
        { status: 403 }
      );
    }

    const existingEventType = await EventType.findById(id);

    if (!existingEventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    if (existingEventType.isHardcoded) {
      return NextResponse.json(
        { error: 'Cannot delete hardcoded event types' },
        { status: 403 }
      );
    }

    await EventType.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Event type deleted successfully' });
  } catch (error) {
    console.error('Delete event type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
