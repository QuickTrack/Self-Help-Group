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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 500);

    const query: Record<string, unknown> = {};
    
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
      .limit(limit)
      .lean();

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
      { error: 'Failed to fetch members', members: [] },
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

    const query: any[] = [
      { idNumber },
      { phoneNumber },
    ];
    
    if (email) {
      query.push({ email });
    }

    const existingMember = await Member.findOne({ 
      $or: query 
    });

    if (existingMember) {
      let field = 'this information';
      if (existingMember.idNumber === idNumber) field = 'ID number';
      else if (existingMember.phoneNumber === phoneNumber) field = 'phone number';
      else if (existingMember.email === email) field = 'email';
      
      return NextResponse.json(
        { error: `A member with this ${field} already exists` },
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
      location: (location && ['Githirioni', 'Lari', 'Kiambu', 'Other'].includes(location)) ? location : 'Githirioni',
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const member = await Member.findById(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await Member.findByIdAndDelete(id);
    await Savings.findOneAndDelete({ member: id });

    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}