import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { LifeEventType } from '@/lib/server/models/LifeEventType';

const DEFAULT_LIFE_EVENT_TYPES = [
  { name: 'Bereavement', maxCompensation: 20000 },
  { name: 'Wedding', maxCompensation: 15000 },
  { name: 'Celebration', maxCompensation: 10000 },
  { name: 'Medical', maxCompensation: 25000 },
  { name: 'Disaster', maxCompensation: 30000 },
];

async function seedDefaultEventTypes() {
  const existingCount = await LifeEventType.countDocuments();
  if (existingCount === 0) {
    await LifeEventType.insertMany(DEFAULT_LIFE_EVENT_TYPES);
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await seedDefaultEventTypes();

    const lifeEventTypes = await LifeEventType.find({}).lean();

    const eventTypes = lifeEventTypes.map(e => ({
      name: e.name,
      maxCompensation: e.maxCompensation,
    }));

    return NextResponse.json({ eventTypes });
  } catch (error) {
    console.error('Get event types for payout error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types', eventTypes: DEFAULT_LIFE_EVENT_TYPES },
      { status: 500 }
    );
  }
}
