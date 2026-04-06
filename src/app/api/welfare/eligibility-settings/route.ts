import { NextRequest, NextResponse } from 'next/server';
import { EligibilitySettings, initializeEligibilitySettings } from '@/lib/server/models';
import dbConnect from '@/lib/server/utils/db';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await initializeEligibilitySettings();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const query = category ? { category } : {};
    const settings = await EligibilitySettings.find(query).sort({ category: 1, key: 1 });

    const settingsByCategory: Record<string, any[]> = {};
    settings.forEach(s => {
      if (!settingsByCategory[s.category]) {
        settingsByCategory[s.category] = [];
      }
      settingsByCategory[s.category].push({
        key: s.key,
        value: s.value,
        description: s.description,
        category: s.category,
        updatedAt: s.updatedAt,
        updatedBy: s.updatedBy,
      });
    });

    return NextResponse.json({
      settings,
      settingsByCategory,
    });
  } catch (error) {
    console.error('Error fetching eligibility settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    await initializeEligibilitySettings();

    const body = await request.json();
    const { key, value, userId } = body;

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const existing = await EligibilitySettings.findOne({ key });
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    const oldValue = existing.value;
    existing.value = value;
    if (userId) {
      existing.updatedBy = userId;
    }
    existing.updatedAt = new Date();
    await existing.save();

    return NextResponse.json({
      setting: {
        key: existing.key,
        value: existing.value,
        description: existing.description,
        category: existing.category,
        updatedAt: existing.updatedAt,
      },
      previousValue: oldValue,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Error updating eligibility setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    await initializeEligibilitySettings();

    const body = await request.json();
    const { settings, userId } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 });
    }

    const updates: any[] = [];

    for (const item of settings) {
      const existing = await EligibilitySettings.findOne({ key: item.key });
      if (existing) {
        const oldValue = existing.value;
        existing.value = item.value;
        if (userId) {
          existing.updatedBy = userId;
        }
        existing.updatedAt = new Date();
        await existing.save();
        updates.push({
          key: item.key,
          oldValue,
          newValue: item.value,
        });
      }
    }

    return NextResponse.json({
      message: `${updates.length} settings updated successfully`,
      updates,
    });
  } catch (error) {
    console.error('Error batch updating eligibility settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
