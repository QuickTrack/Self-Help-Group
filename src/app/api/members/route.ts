import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/server/utils/db';
import { Member } from '../../../lib/server/models/Member';
import { Savings } from '../../../lib/server/models/Savings';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (location) {
      query.location = location;
    }

    const skip = (page - 1) * limit;
    
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Member.countDocuments(query);

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      fullName,
      idNumber,
      phoneNumber,
      email,
      location,
      nextOfKinName,
      nextOfKinPhone,
      photo,
    } = body;

    if (!fullName || !idNumber || !phoneNumber || !nextOfKinName || !nextOfKinPhone) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const existingMember = await Member.findOne({ 
      $or: [{ idNumber }, { email: email || null }] 
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Member with this ID number or email already exists' },
        { status: 409 }
      );
    }

    const count = await Member.countDocuments();
    const memberId = `GSH-${String(count + 1).padStart(4, '0')}`;

    const member = new Member({
      memberId,
      fullName,
      idNumber,
      phoneNumber,
      email,
      location: location || 'Githirioni',
      nextOfKinName,
      nextOfKinPhone,
      photo,
    });

    await member.save();

    const savings = new Savings({
      member: member._id,
      savingsBalance: 0,
      totalShares: 0,
    });
    await savings.save();

    return NextResponse.json({
      member,
    }, { status: 201 });
  } catch (error) {
    console.error('Create member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}