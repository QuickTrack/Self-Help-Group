import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Meeting } from '@/lib/server/models';
import mongoose from 'mongoose';

interface MeetingDoc {
  _id: { toString(): string };
  title: string;
  date: Date;
  time: string;
  location: string;
  agenda?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    await dbConnect();

    if (!mongoose.isValidObjectId(meetingId)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, date, time, location, agenda } = body;

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { title, date, time, location, agenda },
      { new: true }
    );

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    await dbConnect();

    if (!mongoose.isValidObjectId(meetingId)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    const meeting = await Meeting.findById(meetingId).lean() as MeetingDoc | null;
    
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    
    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}