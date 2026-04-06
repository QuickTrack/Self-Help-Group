import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Group } from '@/lib/server/models/Group';
import { getGroupCacheKey, invalidateGroupCache } from '@/lib/server/utils/groupCache';
import { groupCache } from '@/lib/server/utils/groupCache';

const CACHE_TTL = 30000;

interface GroupDoc {
  _id: { toString(): string };
  name: string;
  description?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationNumber?: string;
  foundedDate?: Date;
  defaultCurrency: string;
  logo?: string;
  address?: any;
  settings?: any;
  isActive: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const cacheKey = getGroupCacheKey(id);
    const cached = groupCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ group: cached, fromCache: true });
    }
    
    const group = await Group.findById(id).lean() as GroupDoc | null;
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    const serialized = {
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      location: group.location,
      contactEmail: group.contactEmail,
      contactPhone: group.contactPhone,
      registrationNumber: group.registrationNumber,
      foundedDate: group.foundedDate?.toISOString(),
      defaultCurrency: group.defaultCurrency,
      logo: group.logo,
      address: group.address,
      settings: group.settings,
      created_at: group.created_at?.toISOString(),
      updated_at: group.updated_at?.toISOString(),
    };
    
    groupCache.set(cacheKey, serialized, CACHE_TTL);
    
    return NextResponse.json({ group: serialized });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const body = await request.json();
    const { name, description, location, contactEmail, contactPhone, registrationNumber, foundedDate, defaultCurrency, logo, address, settings, isActive } = body;
    
    const group = await Group.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(foundedDate && { foundedDate }),
        ...(defaultCurrency && { defaultCurrency }),
        ...(logo !== undefined && { logo }),
        ...(address && { address }),
        ...(settings && { settings }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    ).lean() as GroupDoc | null;
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    invalidateGroupCache(id);
    
    return NextResponse.json({
      group: {
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        updated_at: group.updated_at?.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const group = await Group.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    invalidateGroupCache(id);
    
    return NextResponse.json({ message: 'Group deactivated successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}