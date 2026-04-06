import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { EventType } from '@/lib/server/models/EventType';

const HARDCODED_EVENT_TYPES = [
  { name: 'Meeting', description: 'Group meetings and assemblies', isHardcoded: true },
  { name: 'Contribution', description: 'Member contribution sessions', isHardcoded: true },
  { name: 'Loan Application', description: 'Loan application and approval periods', isHardcoded: true },
  { name: 'Loan Repayment', description: 'Loan repayment collection', isHardcoded: true },
  { name: 'Welfare Payout', description: 'Welfare benefit distributions', isHardcoded: true },
  { name: 'Training', description: 'Financial literacy and training sessions', isHardcoded: true },
  { name: 'Audit', description: 'Financial audit and review sessions', isHardcoded: true },
];

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const customEventTypes = await EventType.find({ isHardcoded: false }).lean();

    const allEventTypes = [
      ...HARDCODED_EVENT_TYPES.map((e, index) => ({
        _id: `hardcoded-${index}`,
        name: e.name,
        description: e.description,
        isHardcoded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      ...customEventTypes.map(e => ({
        _id: (e._id as unknown as string).toString(),
        name: e.name,
        description: e.description,
        isHardcoded: e.isHardcoded,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    ];

    return NextResponse.json({ eventTypes: allEventTypes });
  } catch (error) {
    console.error('Get event types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types', eventTypes: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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

    const existingEventType = await EventType.findOne({
      name: { $regex: new RegExp(`^${nameTrimmed}$`, 'i') },
    });

    if (existingEventType) {
      return NextResponse.json(
        { error: 'An event type with this name already exists' },
        { status: 409 }
      );
    }

    const isDuplicateHardcoded = HARDCODED_EVENT_TYPES.some(
      e => e.name.toLowerCase() === nameTrimmed.toLowerCase()
    );

    if (isDuplicateHardcoded) {
      return NextResponse.json(
        { error: 'An event type with this name already exists (hardcoded)' },
        { status: 409 }
      );
    }

    const eventType = new EventType({
      name: nameTrimmed,
      description: descriptionTrimmed,
      isHardcoded: false,
    });

    await eventType.save();

    return NextResponse.json({
      eventType: {
        _id: eventType._id.toString(),
        name: eventType.name,
        description: eventType.description,
        isHardcoded: eventType.isHardcoded,
        createdAt: eventType.createdAt,
        updatedAt: eventType.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create event type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
