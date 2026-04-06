import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { LifeEventType } from '@/lib/server/models/LifeEventType';

const DEFAULT_LIFE_EVENT_TYPES = [
  { name: 'Bereavement', description: 'Death of a family member', maxCompensation: 20000 },
  { name: 'Wedding', description: 'Marriage celebration', maxCompensation: 15000 },
  { name: 'Celebration', description: 'Birthday, graduation, or other celebrations', maxCompensation: 10000 },
  { name: 'Medical', description: 'Medical emergency or hospitalization', maxCompensation: 25000 },
  { name: 'Disaster', description: 'House fire, flood, or natural disaster', maxCompensation: 30000 },
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

    const formattedTypes = lifeEventTypes.map(e => ({
      _id: (e._id as unknown as string).toString(),
      name: e.name,
      description: e.description,
      maxCompensation: e.maxCompensation,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return NextResponse.json({ lifeEventTypes: formattedTypes });
  } catch (error) {
    console.error('Get life event types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch life event types', lifeEventTypes: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, description, maxCompensation } = body;

    if (!name || !description || maxCompensation === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and max compensation are required' },
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

    const maxComp = Number(maxCompensation);
    if (isNaN(maxComp) || maxComp < 0 || maxComp > 1000000) {
      return NextResponse.json(
        { error: 'Max compensation must be a positive number up to 1,000,000' },
        { status: 400 }
      );
    }

    const existingEventType = await LifeEventType.findOne({
      name: { $regex: new RegExp(`^${nameTrimmed}$`, 'i') },
    });

    if (existingEventType) {
      return NextResponse.json(
        { error: 'A life event type with this name already exists' },
        { status: 409 }
      );
    }

    const lifeEventType = new LifeEventType({
      name: nameTrimmed,
      description: descriptionTrimmed,
      maxCompensation: maxComp,
    });

    await lifeEventType.save();

    return NextResponse.json({
      lifeEventType: {
        _id: lifeEventType._id.toString(),
        name: lifeEventType.name,
        description: lifeEventType.description,
        maxCompensation: lifeEventType.maxCompensation,
        createdAt: lifeEventType.createdAt,
        updatedAt: lifeEventType.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create life event type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}