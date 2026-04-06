import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Meeting } from '@/lib/server/models';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    
    const meetings = await Meeting.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Meeting.countDocuments();
    
    return NextResponse.json({
      meetings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { title, date, time, location, agenda } = body;
    
    if (!title || !date || !time || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const meeting = await Meeting.create({
      title,
      date: new Date(date),
      time,
      location,
      agenda: agenda || '',
    });
    
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}