import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { LifeEventType } from '@/lib/server/models/LifeEventType';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

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

    const existingEventType = await LifeEventType.findById(id);

    if (!existingEventType) {
      return NextResponse.json(
        { error: 'Life event type not found' },
        { status: 404 }
      );
    }

    const duplicateEventType = await LifeEventType.findOne({
      name: { $regex: new RegExp(`^${nameTrimmed}$`, 'i') },
      _id: { $ne: id },
    });

    if (duplicateEventType) {
      return NextResponse.json(
        { error: 'A life event type with this name already exists' },
        { status: 409 }
      );
    }

    existingEventType.name = nameTrimmed;
    existingEventType.description = descriptionTrimmed;
    existingEventType.maxCompensation = maxComp;
    await existingEventType.save();

    return NextResponse.json({
      lifeEventType: {
        _id: existingEventType._id.toString(),
        name: existingEventType.name,
        description: existingEventType.description,
        maxCompensation: existingEventType.maxCompensation,
        createdAt: existingEventType.createdAt,
        updatedAt: existingEventType.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update life event type error:', error);
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

    console.log('DELETE request received for id:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId:', id);
      return NextResponse.json(
        { error: 'Invalid event type ID' },
        { status: 400 }
      );
    }

    const existingEventType = await LifeEventType.findById(id);
    console.log('Found event type:', existingEventType);

    if (!existingEventType) {
      return NextResponse.json(
        { error: 'Life event type not found' },
        { status: 404 }
      );
    }

    await LifeEventType.findByIdAndDelete(id);
    console.log('Deleted successfully');

    return NextResponse.json({ message: 'Life event type deleted successfully' });
  } catch (error) {
    console.error('Delete life event type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
