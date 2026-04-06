import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Group } from '@/lib/server/models/Group';
import { getGroupCacheKey, invalidateGroupCache } from '@/lib/server/utils/groupCache';
import { groupCache } from '@/lib/server/utils/groupCache';

const CACHE_TTL = 30000;

export async function GET() {
  try {
    await dbConnect();
    
    const cacheKey = getGroupCacheKey();
    const cached = groupCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ groups: cached, fromCache: true });
    }
    
    const groups = await Group.find({ isActive: true }).sort({ created_at: -1 }).lean();
    
    const serialized = groups.map((g: any) => ({
      id: g._id.toString(),
      name: g.name,
      description: g.description,
      location: g.location,
      contactEmail: g.contactEmail,
      contactPhone: g.contactPhone,
      registrationNumber: g.registrationNumber,
      foundedDate: g.foundedDate?.toISOString(),
      defaultCurrency: g.defaultCurrency,
      logo: g.logo,
      address: g.address,
      settings: g.settings,
      created_at: g.created_at?.toISOString(),
      updated_at: g.updated_at?.toISOString(),
    }));
    
    groupCache.set(cacheKey, serialized, CACHE_TTL);
    
    return NextResponse.json({ groups: serialized });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, description, location, contactEmail, contactPhone, registrationNumber, foundedDate, defaultCurrency, logo, address, settings } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }
    
    const group = await Group.create({
      name,
      description,
      location,
      contactEmail,
      contactPhone,
      registrationNumber,
      foundedDate,
      defaultCurrency: defaultCurrency || 'KES',
      logo,
      address,
      settings,
    });
    
    invalidateGroupCache();
    
    return NextResponse.json({
      group: {
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        created_at: group.created_at?.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}